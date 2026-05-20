/**
 * Open a long position with a stop-loss, push the price below the stop,
 * and watch the keeper fire the SL.
 *
 *     ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
 *     ANCHOR_WALLET=~/.config/solana/id.json \
 *     yarn ts-node examples/long-stop-loss.ts
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

  console.log("seed price 152.000000");
  await pushPrice(program, feed, feedAuthority, new BN(152_000_000));

  console.log("open long at 152, stop 145, no tp, no trailing");
  await program.methods
    .openPosition(
      nonce,
      0, // side long
      new BN(0.05 * LAMPORTS_PER_SOL),
      new BN(145_000_000),
      new BN(0),
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

  for (const next of [150_000_000, 147_000_000, 143_000_000]) {
    console.log(`push price ${(next / 1_000_000).toFixed(6)}`);
    await pushPrice(program, feed, feedAuthority, new BN(next));

    const configAcc = await program.account.config.fetch(config);
    const tx = await program.methods
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
    console.log("  tick tx", tx);

    const pos = await program.account.position.fetch(position);
    if (pos.status !== 0) {
      console.log("  fired, status =", pos.status, "reason =", pos.triggerReason);
      break;
    }
  }

  const final = await program.account.position.fetch(position);
  console.log("final status:", final.status, "trigger:", final.triggerReason);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
