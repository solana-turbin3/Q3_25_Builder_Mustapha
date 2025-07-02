import { Transaction, SystemProgram, Connection, Keypair, LAMPORTS_PER_SOL, sendAndConfirmTransaction, PublicKey } from "@solana/web3.js";
import wallet from "./dev-wallet.json";


const from = Keypair.fromSecretKey(new Uint8Array(wallet));
// actual Turbin3 wallet address
const to = new PublicKey("5N5e7GcGPafQupHEJU5ZqwSj4bg1Wu21ePDY2GmJKrsK");
const connection = new Connection("https://api.devnet.solana.com");

(async () => {
  try {
    // Transfer 0.1 SOL
    const transaction1 = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: LAMPORTS_PER_SOL / 10,  // 0.1 SOL
      })
    );
    transaction1.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash;
    transaction1.feePayer = from.publicKey;
    const signature1 = await sendAndConfirmTransaction(connection, transaction1, [from]);
    console.log(`Transferred 0.1 SOL: https://explorer.solana.com/tx/${signature1}?cluster=devnet`);

    // Transfer remaining balance
    const balance = await connection.getBalance(from.publicKey);
    const transaction2 = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: balance,
      })
    );
    transaction2.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash;
    transaction2.feePayer = from.publicKey;
    const fee = (await connection.getFeeForMessage(transaction2.compileMessage(), 'confirmed')).value || 0;
    transaction2.instructions.pop();
    transaction2.add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: balance - fee,
      })
    );
    const signature2 = await sendAndConfirmTransaction(connection, transaction2, [from]);
    console.log(`Transferred remaining balance: https://explorer.solana.com/tx/${signature2}?cluster=devnet`);
  } catch (e) {
    console.error(`Error: ${e}`);
  }
})();