import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Hwal } from "../target/types/hwal";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const CONFIG_SEED = Buffer.from("config");
const FEED_SEED = Buffer.from("feed");
const POSITION_SEED = Buffer.from("position");

const SIDE_LONG = 0;
const STATUS_OPEN = 0;
const STATUS_TRIGGERED = 1;

function symbolBytes(s: string): Buffer {
  const buf = Buffer.alloc(16);
  Buffer.from(s, "utf8").copy(buf);
  return buf;
}

function nonceBytes(n: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(n));
  return buf;
}

async function airdropOrSkip(connection: any, pk: PublicKey, sol: number) {
  try {
    const sig = await connection.requestAirdrop(pk, sol * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.hwal as Program<Hwal>;

  const wallet = (provider.wallet as anchor.Wallet).payer;
  console.log("==> hwal devnet smoke test");
  console.log("    program:", program.programId.toBase58());
  console.log("    funder :", wallet.publicKey.toBase58());

  const feedAuthorityPath = path.join(
    process.env.HOME ?? process.env.USERPROFILE ?? ".",
    ".config",
    "solana",
    "hwal-feed-authority.json",
  );
  const feedAuthority = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(feedAuthorityPath, "utf8"))),
  );

  const symbol = symbolBytes("SOL");
  const [configPda] = PublicKey.findProgramAddressSync(
    [CONFIG_SEED],
    program.programId,
  );
  const [feedPda] = PublicKey.findProgramAddressSync(
    [FEED_SEED, symbol],
    program.programId,
  );
  const config = await program.account.config.fetch(configPda);
  console.log("    config :", configPda.toBase58());
  console.log("    feed   :", feedPda.toBase58());
  console.log("    fee_rcv:", config.feeReceiver.toBase58());

  const trader = Keypair.generate();
  const keeper = Keypair.generate();

  console.log("==> funding trader + keeper from wallet");
  const fundTx = new (await import("@solana/web3.js")).Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: trader.publicKey,
      lamports: 0.15 * LAMPORTS_PER_SOL,
    }),
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: keeper.publicKey,
      lamports: 0.02 * LAMPORTS_PER_SOL,
    }),
  );
  const fundSig = await provider.sendAndConfirm(fundTx, []);
  console.log("    funded :", fundSig);

  console.log("==> pushing initial price 150.000000");
  await program.methods
    .updatePriceFeed(new BN(150_000_000))
    .accountsStrict({ authority: feedAuthority.publicKey, feed: feedPda })
    .signers([feedAuthority])
    .rpc();

  const nonce = new BN(Date.now() % 1_000_000);
  const [positionPda] = PublicKey.findProgramAddressSync(
    [
      POSITION_SEED,
      trader.publicKey.toBuffer(),
      nonceBytes(BigInt(nonce.toString())),
    ],
    program.programId,
  );

  console.log("==> opening long position");
  console.log("    nonce      :", nonce.toString());
  console.log("    position   :", positionPda.toBase58());
  console.log("    collateral : 0.05 SOL");
  console.log("    stop_loss  : 140.000000");
  console.log("    take_profit: 155.000000");

  await program.methods
    .openPosition(
      nonce,
      SIDE_LONG,
      new BN(0.05 * LAMPORTS_PER_SOL),
      new BN(140_000_000),
      new BN(155_000_000),
      new BN(0),
    )
    .accountsStrict({
      owner: trader.publicKey,
      config: configPda,
      feed: feedPda,
      position: positionPda,
      systemProgram: SystemProgram.programId,
    })
    .signers([trader])
    .rpc();

  let position = await program.account.position.fetch(positionPda);
  console.log("    opened, status =", position.status, "entry =", position.entryPrice.toString());

  console.log("==> ticking at 150 (no trigger expected)");
  await program.methods
    .tickPosition()
    .accountsStrict({
      keeper: keeper.publicKey,
      config: configPda,
      feed: feedPda,
      position: positionPda,
      owner: trader.publicKey,
      feeReceiver: config.feeReceiver,
    })
    .signers([keeper])
    .rpc();
  position = await program.account.position.fetch(positionPda);
  console.log("    tick_count =", position.tickCount.toString(), "status =", position.status);

  console.log("==> pushing price 160.000000 (above take-profit)");
  await program.methods
    .updatePriceFeed(new BN(160_000_000))
    .accountsStrict({ authority: feedAuthority.publicKey, feed: feedPda })
    .signers([feedAuthority])
    .rpc();

  const traderBalBefore = await provider.connection.getBalance(trader.publicKey);
  const keeperBalBefore = await provider.connection.getBalance(keeper.publicKey);
  const feeBalBefore = await provider.connection.getBalance(config.feeReceiver);

  console.log("==> ticking at 160 (take-profit should fire)");
  const sig = await program.methods
    .tickPosition()
    .accountsStrict({
      keeper: keeper.publicKey,
      config: configPda,
      feed: feedPda,
      position: positionPda,
      owner: trader.publicKey,
      feeReceiver: config.feeReceiver,
    })
    .signers([keeper])
    .rpc();
  console.log("    tick sig:", sig);

  position = await program.account.position.fetch(positionPda);
  console.log("    status        =", position.status, position.status === STATUS_TRIGGERED ? "(TRIGGERED)" : "");
  console.log("    trigger_reason=", position.triggerReason, "(1=stop, 2=tp, 3=trail)");
  console.log("    settled_at    =", position.settledAt.toString());

  const traderBalAfter = await provider.connection.getBalance(trader.publicKey);
  const keeperBalAfter = await provider.connection.getBalance(keeper.publicKey);
  const feeBalAfter = await provider.connection.getBalance(config.feeReceiver);

  console.log("==> settlement check");
  console.log("    trader: +", (traderBalAfter - traderBalBefore) / LAMPORTS_PER_SOL, "SOL");
  console.log("    keeper: +", (keeperBalAfter - keeperBalBefore) / LAMPORTS_PER_SOL, "SOL");
  console.log("    fee_rx: +", (feeBalAfter - feeBalBefore) / LAMPORTS_PER_SOL, "SOL");

  if (position.status !== STATUS_TRIGGERED) {
    throw new Error("position should be TRIGGERED");
  }
  if (position.triggerReason !== 2) {
    throw new Error("trigger_reason should be take-profit (2)");
  }
  if (traderBalAfter <= traderBalBefore) {
    throw new Error("trader did not receive settlement");
  }
  if (keeperBalAfter <= keeperBalBefore + 5000) {
    throw new Error("keeper did not earn reward (net of tx fee)");
  }
  if (feeBalAfter <= feeBalBefore) {
    throw new Error("fee receiver did not get fee");
  }

  console.log("\n==> smoke test PASSED on devnet.");
  console.log("    explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
