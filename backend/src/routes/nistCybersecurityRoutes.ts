/**
 * NIST Cybersecurity Framework API Routes
 * Production-ready endpoints for NIST CSF 2.0 compliance
 */

import { Router, Request, Response } from 'express';
import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { ProductionNISTCybersecurityService } from '../services/nist/ProductionNISTCybersecurityService';

export class NISTCybersecurityRoutes {
  private router: Router;
  private nistService: ProductionNISTCybersecurityService;
  private logger: Logger;
  private prisma: PrismaClient;

  constructor(logger: Logger, prisma: PrismaClient) {
    this.router = Router();
    this.logger = logger;
    this.prisma = prisma;
    this.nistService = new ProductionNISTCybersecurityService(logger, prisma);
    
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Initialize NIST service
    this.router.use(async (req, res, next) => {
      try {
        await this.nistService.initialize();
        next();
      } catch (error) {
        this.logger.error('Failed to initialize NIST service', { error });
        res.status(500).json({ error: 'Service initialization failed' });
      }
    });

    // Asset Management Routes (IDENTIFY function)
    this.router.get('/assets', this.getAssets.bind(this));
    this.router.post('/assets/discover', this.discoverAssets.bind(this));
    this.router.get('/assets/inventory', this.getAssetInventory.bind(this));
    this.router.get('/assets/:id', this.getAssetById.bind(this));
    this.router.put('/assets/:id', this.updateAsset.bind(this));

    // Risk Assessment Routes (IDENTIFY function)
    this.router.get('/risk-assessment', this.getRiskAssessment.bind(this));
    this.router.post('/risk-assessment/assess', this.assessRisk.bind(this));
    this.router.get('/risk-assessment/:id', this.getRiskAssessmentById.bind(this));

    // Protection Controls Routes (PROTECT function)
    this.router.get('/protection/status', this.getProtectionStatus.bind(this));
    this.router.post('/protection/implement', this.implementProtections.bind(this));
    this.router.get('/protection/controls', this.getProtectionControls.bind(this));

    // Detection Routes (DETECT function)
    this.router.get('/detection/results', this.getDetectionResults.bind(this));
    this.router.post('/detection/scan', this.performDetectionScan.bind(this));
    this.router.get('/detection/continuous-monitoring', this.getContinuousMonitoring.bind(this));

    // Compliance Dashboard
    this.router.get('/dashboard', this.getComplianceDashboard.bind(this));

    // OSCAL Integration Routes
    this.router.get('/oscal/assessments', this.getOSCALAssessments.bind(this));
    this.router.get('/oscal/assessments/:id', this.getOSCALAssessmentById.bind(this));
    this.router.get('/oscal/controls', this.getOSCALControls.bind(this));
    this.router.post('/oscal/export/:id', this.exportOSCALAssessment.bind(this));

    // OpenSCAP Integration Routes
    this.router.get('/openscap/profiles', this.getOpenSCAPProfiles.bind(this));
    this.router.get('/openscap/scans', this.getOpenSCAPScans.bind(this));
    this.router.get('/openscap/scans/:id', this.getOpenSCAPScanById.bind(this));

    // NIST CSF Function Status
    this.router.get('/functions/status', this.getNISTCSFFunctionStatus.bind(this));
  }

  /**
   * Get all assets
   */
  private async getAssets(req: Request, res: Response): Promise<void> {
    try {
      const { category, criticality, status } = req.query;
      
      let assets;
      if (category) {
        assets = await this.nistService.assetDiscoveryService.getAssetsByCategory(category as string);
      } else if (criticality) {
        assets = await this.nistService.assetDiscoveryService.getAssetsByCriticality(criticality as any);
      } else {
        const inventory = await this.nistService.assetDiscoveryService.getLatestInventory();
        assets = inventory?.assets || [];
      }

      res.json({
        success: true,
        data: assets,
        count: assets.length
      });
    } catch (error) {
      this.logger.error('Failed to get assets', { error });
      res.status(500).json({ error: 'Failed to retrieve assets' });
    }
  }

