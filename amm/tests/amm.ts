import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Amm } from "../target/types/amm";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";



describe("amm", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  const connection = provider.connection;
  const wallet = provider.wallet;
  const program = anchor.workspace.amm as Program<Amm>;

  let mintX = null;
  let mintY = null;

  let vaultX = null;
  let vaultY = null;

  let userAtaX = null;
  let userAtaY = null;

  let config = anchor.web3.Keypair.generate();

  it("Is initialized Amm Pool!", async () => {
    // Add your test here.

    // creating two tokens mints tokenx and token y
    mintX = await createMint(connection, wallet.payer, 6, 0, wallet.publicKey);
    mintY = await createMint(connection, wallet.payer, 6, 0, wallet.publicKey);

    // creating associated token accounts for the tokens
    vaultX = await createAssociatedTokenAccount(connection, wallet.payer, wallet.publicKey, mintX);
    vaultY = await createAssociatedTokenAccount(connection, wallet.payer, wallet.publicKey, mintY);

    userAtaX = await createAssociatedTokenAccount(connection, wallet.payer, mintX, wallet.publicKey);
    userAtaY = await createAssociatedTokenAccount(connection, wallet.payer, mintY, wallet.publicKey);
    
    await program.methods.initialize(new anchor.BN(123), 30, null)
    .accounts({
      config:config.publicKey,
      vaultX: vaultX,
      vaultY: vaultY,
      tokenprogram: TOKEN_PROGRAM_ID,
      payer: wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([config])
    .rpc();
    console.log("Pool initialized");
  });
  
  it("Deposits into the pool", async () => {
    await program.methods
      .deposit(new anchor.BN(100_000), new anchor.BN(100_000), new anchor.BN(100_000))
      .accounts({
        config: config.publicKey,
        userX: userAtaX,
        userY: userAtaY,
        vaultX: vaultX,
        vaultY: vaultY,
        tokenProgram: TOKEN_PROGRAM_ID,
        payer: wallet.publicKey,
      })
      .rpc();

    console.log("✅ Deposit successful");
  });
  it("Withdraws from the pool", async () => {
    await program.methods
      .withdraw(new anchor.BN(50_000))
      .accounts({
        config: config.publicKey,
        userX: userAtaX,
        userY: userAtaY,
        vaultX: vaultX,
        vaultY: vaultY,
        tokenProgram: TOKEN_PROGRAM_ID,
        payer: wallet.publicKey,
      })
      .rpc();

    console.log("✅ Withdrawal successful");
  });

});
