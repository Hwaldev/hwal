import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Hwal } from "../target/types/hwal";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { assert } from "chai";

const CONFIG_SEED = Buffer.from("config");
const FEED_SEED = Buffer.from("feed");
const POSITION_SEED = Buffer.from("position");

const SIDE_LONG = 0;
const SIDE_SHORT = 1;

const STATUS_OPEN = 0;
const STATUS_TRIGGERED = 1;
const STATUS_CANCELLED = 2;

const TRIGGER_STOP_LOSS = 1;
const TRIGGER_TAKE_PROFIT = 2;
const TRIGGER_TRAILING = 3;

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

describe("hwal trigger engine", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.hwal as Program<Hwal>;

  const admin = (provider.wallet as anchor.Wallet).payer;
  const feedAuthority = Keypair.generate();
  const feeReceiver = Keypair.generate();
  const trader = Keypair.generate();
  const keeper = Keypair.generate();

  const symbol = symbolBytes("SOL");

  let configPda: PublicKey;
  let feedPda: PublicKey;

  before("airdrop participants", async () => {
    const sigs = await Promise.all(
      [trader, keeper, feedAuthority].map((kp) =>
        provider.connection.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL),
      ),
    );
    for (const sig of sigs) {
      await provider.connection.confirmTransaction(sig, "confirmed");
    }
    [configPda] = PublicKey.findProgramAddressSync(
      [CONFIG_SEED],
      program.programId,
    );
    [feedPda] = PublicKey.findProgramAddressSync(
      [FEED_SEED, symbol],
      program.programId,
    );
  });

  it("initializes the config", async () => {
    await program.methods
      .initializeConfig(50, 25)
      .accountsStrict({
        admin: admin.publicKey,
        feeReceiver: feeReceiver.publicKey,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.config.fetch(configPda);
    assert.equal(config.feeBps, 50);
    assert.equal(config.keeperRewardBps, 25);
    assert.isTrue(config.admin.equals(admin.publicKey));
    assert.isTrue(config.feeReceiver.equals(feeReceiver.publicKey));
  });

  it("initializes a price feed", async () => {
    const initialPrice = new BN(150_000_000);
    await program.methods
      .initializePriceFeed(Array.from(symbol) as any, 6, initialPrice)
      .accountsStrict({
        admin: admin.publicKey,
        config: configPda,
        authority: feedAuthority.publicKey,
        feed: feedPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const feed = await program.account.priceFeed.fetch(feedPda);
    assert.isTrue(feed.authority.equals(feedAuthority.publicKey));
    assert.equal(feed.decimals, 6);
    assert.equal(feed.price.toString(), initialPrice.toString());
  });

  it("opens a long position and fires take-profit", async () => {
    const nonce = new BN(1);
    const [positionPda] = PublicKey.findProgramAddressSync(
      [POSITION_SEED, trader.publicKey.toBuffer(), nonceBytes(1)],
      program.programId,
    );

    const collateral = new BN(0.05 * LAMPORTS_PER_SOL);
    const stop = new BN(140_000_000);
    const tp = new BN(160_000_000);
    const trailing = new BN(0);

    await program.methods
      .openPosition(nonce, SIDE_LONG, collateral, stop, tp, trailing)
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
    assert.equal(position.side, SIDE_LONG);
    assert.equal(position.status, STATUS_OPEN);
    assert.equal(position.entryPrice.toString(), "150000000");

    await program.methods
      .updatePriceFeed(new BN(162_000_000))
      .accountsStrict({
        authority: feedAuthority.publicKey,
        feed: feedPda,
      })
      .signers([feedAuthority])
      .rpc();

    const ownerBalBefore = await provider.connection.getBalance(
      trader.publicKey,
    );
    const keeperBalBefore = await provider.connection.getBalance(
      keeper.publicKey,
    );
    const feeBalBefore = await provider.connection.getBalance(
      feeReceiver.publicKey,
    );

    await program.methods
      .tickPosition()
      .accountsStrict({
        keeper: keeper.publicKey,
        config: configPda,
        feed: feedPda,
        position: positionPda,
        owner: trader.publicKey,
        feeReceiver: feeReceiver.publicKey,
      })
      .signers([keeper])
      .rpc();

    position = await program.account.position.fetch(positionPda);
    assert.equal(position.status, STATUS_TRIGGERED);
    assert.equal(position.triggerReason, TRIGGER_TAKE_PROFIT);

    const ownerBalAfter = await provider.connection.getBalance(
      trader.publicKey,
    );
    const keeperBalAfter = await provider.connection.getBalance(
      keeper.publicKey,
    );
    const feeBalAfter = await provider.connection.getBalance(
      feeReceiver.publicKey,
    );

    assert.isAbove(ownerBalAfter, ownerBalBefore);
    assert.isAbove(keeperBalAfter, keeperBalBefore);
    assert.isAbove(feeBalAfter, feeBalBefore);
  });

  it("trailing stop fires after extreme retracement", async () => {
    await program.methods
      .updatePriceFeed(new BN(150_000_000))
      .accountsStrict({ authority: feedAuthority.publicKey, feed: feedPda })
      .signers([feedAuthority])
      .rpc();

    const nonce = new BN(2);
    const [positionPda] = PublicKey.findProgramAddressSync(
      [POSITION_SEED, trader.publicKey.toBuffer(), nonceBytes(2)],
      program.programId,
    );

    await program.methods
      .openPosition(
        nonce,
        SIDE_LONG,
        new BN(0.05 * LAMPORTS_PER_SOL),
        new BN(0),
        new BN(0),
        new BN(5_000_000),
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

    await program.methods
      .updatePriceFeed(new BN(170_000_000))
      .accountsStrict({ authority: feedAuthority.publicKey, feed: feedPda })
      .signers([feedAuthority])
      .rpc();

    await program.methods
      .tickPosition()
      .accountsStrict({
        keeper: keeper.publicKey,
        config: configPda,
        feed: feedPda,
        position: positionPda,
        owner: trader.publicKey,
        feeReceiver: feeReceiver.publicKey,
      })
      .signers([keeper])
      .rpc();

    let position = await program.account.position.fetch(positionPda);
    assert.equal(position.status, STATUS_OPEN);
    assert.equal(position.trailingExtreme.toString(), "170000000");

    await program.methods
      .updatePriceFeed(new BN(164_500_000))
      .accountsStrict({ authority: feedAuthority.publicKey, feed: feedPda })
      .signers([feedAuthority])
      .rpc();

    await program.methods
      .tickPosition()
      .accountsStrict({
        keeper: keeper.publicKey,
        config: configPda,
        feed: feedPda,
        position: positionPda,
        owner: trader.publicKey,
        feeReceiver: feeReceiver.publicKey,
      })
      .signers([keeper])
      .rpc();

    position = await program.account.position.fetch(positionPda);
    assert.equal(position.status, STATUS_TRIGGERED);
    assert.equal(position.triggerReason, TRIGGER_TRAILING);
  });

  it("owner can cancel an open position", async () => {
    await program.methods
      .updatePriceFeed(new BN(150_000_000))
      .accountsStrict({ authority: feedAuthority.publicKey, feed: feedPda })
      .signers([feedAuthority])
      .rpc();

    const nonce = new BN(3);
    const [positionPda] = PublicKey.findProgramAddressSync(
      [POSITION_SEED, trader.publicKey.toBuffer(), nonceBytes(3)],
      program.programId,
    );

    await program.methods
      .openPosition(
        nonce,
        SIDE_SHORT,
        new BN(0.05 * LAMPORTS_PER_SOL),
        new BN(160_000_000),
        new BN(140_000_000),
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

    await program.methods
      .cancelPosition()
      .accountsStrict({
        owner: trader.publicKey,
        config: configPda,
        position: positionPda,
      })
      .signers([trader])
      .rpc();

    const position = await program.account.position.fetch(positionPda);
    assert.equal(position.status, STATUS_CANCELLED);
    assert.equal(position.collateral.toString(), "0");
  });
});
