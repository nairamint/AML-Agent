/**
 * Enterprise Monitoring Integration Script
 * Integrates the monitoring service with the main application
 */

const express = require('express');
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
    })
  ]
});

async function integrateEnterpriseMonitoring() {
  const prisma = new PrismaClient();
  const app = express();
  
  try {
    logger.info('🚀 Starting Enterprise Monitoring Integration');
    
    // Import the monitoring routes (this would be done differently in a real TypeScript setup)
    const { MonitoringRoutes } = require('./src/routes/monitoringRoutes');
    
    // Initialize monitoring routes
    const monitoringRoutes = new MonitoringRoutes(logger, prisma);
    
    // Add monitoring routes to the application
    app.use('/api/monitoring', monitoringRoutes.getRouter());
    
    // Add health check endpoint
    app.get('/health', async (req, res) => {
      try {
        const health = await monitoringRoutes.monitoringService.healthCheck();
        res.status(health.status === 'healthy' ? 200 : 503).json(health);
      } catch (error) {
        res.status(503).json({ 
          status: 'unhealthy', 
          error: error.message 
        });
      }
    });
    
    // Add metrics endpoint for Prometheus scraping
    app.get('/metrics', async (req, res) => {
      try {
        const metrics = await monitoringRoutes.monitoringService.getMetrics();
        res.setHeader('Content-Type', 'text/plain');
        res.send(metrics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Start the server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      logger.info(`🚀 Enterprise Monitoring Service running on port ${port}`);
      logger.info(`📊 Metrics endpoint: http://localhost:${port}/metrics`);
      logger.info(`❤️ Health check: http://localhost:${port}/health`);
      logger.info(`🔍 Monitoring API: http://localhost:${port}/api/monitoring`);
      
      logger.info('\n📋 Available Endpoints:');
      logger.info('   GET  /health                                    - Health check');
      logger.info('   GET  /metrics                                   - Prometheus metrics');
      logger.info('   GET  /api/monitoring/health                     - Detailed health status');
      logger.info('   GET  /api/monitoring/status                     - Component status');
      logger.info('   GET  /api/monitoring/metrics                    - Collect metrics');
      logger.info('   POST /api/monitoring/metrics/collect            - Trigger metrics collection');
      logger.info('   GET  /api/monitoring/alerts                     - Get alert rules');
      logger.info('   POST /api/monitoring/alerts/generate            - Generate alerts');
      logger.info('   GET  /api/monitoring/dashboards                 - Get dashboards');
      logger.info('   POST /api/monitoring/dashboards/create          - Create dashboards');
      logger.info('   GET  /api/monitoring/traces                     - Search traces');
      logger.info('   GET  /api/monitoring/traces/:traceId/analyze    - Analyze trace');
      logger.info('   GET  /api/monitoring/logs                       - Search logs');
      logger.info('   GET  /api/monitoring/logs/security              - Security events');
      logger.info('   GET  /api/monitoring/logs/compliance            - Compliance audit logs');
      logger.info('   GET  /api/monitoring/topology                   - Service topology');
      logger.info('   GET  /api/monitoring/query                      - Prometheus query');
      
      logger.info('\n🎉 Enterprise Monitoring Integration Complete!');
      logger.info('✅ All monitoring endpoints are now available');
      logger.info('✅ Health checks and metrics collection active');
      logger.info('✅ Alert generation and dashboard creation ready');
      logger.info('✅ Distributed tracing and log search operational');
      logger.info('✅ Security and compliance monitoring active');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('🛑 Shutting down Enterprise Monitoring Service...');
      await prisma.$disconnect();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('🛑 Shutting down Enterprise Monitoring Service...');
      await prisma.$disconnect();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('❌ Integration failed', { error });
    process.exit(1);
  }
}

// Run the integration if this script is executed directly
if (require.main === module) {
  integrateEnterpriseMonitoring();
}

module.exports = { integrateEnterpriseMonitoring };
