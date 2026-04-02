import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Chalna } from "../target/types/chalna";
import { PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const FEED_SEED = Buffer.from("feed");

function symbolBytes(s: string): Buffer {
  const buf = Buffer.alloc(16);
  Buffer.from(s, "utf8").copy(buf);
  return buf;
}

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.chalna as Program<Chalna>;

  const symbol = process.argv[2] ?? "SOL";
  const price = process.argv[3];
  if (!price) {
    console.error("usage: push-price.ts <SYMBOL> <PRICE_USD_x1e6>");
    process.exit(1);
  }

  const feedAuthorityPath = path.join(
    process.env.HOME ?? process.env.USERPROFILE ?? ".",
    ".config",
    "solana",
    "chalna-feed-authority.json",
  );
  const secret = JSON.parse(fs.readFileSync(feedAuthorityPath, "utf8"));
  const feedAuthority = Keypair.fromSecretKey(Uint8Array.from(secret));

  const [feedPda] = PublicKey.findProgramAddressSync(
    [FEED_SEED, symbolBytes(symbol)],
    program.programId,
  );

  const sig = await program.methods
    .updatePriceFeed(new BN(price))
    .accountsStrict({ authority: feedAuthority.publicKey, feed: feedPda })
    .signers([feedAuthority])
    .rpc();
  console.log(`pushed ${symbol} @ ${price}: ${sig}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
