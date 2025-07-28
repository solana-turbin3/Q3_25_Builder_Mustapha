import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorEscrow } from "../target/types/anchor_escrow";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";

import { Keypair, SystemProgram } from "@solana/web3.js";

describe("anchor-escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AnchorEscrow as Program<AnchorEscrow>;

  const maker = Keypair.generate();
  const taker = Keypair.generate();

  let mintA = anchor.web3.PublicKey.default;
  let mintB = anchor.web3.PublicKey.default;

  let makerAtaA: anchor.web3.PublicKey;
  let takerAtaB: anchor.web3.PublicKey;
  let vault: anchor.web3.PublicKey;
  let offerPda: anchor.web3.PublicKey;
  let offerBump: number;

  const depositAmount = 1_000_000;
  const receiveAmount = 500_000;

  it("Airdrops SOL to both users", async () => {
    for (const user of [maker, taker]) {
      const sig = await provider.connection.requestAirdrop(
        user.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    }
  });

  it("Creates token mints and ATAs", async () => {
    mintA = await createMint(
      provider.connection,
      maker,
      maker.publicKey,
      null,
      0 // no decimals for simplicity
    );

    mintB = await createMint(
      provider.connection,
      taker,
      taker.publicKey,
      null,
      0
    );

    makerAtaA = await createAssociatedTokenAccount(
      provider.connection,
      maker,
      mintA,
      maker.publicKey
    );

    takerAtaB = await createAssociatedTokenAccount(
      provider.connection,
      taker,
      mintB,
      taker.publicKey
    );

    // Mint tokens
    await mintTo(
      provider.connection,
      maker,
      mintA,
      makerAtaA,
      maker,
      depositAmount
    );

    await mintTo(
      provider.connection,
      taker,
      mintB,
      takerAtaB,
      taker,
      receiveAmount
    );
  });

  it("Maker makes an offer", async () => {
    [offerPda, offerBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("offer"), maker.publicKey.toBuffer()],
      program.programId
    );

    vault = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: offerPda,
    });

    await program.methods
      .makeOffer(new anchor.BN(depositAmount), new anchor.BN(receiveAmount))
      .accounts({
        maker: maker.publicKey,
        tokenMintA: mintA,
        tokenMintB: mintB,
        makerAtaA,
        offer: offerPda,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc();
  });

  it("Taker accepts the offer", async () => {
    const makerAtaB = await createAssociatedTokenAccount(
      provider.connection,
      taker,
      mintB,
      maker.publicKey
    );

    const takerAtaA = await createAssociatedTokenAccount(
      provider.connection,
      taker,
      mintA,
      taker.publicKey
    );

    await program.methods
      .takeOffer(new anchor.BN(receiveAmount))
      .accounts({
        taker: taker.publicKey,
        maker: maker.publicKey,
        offer: offerPda,
        tokenMintA: mintA,
        tokenMintB: mintB,
        takerAtaA,
        takerAtaB,
        makerAtaB,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([taker])
      .rpc();

    const takerTokenA = await getAccount(provider.connection, takerAtaA);
    const makerTokenB = await getAccount(provider.connection, makerAtaB);

    console.log("Taker received Token A:", Number(takerTokenA.amount));
    console.log("Maker received Token B:", Number(makerTokenB.amount));
  });
});
