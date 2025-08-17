import * as anchor from "@coral-xyz/anchor";

/**
 * Standalone Carbon Credit Trading Platform Client
 * 
 * This client demonstrates all the functionality of the Carxit program
 * without requiring a live Solana connection or environment variables.
 */
export class StandaloneCarxitClient {
  private programId: anchor.web3.PublicKey;

  constructor() {
    // Use the actual program ID from your project
    this.programId = new anchor.web3.PublicKey("9z9vKD4orxyW5XYj1mKVhyUJGafukK8uQKgh4TARPGm");
  }

  /**
   * Get program information
   */
  getProgramInfo() {
    return {
      programId: this.programId.toString(),
      programName: "Carxit",
      description: "Carbon credit trading platform on Solana",
      version: "1.0.0"
    };
  }

  /**
   * Generate PDAs for the carbon credit platform
   */
  async generatePDAs(user: anchor.web3.PublicKey, mint?: anchor.web3.PublicKey) {
    const pdas: any = {
      project: await this.generateProjectPDA(user),
      mintAuthority: await this.generateMintAuthorityPDA(),
    };

    if (mint) {
      pdas.listing = await this.generateListingPDA(mint);
    }

    return pdas;
  }

  /**
   * Generate project PDA
   */
  private async generateProjectPDA(user: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> {
    const [projectPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("project"), user.toBuffer()],
      this.programId
    );
    return projectPda;
  }

