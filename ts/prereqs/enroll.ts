import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, Wallet, AnchorProvider } from "@coral-xyz/anchor";
import { IDL, Turbin3Prereq } from "./programs/Turbin3_prereq";
import wallet from "./Turbin3-wallet.json";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const connection = new Connection("https://api.devnet.solana.com");
const provider = new AnchorProvider(connection, new Wallet(keypair), { commitment: "confirmed" });
const programId = new PublicKey("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM");
const program: Program<Turbin3Prereq> = new Program(IDL, provider);


console.log(`Program ID: ${program.programId.toBase58()}`);

// PDA for enrollment account
const account_seeds = [Buffer.from("prereqs"), keypair.publicKey.toBuffer()];
const [account_key] = PublicKey.findProgramAddressSync(account_seeds, program.programId);


const github = "mmoh-i";

// Mint collection and new mint keypair
const mintCollection = new PublicKey("5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2");
const mintTs = Keypair.generate();

// Authority PDA
const authority_seeds = [Buffer.from("collection"), mintCollection.toBuffer()];
const [authority_key] = PublicKey.findProgramAddressSync(authority_seeds, program.programId);
console.log(`Computed authority PDA: ${authority_key.toBase58()}`);

(async () => {
  try {
    // Initialize transaction
    const txhash1 = await program.methods
      .initialize(github)
      .accounts({
        user: keypair.publicKey,
        account: account_key,
        system_program: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();
    console.log(`Initialize TX: https://explorer.solana.com/tx/${txhash1}?cluster=devnet`);

   
    const txhash2 = await program.methods
      .submitTs()
      .accounts({
        user: keypair.publicKey,
        account: account_key,
        mint: mintTs.publicKey,
        collection: mintCollection,
        authority: authority_key,
        mpl_core_program: new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"),
        system_program: SystemProgram.programId,
      })
      .signers([keypair, mintTs])
      .rpc();
    console.log(`Submit TS TX: https://explorer.solana.com/tx/${txhash2}?cluster=devnet`);

  //   // Close PDA
  //   const txhash = await program.methods
  //     .close()
  //     .accounts({
  //       user: keypair.publicKey,
  //       account: account_key,
  //       system_program: SystemProgram.programId,
  //     })
  //     .signers([keypair])
  //     .rpc();
  //   console.log(`Closed PDA! TX: https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`Error:`, JSON.stringify(e, null, 2));
  }
})();