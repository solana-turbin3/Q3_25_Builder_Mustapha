# Carxit - Carbon Credit Trading Platform Client

This directory contains comprehensive TypeScript clients for interacting with the Carxit carbon credit trading platform on Solana.

## 📁 Files

- `example.ts` - Full-featured client with live Solana integration
- `standalone-client.ts` - Standalone client for demonstration and testing
- `test-client.ts` - Test runner for the standalone client
- `example.js` - JavaScript version of the client
- `README.md` - This documentation file

## 🚀 Quick Start

### Running the Standalone Client

```bash
# Run the comprehensive client demonstration
npx ts-mocha -p ./tsconfig.json clients/test-client.ts
```

### Using the Client in Your Code

```typescript
import { StandaloneCarxitClient } from './clients/standalone-client';

// Create client instance
const client = new StandaloneCarxitClient();

// Get program information
const programInfo = client.getProgramInfo();
console.log('Program ID:', programInfo.programId);

// Generate PDAs
const user = anchor.web3.Keypair.generate();
const pdas = await client.generatePDAs(user.publicKey);
console.log('Project PDA:', pdas.project.toString());
```

## 🔧 Features

### Core Functionality

1. **Carbon Credit Tokenization**
   - Initialize carbon credit projects
   - Mint carbon credits to users
   - Retire/burn carbon credits

2. **Marketplace Operations**
   - List carbon credits for sale
   - Escrow-based trading system
   - Multi-party transaction support

3. **Project Management**
   - Project creation and verification
   - Supply management
   - Economic calculations

### Client Capabilities

- ✅ **PDA Generation** - All program-derived addresses
- ✅ **Parameter Validation** - Input validation and error handling
- ✅ **Economic Calculations** - Carbon credit economics and escrow calculations
- ✅ **Workflow Simulation** - Complete trading workflow demonstration
- ✅ **Multi-party Scenarios** - Complex trading scenarios
- ✅ **Instruction Documentation** - Detailed instruction usage examples

## 📊 Program Statistics

- **Total Instructions**: 7
- **Total Account Types**: 3
- **Total PDA Seeds**: 5
- **Supported Features**: 7

## 🎯 Available Instructions

1. **`initializeToken`** - Initialize a new carbon credit project
2. **`mintToken`** - Mint carbon credits to a user
3. **`retireToken`** - Retire/burn carbon credits
4. **`listCredit`** - List carbon credits for sale
5. **`initializeEscrow`** - Initialize escrow for purchase
6. **`confirmEscrow`** - Confirm escrow transaction
7. **`refundEscrow`** - Refund escrow transaction

## 🏗️ Account Types

1. **`project`** - Carbon credit project information
2. **`listing`** - Credit listing for sale
3. **`escrow`** - Escrow transaction details

## 🔑 PDA Seeds

1. **`project`** - `[project, user]`
2. **`mint_authority`** - `[mint_authority]`
3. **`listing`** - `[listing, creditToken]`
4. **`escrow`** - `[escrow, buyer, seller, creditToken]`
5. **`vault`** - `[vault, escrow]`

## 💰 Economic Model

### Carbon Credit Economics

The platform supports comprehensive economic calculations:

- **Total Supply**: Maximum CO2e credits for a project
- **Minted Amount**: Currently minted credits
- **Remaining Supply**: Available credits for minting
- **Total Value**: Market value of minted credits
- **Market Cap**: Total potential market value

### Escrow Economics

Escrow transactions include:

- **Escrow Amount**: SOL amount in escrow
- **Credit Amount**: Carbon credits being traded
- **Price Per Credit**: Calculated price per credit
- **Escrow Percentage**: Percentage of listing price
- **Remaining Amount**: Outstanding payment

## 🔄 Trading Workflow

### Complete Lifecycle

1. **Project Initialization**
   - Create carbon credit project
   - Set total CO2e supply
   - Generate project PDA

2. **Credit Minting**
   - Mint credits to project owner
   - Validate supply constraints
   - Track minted amounts

3. **Market Listing**
   - List credits for sale
   - Set pricing strategy
   - Create listing PDA

4. **Escrow Trading**
   - Initialize escrow
   - Buyer and seller confirmation
   - Secure token transfer

5. **Credit Retirement**
   - Burn carbon credits
   - Track environmental impact
   - Update balances