  /**
   * Generate mint authority PDA
   */
  private async generateMintAuthorityPDA(): Promise<anchor.web3.PublicKey> {
    const [mintAuthorityPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("mint_authority")],
      this.programId
    );
    return mintAuthorityPda;
  }

  /**
   * Generate listing PDA
   */
  private async generateListingPDA(mint: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> {
    const [listingPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("listing"), mint.toBuffer()],
      this.programId
    );
    return listingPda;
  }

  /**
   * Generate escrow PDA
   */
  async generateEscrowPDA(
    buyer: anchor.web3.PublicKey,
    seller: anchor.web3.PublicKey,
    mint: anchor.web3.PublicKey
  ): Promise<anchor.web3.PublicKey> {
    const [escrowPda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("escrow"),
        buyer.toBuffer(),
        seller.toBuffer(),
        mint.toBuffer()
      ],
      this.programId
    );
    return escrowPda;
  }

  /**
   * Generate escrow vault PDA
   */
  async generateEscrowVaultPDA(escrowPda: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> {
    const [escrowVaultPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("vault"), escrowPda.toBuffer()],
      this.programId
    );
    return escrowVaultPda;
  }

  /**
   * Validate carbon credit parameters
   */
  validateCarbonCreditParams(projectId: string, co2e: anchor.BN): boolean {
    if (!projectId || projectId.length === 0) {
      throw new Error("Project ID cannot be empty");
    }
    
    if (co2e.lte(new anchor.BN(0))) {
      throw new Error("CO2e amount must be greater than 0");
    }

    return true;
  }

  /**
   * Validate minting parameters
   */
  validateMintingParams(amount: anchor.BN, maxSupply: anchor.BN): boolean {
    if (amount.lte(new anchor.BN(0))) {
      throw new Error("Mint amount must be greater than 0");
    }

    if (amount.gt(maxSupply)) {
      throw new Error("Mint amount cannot exceed maximum supply");
    }

    return true;
  }

  /**
   * Validate listing parameters
   */
  validateListingParams(price: anchor.BN): boolean {
    if (price.lte(new anchor.BN(0))) {
      throw new Error("Listing price must be greater than 0");
    }

    return true;
  }

  /**
   * Validate escrow parameters
   */
  validateEscrowParams(solAmount: anchor.BN, listingPrice: anchor.BN): boolean {
    if (solAmount.lte(new anchor.BN(0))) {
      throw new Error("Escrow amount must be greater than 0");
    }

    if (solAmount.gt(listingPrice)) {
      throw new Error("Escrow amount cannot exceed listing price");
    }

    return true;
  }

  /**
   * Calculate carbon credit economics
   */
  calculateCarbonCreditEconomics(
    totalSupply: anchor.BN,
    mintedAmount: anchor.BN,
    pricePerCredit: anchor.BN
  ) {
    const remainingSupply = totalSupply.sub(mintedAmount);
    const totalValue = mintedAmount.mul(pricePerCredit);
    const marketCap = totalSupply.mul(pricePerCredit);

    return {
      totalSupply: totalSupply.toString(),
      mintedAmount: mintedAmount.toString(),
      remainingSupply: remainingSupply.toString(),
      totalValue: totalValue.toString(),
      marketCap: marketCap.toString(),
      pricePerCredit: pricePerCredit.toString()
    };
  }

  /**
   * Calculate escrow economics
   */
  calculateEscrowEconomics(
    escrowAmount: anchor.BN,
    creditAmount: anchor.BN,
    listingPrice: anchor.BN
  ) {
    const pricePerCredit = escrowAmount.div(creditAmount);
    const escrowPercentage = escrowAmount.mul(new anchor.BN(100)).div(listingPrice);

    return {
      escrowAmount: escrowAmount.toString(),
      creditAmount: creditAmount.toString(),
      pricePerCredit: pricePerCredit.toString(),
      escrowPercentage: escrowPercentage.toString(),
      remainingAmount: listingPrice.sub(escrowAmount).toString()
    };
  }

  /**
   * Simulate carbon credit lifecycle
   */
  simulateCarbonCreditLifecycle() {
    console.log("🌱 Simulating Carbon Credit Lifecycle\n");

    // Project initialization
    const projectId = "Solar_Farm_Project_001";
    const totalCo2e = new anchor.BN(10000);
    console.log(`📊 Project: ${projectId}`);
    console.log(`   Total CO2e: ${totalCo2e.toString()}`);

    // Minting phase
    const mintedAmount = new anchor.BN(5000);
    const remainingSupply = totalCo2e.sub(mintedAmount);
    console.log(`🪙 Minted: ${mintedAmount.toString()}`);
    console.log(`   Remaining: ${remainingSupply.toString()}`);

    // Trading phase
    const pricePerCredit = new anchor.BN(100000); // 0.1 SOL
    const totalValue = mintedAmount.mul(pricePerCredit);
    console.log(`💰 Price per credit: ${pricePerCredit.toString()} lamports`);
    console.log(`   Total value: ${totalValue.toString()} lamports`);

    // Listing phase
    const listingPrice = new anchor.BN(1000000); // 1 SOL
    console.log(`📋 Listing price: ${listingPrice.toString()} lamports`);

    // Escrow phase
    const escrowAmount = new anchor.BN(500000); // 0.5 SOL
    const escrowPercentage = escrowAmount.mul(new anchor.BN(100)).div(listingPrice);
    console.log(`🔒 Escrow amount: ${escrowAmount.toString()} lamports`);
    console.log(`   Escrow percentage: ${escrowPercentage.toString()}%`);

    // Retirement phase
    const retiredAmount = new anchor.BN(100);
    const finalBalance = mintedAmount.sub(retiredAmount);
    console.log(`🔥 Retired: ${retiredAmount.toString()}`);
    console.log(`   Final balance: ${finalBalance.toString()}`);

    return {
      projectId,
      totalCo2e: totalCo2e.toString(),
      mintedAmount: mintedAmount.toString(),
      remainingSupply: remainingSupply.toString(),
      totalValue: totalValue.toString(),
      listingPrice: listingPrice.toString(),
      escrowAmount: escrowAmount.toString(),
      retiredAmount: retiredAmount.toString(),
      finalBalance: finalBalance.toString()
    };
  }

  /**
   * Simulate multi-party trading scenario
   */
  simulateMultiPartyTrading() {
    console.log("👥 Simulating Multi-Party Trading Scenario\n");

    const participants = {
      seller1: "Seller_001",
      seller2: "Seller_002", 
      buyer1: "Buyer_001",
      buyer2: "Buyer_002"
    };

    const projects = {
      project1: {
        name: "Solar_Farm_Project",
        co2e: new anchor.BN(5000),
        price: new anchor.BN(1500000)
      },
      project2: {
        name: "Wind_Farm_Project", 
        co2e: new anchor.BN(3000),
        price: new anchor.BN(1000000)
      }
    };

    console.log("📊 Projects:");
    Object.entries(projects).forEach(([key, project]) => {
      console.log(`   ${project.name}:`);
      console.log(`     CO2e: ${project.co2e.toString()}`);
      console.log(`     Price: ${project.price.toString()} lamports`);
    });

    const totalMarketValue = projects.project1.price.add(projects.project2.price);
    console.log(`💰 Total Market Value: ${totalMarketValue.toString()} lamports`);

    return {
      participants,
      projects: {
        project1: {
          name: projects.project1.name,
          co2e: projects.project1.co2e.toString(),
          price: projects.project1.price.toString()
        },
        project2: {
          name: projects.project2.name,
          co2e: projects.project2.co2e.toString(),
          price: projects.project2.price.toString()
        }
      },
      totalMarketValue: totalMarketValue.toString()
    };
  }

  /**
   * Simulate complete trading workflow
   */
  async simulateTradingWorkflow() {
    console.log("🔄 Simulating Complete Trading Workflow\n");

    // Generate test wallets
    const projectOwner = anchor.web3.Keypair.generate();
    const seller = anchor.web3.Keypair.generate();
    const buyer = anchor.web3.Keypair.generate();

    console.log("👥 Generated test wallets:");
    console.log(`   Project Owner: ${projectOwner.publicKey.toString()}`);
    console.log(`   Seller: ${seller.publicKey.toString()}`);
    console.log(`   Buyer: ${buyer.publicKey.toString()}`);

    // Generate PDAs
    const pdas = await this.generatePDAs(projectOwner.publicKey);
    console.log("\n🔑 Generated PDAs:");
    console.log(`   Project PDA: ${pdas.project.toString()}`);
    console.log(`   Mint Authority PDA: ${pdas.mintAuthority.toString()}`);

    // Simulate project parameters
    const projectId = "Solar_Farm_Project_001";
    const totalCo2e = new anchor.BN(10000);
    const mintAmount = new anchor.BN(5000);
    const listingPrice = new anchor.BN(1000000);
    const escrowAmount = new anchor.BN(500000);

    // Validate all parameters
    console.log("\n✅ Parameter Validation:");
    this.validateCarbonCreditParams(projectId, totalCo2e);
    this.validateMintingParams(mintAmount, totalCo2e);
    this.validateListingParams(listingPrice);
    this.validateEscrowParams(escrowAmount, listingPrice);
    console.log("   All parameters are valid");

    // Calculate economics
    console.log("\n💰 Economic Calculations:");
    const economics = this.calculateCarbonCreditEconomics(
      totalCo2e,
      mintAmount,
      new anchor.BN(100000)
    );
    console.log("   Carbon Credit Economics:", economics);

    const escrowEconomics = this.calculateEscrowEconomics(
      escrowAmount,
      new anchor.BN(100),
      listingPrice
    );
    console.log("   Escrow Economics:", escrowEconomics);

    // Simulate escrow creation
    const mint = anchor.web3.Keypair.generate().publicKey;
    const escrowPda = await this.generateEscrowPDA(
      buyer.publicKey,
      seller.publicKey,
      mint
    );
    const escrowVaultPda = await this.generateEscrowVaultPDA(escrowPda);

    console.log("\n🔒 Escrow Simulation:");
    console.log(`   Escrow PDA: ${escrowPda.toString()}`);
    console.log(`   Escrow Vault PDA: ${escrowVaultPda.toString()}`);

    return {
      wallets: {
        projectOwner: projectOwner.publicKey.toString(),
        seller: seller.publicKey.toString(),
        buyer: buyer.publicKey.toString()
      },
      pdas: {
        project: pdas.project.toString(),
        mintAuthority: pdas.mintAuthority.toString(),
        escrow: escrowPda.toString(),
        escrowVault: escrowVaultPda.toString()
      },
      parameters: {
        projectId,
        totalCo2e: totalCo2e.toString(),
        mintAmount: mintAmount.toString(),
        listingPrice: listingPrice.toString(),
        escrowAmount: escrowAmount.toString()
      },
      economics,
      escrowEconomics
    };
  }

  /**
   * Get available instructions
   */
  getAvailableInstructions() {
    return [
      "initializeToken - Initialize a new carbon credit project",
      "mintToken - Mint carbon credits to a user",
      "retireToken - Retire/burn carbon credits",
      "listCredit - List carbon credits for sale",
      "initializeEscrow - Initialize escrow for purchase",
      "confirmEscrow - Confirm escrow transaction",
      "refundEscrow - Refund escrow transaction"
    ];
  }

  /**
   * Get available account types
   */
  getAvailableAccountTypes() {
    return [
      "project - Carbon credit project information",
      "listing - Credit listing for sale",
      "escrow - Escrow transaction details"
    ];
  }

  /**
   * Get PDA seeds
   */
  getPDASeeds() {
    return [
      "project - [project, user]",
      "mint_authority - [mint_authority]",
      "listing - [listing, creditToken]",
      "escrow - [escrow, buyer, seller, creditToken]",
      "vault - [vault, escrow]"
    ];
  }

  /**
   * Get program statistics
   */
  getProgramStatistics() {
    return {
      totalInstructions: 7,
      totalAccountTypes: 3,
      totalPDASeeds: 5,
      supportedFeatures: [
        "Carbon Credit Tokenization",
        "Project Management",
        "Credit Minting",
        "Credit Retirement",
        "Marketplace Listing",
        "Escrow Trading",
        "Multi-party Transactions"
      ]
    };
  }

  /**
   * Demonstrate instruction usage examples
   */
  demonstrateInstructionUsage() {
    console.log("📝 Instruction Usage Examples\n");

    const examples = {
      initializeToken: {
        description: "Initialize a new carbon credit project",
        parameters: {
          projectId: "Solar_Farm_Project_001",
          co2e: "10000",
          user: "Project Owner Public Key"
        },
        accounts: [
          "project (PDA)",
          "mint (New Token Mint)",
          "mintAuthority (PDA)",
          "user (Signer)",
          "systemProgram",
          "tokenProgram",
          "rent"
        ]
      },
      mintToken: {
        description: "Mint carbon credits to a user",
        parameters: {
          amount: "5000"
        },
        accounts: [
          "project (PDA)",
          "mint",
          "mintAuthority (PDA)",
          "userTokenAccount",
          "user (Signer)",
          "systemProgram",
          "tokenProgram",
          "rent"
        ]
      },
      listCredit: {
        description: "List carbon credits for sale",
        parameters: {
          price: "1000000"
        },
        accounts: [
          "listing (PDA)",
          "creditToken",
          "seller (Signer)",
          "systemProgram",
          "tokenProgram",
          "rent"
        ]
      },
      initializeEscrow: {
        description: "Initialize escrow for purchase",
        parameters: {
          solAmount: "500000"
        },
        accounts: [
          "escrow (PDA)",
          "escrowVault (PDA)",
          "escrowTokenAccount",
          "creditToken",
          "seller",
          "buyer (Signer)",
          "sellerTokenAccount",
          "systemProgram",
          "tokenProgram",
          "rent"
        ]
      },
      confirmEscrow: {
        description: "Confirm escrow transaction",
        parameters: {},
        accounts: [
          "escrow (PDA)",
          "escrowVault (PDA)",
          "escrowTokenAccount",
          "seller",
          "buyer",
          "buyerTokenAccount",
          "signer (Signer)",
          "systemProgram",
          "tokenProgram"
        ]
      },
      refundEscrow: {
        description: "Refund escrow transaction",
        parameters: {},
        accounts: [
          "escrow (PDA)",
          "escrowVault (PDA)",
          "escrowTokenAccount",
          "seller",
          "buyer",
          "sellerTokenAccount",
          "signer (Signer)",
          "systemProgram",
          "tokenProgram"
        ]
      },
      retireToken: {
        description: "Retire/burn carbon credits",
        parameters: {
          amount: "100"
        },
        accounts: [
          "mint",
          "userTokenAccount",
          "user (Signer)",
          "tokenProgram"
        ]
      }
    };

    Object.entries(examples).forEach(([instruction, details]) => {
      console.log(`🔧 ${instruction}:`);
      console.log(`   Description: ${details.description}`);
      console.log(`   Parameters: ${JSON.stringify(details.parameters, null, 2)}`);
      console.log(`   Accounts: ${details.accounts.join(', ')}`);
      console.log("");
    });

    return examples;
  }
}

