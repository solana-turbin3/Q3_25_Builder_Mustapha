import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorVaultQ3 } from "../target/types/anchor_vault_q3";
import wallet_1_file from "./wallets/user-1-wallet.json";

const wallet_1 = anchor.web3.Keypair.fromSecretKey(
  new Uint8Array(wallet_1_file)
);

describe("anchor-vault-q3", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.anchorVaultQ3 as Program<AnchorVaultQ3>;

  let statePda: anchor.web3.PublicKey;
  let vaultPda: anchor.web3.PublicKey;
  let stateBump: number;
  let vaultBump: number;

  before(async () => {
    // Derive PDA for state
    [statePda, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("state"), wallet_1.publicKey.toBuffer()],
      program.programId
    );

    // Derive PDA for vault
    [vaultPda, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("vault"), statePda.toBuffer()],
      program.programId
    );
  });

  it("Is initialized!", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        user: wallet_1.publicKey,
        state: statePda,
        vault: vaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet_1])
      .rpc();
    console.log("Init tx signature:", tx);
  });

  it("should deposit to vault", async () => {
    const tx = await program.methods
      .deposit(new anchor.BN(1_000_000)) // 0.001 SOL
      .accounts({
        user: wallet_1.publicKey,
        state: statePda,
        vault: vaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet_1])
      .rpc();
    console.log("Deposit tx signature:", tx);
  });

  it("should withdraw from vault", async () => {
    const tx = await program.methods
      .withdraw(new anchor.BN(1_000_000)) // same amount as deposited
      .accounts({
        user: wallet_1.publicKey,
        state: statePda,
        vault: vaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet_1])
      .rpc();
    console.log("Withdraw tx signature:", tx);
  });
});
