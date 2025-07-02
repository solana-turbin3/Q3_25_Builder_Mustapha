#[cfg(test)]
mod tests {
    use solana_sdk::{
        hash::hash,
        instruction::{AccountMeta, Instruction},
        message::Message,
        pubkey::Pubkey,
        signature::{Keypair, Signer, read_keypair_file},
        system_program,
        transaction::Transaction,
    };
    use solana_client::rpc_client::RpcClient;
    use bs58;
    use std::io::{self, BufRead};
    use std::str::FromStr;

    const RPC_URL: &str = "https://turbine-solanad-4cde.devnet.rpcpool.com/9a9da9cf-6db1-47dc-839a-55aca5c9c80a";

    #[test]
    fn keygen() {
        // Create a new keypair
        let kp = Keypair::new();
        println!("You've generated a new Solana wallet: {}", kp.pubkey());
        println!("To save your wallet, copy and paste the following into a JSON file:");
        println!("{:?}", kp.to_bytes());
    }

    #[test]
    fn base58_to_wallet() {
        println!("Input your private key as a base58 string:");
        let stdin = io::stdin();
        let base58 = stdin.lock().lines().next().unwrap().unwrap();
        println!("Your wallet file format is:");
        let wallet = bs58::decode(&base58).into_vec().unwrap();
        println!("{:?}", wallet);
    }

    #[test]
    fn wallet_to_base58() {
        println!("Input your private key as a JSON byte array (e.g. [12,34,...]):");
        let stdin = io::stdin();
        let wallet = stdin
            .lock()
            .lines()
            .next()
            .unwrap()
            .unwrap()
            .trim_start_matches('[')
            .trim_end_matches(']')
            .split(',')
            .map(|s| s.trim().parse::<u8>().unwrap())
            .collect::<Vec<u8>>();
        println!("Your Base58-encoded private key is:");
        let base58 = bs58::encode(&wallet).into_string();
        println!("{:?}", base58);
    }

    #[test]
    fn claim_airdrop() {
        // Import keypair
        let keypair = read_keypair_file("dev-wallet.json").expect("Couldn't find wallet file");
        let client = RpcClient::new(RPC_URL);
        // Request 2 SOL
        match client.request_airdrop(&keypair.pubkey(), 2_000_000_000u64) {
            Ok(sig) => {
                println!("Success! Check your TX here:");
                println!("https://explorer.solana.com/tx/{}?cluster=devnet", sig);
            }
            Err(err) => println!("Airdrop failed: {}", err),
        }
    }

    #[test]
    fn empty_wallet() {
        let keypair = read_keypair_file("dev-wallet.json").expect("Couldn't find wallet file");
        let to_pubkey = Pubkey::from_str("5N5e7GcGPafQupHEJU5ZqwSj4bg1Wu21ePDY2GmJKrsK").unwrap();
        let rpc_client = RpcClient::new(RPC_URL);
        let recent_blockhash = rpc_client.get_latest_blockhash().expect("Failed to get recent blockhash");

        // Get balance
        let balance = rpc_client.get_balance(&keypair.pubkey()).expect("Failed to get balance");
        // Mock transaction for fee calculation
        let message = Message::new_with_blockhash(
            &[solana_program::system_instruction::transfer(&keypair.pubkey(), &to_pubkey, balance)],
            Some(&keypair.pubkey()),
            &recent_blockhash,
        );
        let fee = rpc_client.get_fee_for_message(&message).expect("Failed to get fee");
        // Final transaction
        let transaction = Transaction::new_signed_with_payer(
            &[solana_program::system_instruction::transfer(&keypair.pubkey(), &to_pubkey, balance - fee)],
            Some(&keypair.pubkey()),
            &vec![&keypair],
            recent_blockhash,
        );
        match rpc_client.send_and_confirm_transaction(&transaction) {
            Ok(signature) => {
                println!("Success! Entire balance transferred: https://explorer.solana.com/tx/{}?cluster=devnet", signature);
            }
            Err(err) => println!("Empty wallet failed: {}", err),
        }
    }

    #[test]
    fn submit_rs() {
        let signer = read_keypair_file("Turbin3-wallet.json").expect("Couldn't find Turbin3 wallet file");
        let rpc_client = RpcClient::new(RPC_URL);
        let turbin3_prereq_program = Pubkey::from_str("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM").unwrap();
        let collection = Pubkey::from_str("5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2").unwrap(); // Likely incorrect
        let mpl_core_program = Pubkey::from_str("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d").unwrap();
        let system_program = system_program::id();
        let mint = Keypair::new();

        // PDA for ApplicationAccount
        let signer_pubkey = signer.pubkey();
        let seeds = &[b"prereqs", signer_pubkey.as_ref()];
        let (prereq_pda, _bump) = Pubkey::find_program_address(seeds, &turbin3_prereq_program);
        println!("ApplicationAccount PDA: {}", prereq_pda);

        // PDA for authority (["collection", collection])
        let authority_seeds = &[b"collection", collection.as_ref()];
        let (authority, _bump) = Pubkey::find_program_address(authority_seeds, &turbin3_prereq_program);
        println!("Authority PDA: {}", authority);

        // Check if ApplicationAccount exists
        match rpc_client.get_account(&prereq_pda) {
            Ok(account) => println!("ApplicationAccount exists with {} lamports", account.lamports),
            Err(err) => println!("ApplicationAccount does not exist: {}. Please run TypeScript initialize first.", err),
        }

        // Instruction data (submit_rs discriminator from IDL)
        let data = vec![77, 124, 82, 163, 21, 133, 181, 206];

        // Accounts metadata
        let accounts = vec![
            AccountMeta::new(signer_pubkey, true), // user (signer)
            AccountMeta::new(prereq_pda, false), // account (PDA)
            AccountMeta::new(mint.pubkey(), true), // mint (signer)
            AccountMeta::new(collection, false), // collection
            AccountMeta::new_readonly(authority, false), // authority (PDA)
            AccountMeta::new_readonly(mpl_core_program, false), // mpl_core_program
            AccountMeta::new_readonly(system_program, false), // system_program
        ];

        // Build instruction
        let instruction = Instruction {
            program_id: turbin3_prereq_program,
            accounts,
            data,
        };

        // Get recent blockhash
        let blockhash = rpc_client.get_latest_blockhash().expect("Failed to get recent blockhash");

        // Create and sign transaction
        let transaction = Transaction::new_signed_with_payer(
            &[instruction],
            Some(&signer_pubkey),
            &[&signer, &mint],
            blockhash,
        );

        // Send and confirm transaction
        match rpc_client.send_and_confirm_transaction(&transaction) {
            Ok(signature) => {
                println!("Success! Check your TX here: https://explorer.solana.com/tx/{}?cluster=devnet", signature);
            }
            Err(err) => println!("Submit_rs failed: {}", err),
        }
    }
}