/**
 * Example usage of the standalone Carxit client
 */
export async function runStandaloneExample() {
  console.log("🌱 Starting Standalone Carbon Credit Trading Platform Example\n");

  // Create client
  const client = new StandaloneCarxitClient();

  try {
    // Display program information
    console.log("=== PROGRAM INFORMATION ===");
    const programInfo = client.getProgramInfo();
    console.log("Program ID:", programInfo.programId);
    console.log("Program Name:", programInfo.programName);
    console.log("Description:", programInfo.description);
    console.log("Version:", programInfo.version);

    // Display program statistics
    console.log("\n=== PROGRAM STATISTICS ===");
    const stats = client.getProgramStatistics();
    console.log("Total Instructions:", stats.totalInstructions);
    console.log("Total Account Types:", stats.totalAccountTypes);
    console.log("Total PDA Seeds:", stats.totalPDASeeds);
    console.log("Supported Features:", stats.supportedFeatures);

    // Demonstrate instruction usage
    console.log("\n=== INSTRUCTION USAGE EXAMPLES ===");
    const instructionExamples = client.demonstrateInstructionUsage();

    // Simulate trading workflow
    console.log("\n=== TRADING WORKFLOW SIMULATION ===");
    const workflow = await client.simulateTradingWorkflow();

    // Simulate lifecycle
    console.log("\n=== LIFECYCLE SIMULATION ===");
    const lifecycle = client.simulateCarbonCreditLifecycle();

    // Simulate multi-party trading
    console.log("\n=== MULTI-PARTY TRADING SIMULATION ===");
    const trading = client.simulateMultiPartyTrading();

    // Display available features
    console.log("\n=== AVAILABLE FEATURES ===");
    console.log("Instructions:");
    client.getAvailableInstructions().forEach(instruction => {
      console.log(`   - ${instruction}`);
    });

    console.log("\nAccount Types:");
    client.getAvailableAccountTypes().forEach(accountType => {
      console.log(`   - ${accountType}`);
    });

    console.log("\nPDA Seeds:");
    client.getPDASeeds().forEach(seed => {
      console.log(`   - ${seed}`);
    });

    console.log("\n🎉 Standalone Carbon Credit Trading Platform Example Completed Successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Project: ${lifecycle.projectId}`);
    console.log(`   Total CO2e: ${lifecycle.totalCo2e}`);
    console.log(`   Minted: ${lifecycle.mintedAmount}`);
    console.log(`   Retired: ${lifecycle.retiredAmount}`);
    console.log(`   Final Balance: ${lifecycle.finalBalance}`);
    console.log(`   Total Market Value: ${trading.totalMarketValue} lamports`);

    return {
      programInfo,
      stats,
      instructionExamples,
      workflow,
      lifecycle,
      trading
    };

  } catch (error) {
    console.error("❌ Error running standalone example:", error);
    throw error;
  }
}

// Export for use in other files
export default StandaloneCarxitClient;

