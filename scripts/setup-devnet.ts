import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Hwal } from "../target/types/hwal";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const CONFIG_SEED = Buffer.from("config");
const FEED_SEED = Buffer.from("feed");

function symbolBytes(s: string): Buffer {
  const buf = Buffer.alloc(16);
  Buffer.from(s, "utf8").copy(buf);
  return buf;
}

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.hwal as Program<Hwal>;

  const admin = (provider.wallet as anchor.Wallet).payer;
  console.log("admin:", admin.publicKey.toBase58());
  console.log("program:", program.programId.toBase58());

  const feedAuthorityPath = path.join(
    process.env.HOME ?? process.env.USERPROFILE ?? ".",
    ".config",
    "solana",
    "hwal-feed-authority.json",
  );

  let feedAuthority: Keypair;
  if (fs.existsSync(feedAuthorityPath)) {
    const secret = JSON.parse(fs.readFileSync(feedAuthorityPath, "utf8"));
    feedAuthority = Keypair.fromSecretKey(Uint8Array.from(secret));
    console.log("feed authority (existing):", feedAuthority.publicKey.toBase58());
  } else {
    feedAuthority = Keypair.generate();
    fs.writeFileSync(
      feedAuthorityPath,
      JSON.stringify(Array.from(feedAuthority.secretKey)),
    );
    console.log("feed authority (new):", feedAuthority.publicKey.toBase58());
    console.log("written to:", feedAuthorityPath);
  }

  const [configPda] = PublicKey.findProgramAddressSync(
    [CONFIG_SEED],
    program.programId,
  );

  let configExists = false;
  try {
    await program.account.config.fetch(configPda);
    configExists = true;
  } catch {
    configExists = false;
  }

  if (!configExists) {
    console.log("initializing config...");
    const sig = await program.methods
      .initializeConfig(50, 25)
      .accountsStrict({
        admin: admin.publicKey,
        feeReceiver: admin.publicKey,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("config initialized:", sig);
  } else {
    console.log("config already initialized at", configPda.toBase58());
  }

  const symbol = symbolBytes("SOL");
  const [feedPda] = PublicKey.findProgramAddressSync(
    [FEED_SEED, symbol],
    program.programId,
  );

  let feedExists = false;
  try {
    await program.account.priceFeed.fetch(feedPda);
    feedExists = true;
  } catch {
    feedExists = false;
  }

  if (!feedExists) {
    console.log("initializing SOL price feed...");
    const sig = await program.methods
      .initializePriceFeed(
        Array.from(symbol) as any,
        6,
        new BN(150_000_000),
      )
      .accountsStrict({
        admin: admin.publicKey,
        config: configPda,
        authority: feedAuthority.publicKey,
        feed: feedPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("SOL feed initialized:", sig);
  } else {
    console.log("SOL feed already exists at", feedPda.toBase58());
  }

  console.log("\nsetup complete.");
  console.log("  config:", configPda.toBase58());
  console.log("  sol feed:", feedPda.toBase58());
  console.log("  feed authority:", feedAuthority.publicKey.toBase58());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