## 📝 Usage Examples

### Basic Client Usage

```typescript
import { StandaloneCarxitClient } from './clients/standalone-client';

async function demonstrateClient() {
  const client = new StandaloneCarxitClient();
  
  // Get program information
  const programInfo = client.getProgramInfo();
  
  // Simulate complete workflow
  const workflow = await client.simulateTradingWorkflow();
  
  // Calculate economics
  const economics = client.calculateCarbonCreditEconomics(
    new anchor.BN(10000), // total supply
    new anchor.BN(5000),  // minted amount
    new anchor.BN(100000) // price per credit
  );
  
  console.log('Economics:', economics);
}
```

### Parameter Validation

```typescript
// Validate project parameters
client.validateCarbonCreditParams("Solar_Farm_001", new anchor.BN(10000));

// Validate minting parameters
client.validateMintingParams(new anchor.BN(5000), new anchor.BN(10000));

// Validate listing parameters
client.validateListingParams(new anchor.BN(1000000));

// Validate escrow parameters
client.validateEscrowParams(new anchor.BN(500000), new anchor.BN(1000000));
```

### PDA Generation

```typescript
// Generate project PDAs
const user = anchor.web3.Keypair.generate();
const pdas = await client.generatePDAs(user.publicKey);

// Generate escrow PDAs
const buyer = anchor.web3.Keypair.generate();
const seller = anchor.web3.Keypair.generate();
const mint = anchor.web3.Keypair.generate().publicKey;

const escrowPda = await client.generateEscrowPDA(buyer.publicKey, seller.publicKey, mint);
const escrowVaultPda = await client.generateEscrowVaultPda(escrowPda);
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test:all

# Run only client tests
npm run test:client

# Run specific client test
npx ts-mocha -p ./tsconfig.json clients/test-client.ts
```

### Test Coverage

The client tests cover:

- ✅ Program information and statistics
- ✅ PDA generation and validation
- ✅ Parameter validation
- ✅ Economic calculations
- ✅ Workflow simulation
- ✅ Multi-party trading scenarios
- ✅ Instruction usage examples

## 🔒 Security Features

- **Parameter Validation**: All inputs are validated before processing
- **Supply Constraints**: Minting cannot exceed total supply
- **Escrow Security**: Secure multi-party escrow system
- **PDA Validation**: All program-derived addresses are properly generated
- **Error Handling**: Comprehensive error handling and reporting

## 📈 Performance

- **Fast PDA Generation**: Efficient program-derived address calculation
- **Optimized Calculations**: Fast economic calculations using BN.js
- **Memory Efficient**: Minimal memory footprint for client operations
- **Type Safe**: Full TypeScript support with type checking

## 🎯 Use Cases

### For Developers

- **Integration**: Easy integration with existing Solana applications
- **Testing**: Comprehensive testing and simulation capabilities
- **Documentation**: Detailed instruction and account documentation
- **Examples**: Ready-to-use code examples

### For Users

- **Carbon Credit Trading**: Complete carbon credit trading platform
- **Project Management**: Carbon credit project creation and management
- **Environmental Impact**: Track and retire carbon credits
- **Marketplace**: Secure escrow-based trading system

## 🔗 Integration

### With Solana Programs

```typescript
// Integrate with your Solana program
const program = anchor.workspace.Carxit;
const client = new StandaloneCarxitClient();

// Use client for PDA generation and validation
const pdas = await client.generatePDAs(user.publicKey);

// Use client for parameter validation
client.validateCarbonCreditParams(projectId, co2e);
```

### With Web Applications

```typescript
// Use in web applications
import { StandaloneCarxitClient } from './clients/standalone-client';

// Create client instance
const client = new StandaloneCarxitClient();

// Demonstrate functionality
const result = await client.simulateTradingWorkflow();
```

## 📚 Additional Resources

- **Program Documentation**: See the main program documentation
- **Anchor Framework**: [Anchor Documentation](https://www.anchor-lang.com/)
- **Solana Development**: [Solana Documentation](https://docs.solana.com/)
- **Carbon Credits**: Learn about carbon credit markets and trading

## 🤝 Contributing

To contribute to the client:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This client is part of the Carxit carbon credit trading platform and follows the same license as the main project.

---

**🌱 Building a sustainable future through blockchain technology**

