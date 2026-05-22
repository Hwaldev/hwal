import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Hwal } from "../target/types/hwal";
import { PublicKey } from "@solana/web3.js";

const CONFIG_SEED = Buffer.from("config");
const STATUS_OPEN = 0;

async function tickAll(intervalMs: number) {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.hwal as Program<Hwal>;

  const keeper = (provider.wallet as anchor.Wallet).payer;
  const [configPda] = PublicKey.findProgramAddressSync(
    [CONFIG_SEED],
    program.programId,
  );
  const config = await program.account.config.fetch(configPda);

  console.log("keeper:", keeper.publicKey.toBase58());
  console.log("config:", configPda.toBase58());
  console.log("fee_receiver:", config.feeReceiver.toBase58());

  while (true) {
    try {
      const positions = await program.account.position.all();
      const open = positions.filter((p) => p.account.status === STATUS_OPEN);
      console.log(
        `[tick ${new Date().toISOString()}] ${open.length} open / ${positions.length} total`,
      );

      for (const p of open) {
        try {
          const sig = await program.methods
            .tickPosition()
            .accountsStrict({
              keeper: keeper.publicKey,
              config: configPda,
              feed: p.account.feed,
              position: p.publicKey,
              owner: p.account.owner,
              feeReceiver: config.feeReceiver,
            })
            .rpc();
          console.log(`  tick ${p.publicKey.toBase58().slice(0, 8)}: ${sig.slice(0, 16)}...`);
        } catch (err: any) {
          console.warn(
            `  tick failed ${p.publicKey.toBase58().slice(0, 8)}:`,
            err?.message ?? err,
          );
        }
      }
    } catch (err: any) {
      console.error("loop error:", err?.message ?? err);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

const intervalArg = parseInt(process.argv[2] ?? "500", 10);
tickAll(intervalArg).catch((err) => {
  console.error(err);
  process.exit(1);
});
