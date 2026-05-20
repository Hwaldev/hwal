/**
 * Open a short position with a take-profit, push the price below the TP,
 * and watch the keeper fire the TP.
 *
 *     yarn ts-node examples/short-take-profit.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import { Chalna } from "../target/types/chalna";

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
  program: Program<Chalna>,
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

async function main(): Promise<void> {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.chalna as Program<Chalna>;

  const wallet = (provider.wallet as anchor.Wallet).payer;
  const feedAuthorityPath = path.join(
    process.env.HOME ?? process.env.USERPROFILE ?? ".",
    ".config",
    "solana",
    "chalna-feed-authority.json",
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

  console.log("seed price 160.000000");
  await pushPrice(program, feed, feedAuthority, new BN(160_000_000));

  console.log("open short at 160, no stop, tp 150, no trailing");
  await program.methods
    .openPosition(
      nonce,
      1, // side short
      new BN(0.05 * LAMPORTS_PER_SOL),
      new BN(0),
      new BN(150_000_000),
      new BN(0),
    )
    .accounts({
      position,
      vault,
      feed,
      owner: wallet.publicKey,
    })
    .rpc();
  console.log("position:", position.toBase58());

  for (const next of [156_000_000, 152_000_000, 149_000_000]) {
    console.log(`push price ${(next / 1_000_000).toFixed(6)}`);
    await pushPrice(program, feed, feedAuthority, new BN(next));

    const configAcc = await program.account.config.fetch(config);
    await program.methods
      .tickPosition()
      .accounts({
        position,
        vault,
        feed,
        config,
        feeReceiver: configAcc.feeReceiver,
        keeper: wallet.publicKey,
        owner: wallet.publicKey,
      })
      .rpc();

    const pos = await program.account.position.fetch(position);
    if (pos.status !== 0) {
      console.log("  fired, reason =", pos.triggerReason);
      break;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
