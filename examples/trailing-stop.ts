/**
 * Open a long position with a trailing stop. Ratchet the price up,
 * then drop it through the trailing offset, watch the keeper fire.
 *
 *     yarn ts-node examples/trailing-stop.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import { Hwal } from "../target/types/hwal";

const CONFIG_SEED = Buffer.from("config");
const FEED_SEED = Buffer.from("feed");
const POSITION_SEED = Buffer.from("position");
const VAULT_SEED = Buffer.from("vault");

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

async function pushPrice(
  program: Program<Hwal>,
  feed: PublicKey,
  authority: Keypair,
  newPrice: BN,
): Promise<void> {
  await program.methods
    .updatePriceFeed(newPrice)
    .accounts({ feed, authority: authority.publicKey })
    .signers([authority])
    .rpc();
}

async function tick(
  program: Program<Hwal>,
  position: PublicKey,
  vault: PublicKey,
  feed: PublicKey,
  config: PublicKey,
  feeReceiver: PublicKey,
  keeper: PublicKey,
  owner: PublicKey,
): Promise<void> {
  await program.methods
    .tickPosition()
    .accounts({
      position,
      vault,
      feed,
      config,
      feeReceiver,
      keeper,
      owner,
    })
    .rpc();
}

async function main(): Promise<void> {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.hwal as Program<Hwal>;

  const wallet = (provider.wallet as anchor.Wallet).payer;
  const feedAuthorityPath = path.join(
    process.env.HOME ?? process.env.USERPROFILE ?? ".",
    ".config",
    "solana",
    "hwal-feed-authority.json",
  );
  const feedAuthority = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(feedAuthorityPath, "utf8"))),
  );

  const [config] = PublicKey.findProgramAddressSync([CONFIG_SEED], program.programId);
  const [feed] = PublicKey.findProgramAddressSync(
    [FEED_SEED, symbolBytes("SOL")],
    program.programId,
  );

  const nonce = new BN(Date.now());
  const [position] = PublicKey.findProgramAddressSync(
    [POSITION_SEED, wallet.publicKey.toBuffer(), nonceBytes(nonce.toString())],
    program.programId,
  );
  const [vault] = PublicKey.findProgramAddressSync(
    [VAULT_SEED, position.toBuffer()],
    program.programId,
  );

  console.log("seed price 150.000000");
  await pushPrice(program, feed, feedAuthority, new BN(150_000_000));

  console.log("open long at 150, no stop, no tp, trailing offset 5.000000");
  await program.methods
    .openPosition(
      nonce,
      0, // long
      new BN(0.05 * LAMPORTS_PER_SOL),
      new BN(0),
      new BN(0),
      new BN(5_000_000),
    )
    .accounts({
      position,
      vault,
      feed,
      owner: wallet.publicKey,
    })
    .rpc();
  console.log("position:", position.toBase58());

  const configAcc = await program.account.config.fetch(config);

  // ratchet up; trailing extreme should advance to 165.
  for (const next of [155_000_000, 160_000_000, 165_000_000]) {
    console.log(`push ${(next / 1_000_000).toFixed(6)}`);
    await pushPrice(program, feed, feedAuthority, new BN(next));
    await tick(
      program,
      position,
      vault,
      feed,
      config,
      configAcc.feeReceiver,
      wallet.publicKey,
      wallet.publicKey,
    );
    const pos = await program.account.position.fetch(position);
    console.log(`  trailing_extreme = ${pos.trailingExtreme.toString()}`);
  }

  // Drop to 159: 165 - 5 = 160, 159 < 160 -> trailing fires.
  console.log("push 159.000000 (should fire trailing)");
  await pushPrice(program, feed, feedAuthority, new BN(159_000_000));
  await tick(
    program,
    position,
    vault,
    feed,
    config,
    configAcc.feeReceiver,
    wallet.publicKey,
    wallet.publicKey,
  );

  const final = await program.account.position.fetch(position);
  console.log("status:", final.status, "trigger:", final.triggerReason);
  if (final.status === 1 && final.triggerReason === 3) {
    console.log("trailing stop fired as expected");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
