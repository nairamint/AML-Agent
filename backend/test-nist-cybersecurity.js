/**
 * NIST Cybersecurity Framework Test Script
 * Production-ready testing for NIST CSF 2.0 implementation
 */

const { PrismaClient } = require('@prisma/client');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'nist-cybersecurity-test.log' })
  ]
});

async function testNISTCybersecurityFramework() {
  const prisma = new PrismaClient();
  
  try {
    logger.info('Starting NIST Cybersecurity Framework Test');
    
    // Import the test suite (this would be done differently in a real TypeScript setup)
    const { NISTCybersecurityTestSuite } = require('./src/services/nist/NISTCybersecurityTestSuite');
    
    const testSuite = new NISTCybersecurityTestSuite(logger, prisma);
    const results = await testSuite.runTestSuite();
    
    // Generate and display test report
    const report = testSuite.generateTestReport(results);
    console.log(report);
    
    // Export results to file
    const fs = require('fs');
    fs.writeFileSync('nist-cybersecurity-test-results.json', testSuite.exportTestResults(results));
    fs.writeFileSync('nist-cybersecurity-test-report.md', report);
    
    logger.info('Test completed successfully', {
      total: results.totalTests,
      passed: results.passedTests,
      failed: results.failedTests,
      duration: `${results.duration}ms`
    });
    
    // Exit with appropriate code
    process.exit(results.failedTests > 0 ? 1 : 0);
    
  } catch (error) {
    logger.error('Test execution failed', { error });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testNISTCybersecurityFramework();
}

module.exports = { testNISTCybersecurityFramework };
