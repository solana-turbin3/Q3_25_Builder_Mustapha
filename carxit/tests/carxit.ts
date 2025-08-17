import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Carxit } from "../target/types/carxit";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

describe("carxit", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Carxit as Program<Carxit>;

  // Generate test wallets
  const projectOwner = anchor.web3.Keypair.generate();
  const seller = anchor.web3.Keypair.generate();
  const buyer = anchor.web3.Keypair.generate();
  const mintKeypair = anchor.web3.Keypair.generate();

  // Generate PDAs
  const [projectPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("project"), projectOwner.publicKey.toBuffer()],
    program.programId
  );

  const [mintAuthorityPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint_authority")],
    program.programId
  );

  const [listingPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("listing"), mintKeypair.publicKey.toBuffer()],
    program.programId
  );

  const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      buyer.publicKey.toBuffer(),
      seller.publicKey.toBuffer(),
      mintKeypair.publicKey.toBuffer()
    ],
    program.programId
  );

  const [escrowVaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), escrowPda.toBuffer()],
    program.programId
  );

  // Token accounts
  const ownerTokenAccount = getAssociatedTokenAddressSync(mintKeypair.publicKey, projectOwner.publicKey);
  const sellerTokenAccount = getAssociatedTokenAddressSync(mintKeypair.publicKey, seller.publicKey);
  const buyerTokenAccount = getAssociatedTokenAddressSync(mintKeypair.publicKey, buyer.publicKey);

  it("Is initialized!", async () => {
    const tx = await program.methods
      .initializeToken("Solar_Farm_Project_001", new anchor.BN(10000))
      .accountsStrict({
        project: projectPda,
        mint: mintKeypair.publicKey,
        mintAuthority: mintAuthorityPda,
        user: projectOwner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([projectOwner, mintKeypair])
      .rpc({ skipPreflight: true });
  });

  it("Can mint tokens!", async () => {
    const tx = await program.methods
      .mintToken(new anchor.BN(5000))
      .accountsStrict({
        project: projectPda,
        mint: mintKeypair.publicKey,
        mintAuthority: mintAuthorityPda,
        userTokenAccount: ownerTokenAccount,
        user: projectOwner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([projectOwner])
      .rpc({ skipPreflight: true });
  });

  it("Can mint tokens to seller!", async () => {
    const tx = await program.methods
      .mintToken(new anchor.BN(2000))
      .accountsStrict({
        project: projectPda,
        mint: mintKeypair.publicKey,
        mintAuthority: mintAuthorityPda,
        userTokenAccount: sellerTokenAccount,
        user: seller.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([seller])
      .rpc({ skipPreflight: true });
  });

  it("Can list credits!", async () => {
    const tx = await program.methods
      .listCredit(new anchor.BN(1000000))
      .accountsStrict({
        listing: listingPda,
        creditToken: sellerTokenAccount,
        seller: seller.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([seller])
      .rpc({ skipPreflight: true });
  });

  it("Can initialize escrow!", async () => {
    const tx = await program.methods
      .initializeEscrow(new anchor.BN(500000))
      .accountsStrict({
        escrow: escrowPda,
        escrowVault: escrowVaultPda,
        escrowTokenAccount: sellerTokenAccount,
        creditToken: sellerTokenAccount,
        seller: seller.publicKey,
        buyer: buyer.publicKey,
        sellerTokenAccount: sellerTokenAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([buyer])
      .rpc({ skipPreflight: true });
  });

  it("Can confirm escrow as buyer!", async () => {
    const tx = await program.methods
      .confirmEscrow()
      .accountsStrict({
        escrow: escrowPda,
        escrowVault: escrowVaultPda,
        escrowTokenAccount: sellerTokenAccount,
        seller: seller.publicKey,
        buyer: buyer.publicKey,
        buyerTokenAccount: buyerTokenAccount,
        signer: buyer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc({ skipPreflight: true });
  });

  it("Can confirm escrow as seller!", async () => {
    const tx = await program.methods
      .confirmEscrow()
      .accountsStrict({
        escrow: escrowPda,
        escrowVault: escrowVaultPda,
        escrowTokenAccount: sellerTokenAccount,
        seller: seller.publicKey,
        buyer: buyer.publicKey,
        buyerTokenAccount: buyerTokenAccount,
        signer: seller.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([seller])
      .rpc({ skipPreflight: true });
  });

  it("Can retire tokens!", async () => {
    const tx = await program.methods
      .retireToken(new anchor.BN(100))
      .accountsStrict({
        mint: mintKeypair.publicKey,
        userTokenAccount: buyerTokenAccount,
        user: buyer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc({ skipPreflight: true });
  });
});
