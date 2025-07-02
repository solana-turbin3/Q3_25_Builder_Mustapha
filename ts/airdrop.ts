import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import wallet from "./dev-wallet.json";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const connection = new Connection("https://api.devnet.solana.com");

(async () => {
    try {
        const txhash = await connection.requestAirdrop(keypair.publicKey, 2 *LAMPORTS_PER_SOL);
        console.log('Success! Check out your Tx here: https://solscan.io/tx/${txhash}?cluster=devnet');
    } catch (e) {
        console.log(`Oops, something went wrong: ${e}`);
    }
})();