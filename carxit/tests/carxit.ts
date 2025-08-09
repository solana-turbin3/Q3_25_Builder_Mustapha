import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Carxit } from "../target/types/carxit";
import { assert } from "chai";

describe("carxit", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Carxit as Program<Carxit>;

  // PDAs
  const projectPda = async (projectId: string) => {
    return await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("project"), Buffer.from(projectId)],
      program.programId
    );
  };
  const mintAuthorityPda = async () => {
    return await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("mint_authority")],
      program.programId
    );
  };

  it("initialize_token + mint + retire", async () => {
    const projectId = "my_project";
    const [proj, projBump] = await projectPda(projectId);
    const [mintAuth, authBump] = await mintAuthorityPda();

    // initialize_token
    await program.methods
      .initializeToken(projectId, new anchor.BN(42))
      .accounts({
        project: proj,
        mintAuthority: mintAuth,
        mint: proj,           // anchor will derive mint PDA itself
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // derive user's ATA
    const userAta = await anchor.utils.token.associatedAddress({
      mint: proj,
      owner: provider.wallet.publicKey,
    });

    // mint_token
    await program.methods
      .mintToken(new anchor.BN(100))
      .accounts({
        project: proj,
        mint: proj, // same mint
        userTokenAccount: userAta,
        mintAuthority: mintAuth,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .rpc();

    // retire_token
    await program.methods
      .retireToken(new anchor.BN(50))
      .accounts({
        mint: proj,
        userTokenAccount: userAta,
        user: provider.wallet.publicKey,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .rpc();
  });

  it("list + escrow flow", async () => {
    // prepare listing
    const seller = provider.wallet.publicKey;
    const creditMint = anchor.web3.Keypair.generate().publicKey;
    const [listingPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("listing"), creditMint.toBuffer()],
      program.programId
    );
    // list_credit
    await program.methods
      .listCredit(new anchor.BN(5))
      .accounts({
        listing: listingPda,
        creditToken: creditMint,
        seller,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // escrow
    const buyer = provider.wallet.publicKey;
    const [escrowPda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("escrow"),
        buyer.toBuffer(),
        seller.toBuffer(),
        creditMint.toBuffer(),
      ],
      program.programId
    );
    const [vaultPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("vault"), escrowPda.toBuffer()],
      program.programId
    );

    // initialize_escrow
    await program.methods
      .initializeEscrow(new anchor.BN(1_000_000))
      .accounts({
        escrow: escrowPda,
        escrowVault: vaultPda,
        escrowTokenAccount: listingPda, // reuse listing as token acct
        creditToken: creditMint,
        seller,
        buyer,
        sellerTokenAccount: listingPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // confirm both sides
    await program.methods.confirmEscrow().accounts({
      escrow: escrowPda,
      escrowVault: vaultPda,
      escrowTokenAccount: listingPda,
      seller,
      buyer,
      buyerTokenAccount: listingPda,
      signer: buyer,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    }).rpc();

    await program.methods.confirmEscrow().accounts({
      escrow: escrowPda,
      escrowVault: vaultPda,
      escrowTokenAccount: listingPda,
      seller,
      buyer,
      buyerTokenAccount: listingPda,
      signer: seller,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    }).rpc();

  });
});