  /**
   * Discover assets
   */
  private async discoverAssets(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('Starting asset discovery via API');
      
      const inventory = await this.nistService.identifyAssets();
      
      res.json({
        success: true,
        data: inventory,
        message: `Discovered ${inventory.totalCount} assets`
      });
    } catch (error) {
      this.logger.error('Asset discovery failed', { error });
      res.status(500).json({ error: 'Asset discovery failed' });
    }
  }

  /**
   * Get asset inventory
   */
  private async getAssetInventory(req: Request, res: Response): Promise<void> {
    try {
      const inventory = await this.nistService.assetDiscoveryService.getLatestInventory();
      
      if (!inventory) {
        res.status(404).json({ error: 'No asset inventory found' });
        return;
      }

      res.json({
        success: true,
        data: inventory
      });
    } catch (error) {
      this.logger.error('Failed to get asset inventory', { error });
      res.status(500).json({ error: 'Failed to retrieve asset inventory' });
    }
  }

  /**
   * Get asset by ID
   */
  private async getAssetById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const asset = await this.nistService.assetDiscoveryService.getAsset(id);
      
      if (!asset) {
        res.status(404).json({ error: 'Asset not found' });
        return;
      }

      res.json({
        success: true,
        data: asset
      });
    } catch (error) {
      this.logger.error('Failed to get asset', { error });
      res.status(500).json({ error: 'Failed to retrieve asset' });
    }
  }

  /**
   * Update asset
   */
  private async updateAsset(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      await this.nistService.assetDiscoveryService.updateAsset(id, updates);
      
      res.json({
        success: true,
        message: 'Asset updated successfully'
      });
    } catch (error) {
      this.logger.error('Failed to update asset', { error });
      res.status(500).json({ error: 'Failed to update asset' });
    }
  }

  /**
   * Get risk assessment
   */
  private async getRiskAssessment(req: Request, res: Response): Promise<void> {
    try {
      const assessment = await this.nistService.riskAssessmentService.getRiskAssessment('latest');
      
      if (!assessment) {
        res.status(404).json({ error: 'No risk assessment found' });
        return;
      }

      res.json({
        success: true,
        data: assessment
      });
    } catch (error) {
      this.logger.error('Failed to get risk assessment', { error });
      res.status(500).json({ error: 'Failed to retrieve risk assessment' });
    }
  }

  /**
   * Assess risk
   */
  private async assessRisk(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('Starting risk assessment via API');
      
      const assessment = await this.nistService.assessRisk();
      
      res.json({
        success: true,
        data: assessment,
        message: `Risk assessment completed with ${assessment.riskLevel} overall risk level`
      });
    } catch (error) {
      this.logger.error('Risk assessment failed', { error });
      res.status(500).json({ error: 'Risk assessment failed' });
    }
  }

  /**
   * Get risk assessment by ID
   */
  private async getRiskAssessmentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const assessment = await this.nistService.riskAssessmentService.getRiskAssessment(id);
      
      if (!assessment) {
        res.status(404).json({ error: 'Risk assessment not found' });
        return;
      }

      res.json({
        success: true,
        data: assessment
      });
    } catch (error) {
      this.logger.error('Failed to get risk assessment', { error });
      res.status(500).json({ error: 'Failed to retrieve risk assessment' });
    }
  }

  /**
   * Get protection status
   */
  private async getProtectionStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.nistService.getProtectionStatus();
      
      if (!status) {
        res.status(404).json({ error: 'No protection status found' });
        return;
      }

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      this.logger.error('Failed to get protection status', { error });
      res.status(500).json({ error: 'Failed to retrieve protection status' });
    }
  }

  /**
   * Implement protections
   */
  private async implementProtections(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('Starting protection implementation via API');
      
      const status = await this.nistService.implementProtections();
      
      res.json({
        success: true,
        data: status,
        message: `Protection implementation completed with ${status.overallStatus} status`
      });
    } catch (error) {
      this.logger.error('Protection implementation failed', { error });
      res.status(500).json({ error: 'Protection implementation failed' });
    }
  }

  /**
   * Get protection controls
   */
  private async getProtectionControls(req: Request, res: Response): Promise<void> {
    try {
      const { function: func, categories, status } = req.query;
      
      const controls = await this.nistService.oscalClient.getControls({
        function: func as string,
        categories: categories ? (categories as string).split(',') : undefined,
        status: status as string
      });

      res.json({
        success: true,
        data: controls,
        count: controls.length
      });
    } catch (error) {
      this.logger.error('Failed to get protection controls', { error });
      res.status(500).json({ error: 'Failed to retrieve protection controls' });
    }
  }

  /**
   * Get detection results
   */
  private async getDetectionResults(req: Request, res: Response): Promise<void> {
    try {
      const results = await this.nistService.getLatestDetectionResults();
      
      if (!results) {
        res.status(404).json({ error: 'No detection results found' });
        return;
      }

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      this.logger.error('Failed to get detection results', { error });
      res.status(500).json({ error: 'Failed to retrieve detection results' });
    }
  }

  /**
   * Perform detection scan
   */
  private async performDetectionScan(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('Starting detection scan via API');
      
      const results = await this.nistService.detectThreats();
      
      res.json({
        success: true,
        data: results,
        message: `Detection scan completed: ${results.anomaliesDetected.length} anomalies, ${results.securityEvents.length} events`
      });
    } catch (error) {
      this.logger.error('Detection scan failed', { error });
      res.status(500).json({ error: 'Detection scan failed' });
    }
  }

  /**
   * Get continuous monitoring status
   */
  private async getContinuousMonitoring(req: Request, res: Response): Promise<void> {
    try {
      const monitoring = await this.nistService.openSCAPEngine.getContinuousMonitoringStatus();
      
      res.json({
        success: true,
        data: monitoring
      });
    } catch (error) {
      this.logger.error('Failed to get continuous monitoring status', { error });
      res.status(500).json({ error: 'Failed to retrieve continuous monitoring status' });
    }
  }

  /**
   * Get compliance dashboard
   */
  private async getComplianceDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboard = await this.nistService.getComplianceDashboard();
      
      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      this.logger.error('Failed to get compliance dashboard', { error });
      res.status(500).json({ error: 'Failed to retrieve compliance dashboard' });
    }
  }

  /**
   * Get OSCAL assessments
   */
  private async getOSCALAssessments(req: Request, res: Response): Promise<void> {
    try {
      const assessments = await this.prisma.oscalAssessment.findMany({
        orderBy: { startDate: 'desc' },
        take: 10
      });

      res.json({
        success: true,
        data: assessments,
        count: assessments.length
      });
    } catch (error) {
      this.logger.error('Failed to get OSCAL assessments', { error });
      res.status(500).json({ error: 'Failed to retrieve OSCAL assessments' });
    }
  }

  /**
   * Get OSCAL assessment by ID
   */
  private async getOSCALAssessmentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const assessment = await this.nistService.oscalClient.getAssessment(id);
      
      if (!assessment) {
        res.status(404).json({ error: 'OSCAL assessment not found' });
        return;
      }

      res.json({
        success: true,
        data: assessment
      });
    } catch (error) {
      this.logger.error('Failed to get OSCAL assessment', { error });
      res.status(500).json({ error: 'Failed to retrieve OSCAL assessment' });
    }
  }

  /**
   * Get OSCAL controls
   */
  private async getOSCALControls(req: Request, res: Response): Promise<void> {
    try {
      const { function: func, categories, status } = req.query;
      
      const controls = await this.nistService.oscalClient.getControls({
        function: func as string,
        categories: categories ? (categories as string).split(',') : undefined,
        status: status as string
      });

      res.json({
        success: true,
        data: controls,
        count: controls.length
      });
    } catch (error) {
      this.logger.error('Failed to get OSCAL controls', { error });
      res.status(500).json({ error: 'Failed to retrieve OSCAL controls' });
    }
  }

  /**
   * Export OSCAL assessment
   */
  private async exportOSCALAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const oscalJson = await this.nistService.oscalClient.exportAssessment(id);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="oscal-assessment-${id}.json"`);
      res.send(oscalJson);
    } catch (error) {
      this.logger.error('Failed to export OSCAL assessment', { error });
      res.status(500).json({ error: 'Failed to export OSCAL assessment' });
    }
  }

  /**
   * Get OpenSCAP profiles
   */
  private async getOpenSCAPProfiles(req: Request, res: Response): Promise<void> {
    try {
      const profiles = this.nistService.openSCAPEngine.getProfiles();
      
      res.json({
        success: true,
        data: profiles,
        count: profiles.length
      });
    } catch (error) {
      this.logger.error('Failed to get OpenSCAP profiles', { error });
      res.status(500).json({ error: 'Failed to retrieve OpenSCAP profiles' });
    }
  }

  /**
   * Get OpenSCAP scans
   */
  private async getOpenSCAPScans(req: Request, res: Response): Promise<void> {
    try {
      const scans = await this.prisma.openSCAPScanResult.findMany({
        orderBy: { startTime: 'desc' },
        take: 10
      });

      res.json({
        success: true,
        data: scans,
        count: scans.length
      });
    } catch (error) {
      this.logger.error('Failed to get OpenSCAP scans', { error });
      res.status(500).json({ error: 'Failed to retrieve OpenSCAP scans' });
    }
  }

  /**
   * Get OpenSCAP scan by ID
   */
  private async getOpenSCAPScanById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const scan = await this.nistService.openSCAPEngine.getScanResults(id);
      
      if (!scan) {
        res.status(404).json({ error: 'OpenSCAP scan not found' });
        return;
      }

      res.json({
        success: true,
        data: scan
      });
    } catch (error) {
      this.logger.error('Failed to get OpenSCAP scan', { error });
      res.status(500).json({ error: 'Failed to retrieve OpenSCAP scan' });
    }
  }

  /**
   * Get NIST CSF function status
   */
  private async getNISTCSFFunctionStatus(req: Request, res: Response): Promise<void> {
    try {
      const dashboard = await this.nistService.getComplianceDashboard();
      
      res.json({
        success: true,
        data: dashboard.nistCsfFunctions
      });
    } catch (error) {
      this.logger.error('Failed to get NIST CSF function status', { error });
      res.status(500).json({ error: 'Failed to retrieve NIST CSF function status' });
    }
  }

  /**
   * Get router instance
   */
  public getRouter(): Router {
    return this.router;
  }
}
