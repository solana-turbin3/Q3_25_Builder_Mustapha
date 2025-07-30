import * as anchor from "@coral-xyz/anchor"; //imports everything from the anchor library
import { PublicKey } from "@solana/web3.js"; //imports PublicKey from the web3.js library
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

describe("anchor-escrow", () => { //starts mocha test suite title anchor-escrow
  const provider = anchor.AnchorProvider.env(); //configures the provider to use the environment settings
  anchor.setProvider(provider);

  const program = anchor.workspace.AnchorEscrow as Program<AnchorEscrow>; //grabs the program instance defined in the Anchor.toml workspace under the [program.localnet]

  const maker = Keypair.generate(); // generata random wallets for test for person making and the person taking the offer.
  const taker = Keypair.generate();

  let mintA = anchor.web3.PublicKey.default;// Tokens involved in the trade
  let mintB = anchor.web3.PublicKey.default;

  let makerAtaA: anchor.web3.PublicKey; // Maker's associated token account for mint A
  let takerAtaB: anchor.web3.PublicKey; // taker's associated token account for mint B
  let vault: anchor.web3.PublicKey; // Vault to hold tokens during the offer
  let offerPda: anchor.web3.PublicKey; // PDA for the offer account
  // PDA is a Program Derived Address, a unique address derived from the program ID and some seeds.
  // It is used to create accounts that are owned by the program itself.
  // This is useful for creating accounts that are not directly controlled by a user, but by the program logic.
  let offerBump: number; // bump is the number used to ensure uniqueness of the PDA address.

  // token amount in the trade.
  const depositAmount = 1_000_000;
  const receiveAmount = 500_000;

  it("Airdrops SOL to both users", async () => {
    // Airdrop SOL to both maker and taker wallets for transaction fees
    // This is necessary to ensure that both users have enough SOL to pay for transaction fees.
    // The airdrop function is used to send SOL to the specified public key.
    // The amount of SOL to be airdropped is 2 SOL for each user.
    for (const user of [maker, taker]) {
      const sig = await provider.connection.requestAirdrop(
        user.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    }
  });

  it("Creates token mints and ATAs", async () => {
    //creates a new token mint for mintA, controlled by the maker.
    mintA = await createMint(
      provider.connection,
      maker,
      maker.publicKey,
      null,
      0 // no decimals for simplicity
    );
    //creates a new token mint for mintB, controlled by the taker.
    // This is the token that the taker will receive in exchange for mintA.
    mintB = await createMint(
      provider.connection,
      taker,
      taker.publicKey,
      null,
      0
    );

    //creates associated token accounts where the maker will hold mintA tokens and the taker will hold mintB tokens.
    // Associated token accounts are special accounts that hold tokens for a specific user and mint.
    // They are created using the createAssociatedTokenAccount function from the SPL Token library.
    makerAtaA = await createAssociatedTokenAccount(
      provider.connection,
      maker,
      mintA,
      maker.publicKey
    );

    //creates the taker's associated token account for mintB.
    // This is where the taker will receive mintB tokens after accepting the offer.
    // The taker will receive mintB tokens in exchange for mintA tokens.
    // The taker will send mintA tokens to the maker in exchange for mintB tokens
    // when the offer is accepted.
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

  // maker creates an offer to trade mintA for mintB
  it("Maker makes an offer", async () => {
    [offerPda, offerBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("offer"), maker.publicKey.toBuffer()],
      program.programId
    );

    // derives the address of the escrow vault (ATA) for storing token A(offer token) during the offer
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
    // taker accepts the offer made by the maker
    // The taker will send mintA tokens to the maker in exchange for mintB tokens
    // The taker will receive mintB tokens in exchange for mintA tokens
    // The taker will send mintA tokens to the maker's vault, and the maker will send mintB tokens to the taker's associated token account for mintB(the the taker pays fees for creating).
    // The taker will receive mintB tokens in exchange for mintA tokens
    // The taker will send mintA tokens to the maker's vault, and the maker will send mintB tokens to the taker's associated token account for mintB.
    // The taker will receive mintB tokens in exchange for mintA tokens
    // The taker will send mintA tokens to the maker's vault
    // and the maker will send mintB tokens to the taker's associated token account for mint

    const makerAtaB = await createAssociatedTokenAccount(
      provider.connection,
      taker,
      mintB,
      maker.publicKey
    );

    //taker also needs to create an associated token account to recieve mintA tokens
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
