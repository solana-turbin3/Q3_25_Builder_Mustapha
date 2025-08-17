import { runStandaloneExample } from './standalone-client';

/**
 * Test script for the Carxit client
 * This script demonstrates the carbon credit trading platform functionality
 */
async function main() {
  console.log("🚀 Starting Carxit Client Test\n");
  
  try {
    const result = await runStandaloneExample();
    
    console.log("\n✅ Client test completed successfully!");
    console.log("\n📋 Test Results Summary:");
    console.log(`   Program ID: ${result.programInfo.programId}`);
    console.log(`   Total Instructions: ${result.stats.totalInstructions}`);
    console.log(`   Total Account Types: ${result.stats.totalAccountTypes}`);
    console.log(`   Total PDA Seeds: ${result.stats.totalPDASeeds}`);
    console.log(`   Project: ${result.lifecycle.projectId}`);
    console.log(`   Total CO2e: ${result.lifecycle.totalCo2e}`);
    console.log(`   Total Market Value: ${result.trading.totalMarketValue} lamports`);
    
    console.log("\n🎉 All functionality demonstrated successfully!");
    
  } catch (error) {
    console.error("❌ Client test failed:", error);
    process.exit(1);
  }
}

// Run the test
main();
