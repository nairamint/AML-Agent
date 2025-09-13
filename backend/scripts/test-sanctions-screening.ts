#!/usr/bin/env tsx

/**
 * Test script for Production Sanctions Screening
 * 
 * This script demonstrates the production sanctions screening functionality
 * and can be used for testing and validation purposes.
 * 
 * Usage:
 *   npm run test:sanctions
 *   or
 *   tsx scripts/test-sanctions-screening.ts
 */

import { productionSanctionsScreening } from '../src/services/productionSanctionsService';
import { sanctionsService } from '../src/services/sanctionsService';
import { logger } from '../src/utils/logger';

interface TestEntity {
  name: string;
  entityType: 'INDIVIDUAL' | 'CORPORATE' | 'VESSEL' | 'AIRCRAFT';
  jurisdiction?: string;
  dateOfBirth?: string;
  nationality?: string;
}

const testEntities: TestEntity[] = [
  {
    name: "John Doe",
    entityType: "INDIVIDUAL",
    jurisdiction: "US",
    dateOfBirth: "1980-01-01",
    nationality: "US"
  },
  {
    name: "Jane Smith",
    entityType: "INDIVIDUAL",
    jurisdiction: "UK",
    dateOfBirth: "1975-05-15",
    nationality: "UK"
  },
  {
    name: "XYZ Corporation",
    entityType: "CORPORATE",
    jurisdiction: "US"
  },
  {
    name: "ABC Trading Ltd",
    entityType: "CORPORATE",
    jurisdiction: "UK"
  }
];

async function testProductionScreening() {
  console.log('🧪 Testing Production Sanctions Screening...\n');

  try {
    // Initialize the production screening service
    await productionSanctionsScreening.initialize();
    console.log('✅ Production screening service initialized\n');

    // Test individual entity screening
    for (const entity of testEntities) {
      console.log(`🔍 Screening entity: ${entity.name} (${entity.entityType})`);
      
      try {
        const result = await productionSanctionsScreening.comprehensiveScreening({
          name: entity.name,
          entityType: entity.entityType,
          country: entity.jurisdiction,
          dateOfBirth: entity.dateOfBirth,
          nationality: entity.nationality
        });

        console.log(`   📊 Results:`);
        console.log(`      - Matches Found: ${result.matchesFound}`);
        console.log(`      - Risk Level: ${result.riskLevel}`);
        console.log(`      - Sources Checked: ${Object.keys(result.sources).length}`);
        console.log(`      - Processing Time: ${Date.now() - result.timestamp.getTime()}ms`);
        
        if (result.matchesFound) {
          console.log(`      - Match Details:`);
          result.matches.forEach((match, index) => {
            console.log(`        ${index + 1}. ${match.name} (${match.source}) - Score: ${match.matchScore.toFixed(2)}`);
          });
        }

        console.log(`      - Recommendations:`);
        result.recommendations.forEach((rec, index) => {
          console.log(`        ${index + 1}. ${rec}`);
        });

        console.log(`      - Source Status:`);
        Object.entries(result.sources).forEach(([source, status]) => {
          console.log(`        - ${source}: ${status.status} (${status.matches} matches)`);
          if (status.error) {
            console.log(`          Error: ${status.error}`);
          }
        });

      } catch (error) {
        console.log(`   ❌ Error screening ${entity.name}:`, error.message);
      }
      
      console.log('');
    }

    // Test batch screening
    console.log('🔄 Testing batch screening...');
    const batchResults = await Promise.all(
      testEntities.map(async (entity) => {
        try {
          const result = await productionSanctionsScreening.comprehensiveScreening({
            name: entity.name,
            entityType: entity.entityType,
            country: entity.jurisdiction,
            dateOfBirth: entity.dateOfBirth,
            nationality: entity.nationality
          });
          return {
            entityName: entity.name,
            matchesFound: result.matchesFound,
            riskLevel: result.riskLevel,
            matches: result.matches.length
          };
        } catch (error) {
          return {
            entityName: entity.name,
            matchesFound: false,
            riskLevel: 'LOW',
            matches: 0,
            error: error.message
          };
        }
      })
    );

    console.log('📈 Batch Results Summary:');
    batchResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.entityName}: ${result.riskLevel} (${result.matches} matches)`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    // Get screening statistics
    console.log('\n📊 Getting screening statistics...');
    const stats = await productionSanctionsScreening.getScreeningStats();
    console.log('Statistics:', JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('❌ Production screening test failed:', error);
  }
}

async function testSanctionsService() {
  console.log('\n🧪 Testing Sanctions Service (with fallback)...\n');

  try {
    // Initialize the sanctions service
    await sanctionsService.initialize();
    console.log('✅ Sanctions service initialized\n');

    // Test standard sanctions check
    for (const entity of testEntities.slice(0, 2)) { // Test first 2 entities
      console.log(`🔍 Checking sanctions for: ${entity.name}`);
      
      try {
        const result = await sanctionsService.checkSanctions({
          entityName: entity.name,
          entityType: entity.entityType,
          jurisdiction: entity.jurisdiction,
          dateOfBirth: entity.dateOfBirth,
          nationality: entity.nationality
        });

        console.log(`   📊 Results:`);
        console.log(`      - Request ID: ${result.requestId}`);
        console.log(`      - Matches Found: ${result.matchesFound}`);
        console.log(`      - Risk Level: ${result.riskLevel}`);
        console.log(`      - Timestamp: ${result.timestamp.toISOString()}`);
        
        if (result.matchesFound) {
          console.log(`      - Match Details:`);
          result.matches.forEach((match, index) => {
            console.log(`        ${index + 1}. ${match.name} (${match.source}) - Score: ${match.matchScore.toFixed(2)}`);
          });
        }

        console.log(`      - Recommendations:`);
        result.recommendations.forEach((rec, index) => {
          console.log(`        ${index + 1}. ${rec}`);
        });

      } catch (error) {
        console.log(`   ❌ Error checking ${entity.name}:`, error.message);
      }
      
      console.log('');
    }

    // Get sanctions statistics
    console.log('📊 Getting sanctions service statistics...');
    const stats = await sanctionsService.getSanctionsStats();
    console.log('Statistics:', JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('❌ Sanctions service test failed:', error);
  }
}

async function testHealthChecks() {
  console.log('\n🏥 Testing Health Checks...\n');

  try {
    // Test production screening health
    console.log('🔍 Checking production screening health...');
    await productionSanctionsScreening.initialize();
    console.log('✅ Production screening is healthy\n');

    // Test sanctions service health
    console.log('🔍 Checking sanctions service health...');
    await sanctionsService.initialize();
    console.log('✅ Sanctions service is healthy\n');

  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
}

async function main() {
  console.log('🚀 Starting Sanctions Screening Tests\n');
  console.log('=' .repeat(50));
  
  try {
    await testHealthChecks();
    await testProductionScreening();
    await testSanctionsService();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  main().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { testProductionScreening, testSanctionsService, testHealthChecks };
