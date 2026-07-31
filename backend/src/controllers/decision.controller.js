const BusinessProfile = require('../models/pg/BusinessProfile');
const LoanApplication = require('../models/pg/LoanApplication');
const Decision        = require('../models/mongo/Decision');
const AuditLog        = require('../models/mongo/AuditLog');
const { runDecisionEngine } = require('../services/decisionEngine');

// POST /api/v1/decision/:applicationId
// Runs the credit scoring engine and saves the result
const makeDecision = async (req, res, next) => {
  const start = Date.now();
  const { applicationId } = req.params;

  try {
    // 1. Find the application in PostgreSQL
    const application = await LoanApplication.findByPk(applicationId, {
      include: [{ association: 'profile' }],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'APPLICATION_NOT_FOUND',
        message: `No application found with id: ${applicationId}`,
      });
    }

    // 2. If already decided, return the existing decision instead of re-running
    if (application.status === 'decided') {
      const existing = await Decision.findOne({ applicationId });
      return res.json({
        success: true,
        message: 'Decision already exists for this application',
        alreadyProcessed: true,
        data: existing,
      });
    }

    // 3. Mark as processing so concurrent requests don't double-run
    await application.update({ status: 'processing' });

    AuditLog.create({
      event: 'DECISION_REQUESTED',
      applicationId,
      profileId: application.profileId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch(() => {});

    // 4. Run the scoring engine
    const result = runDecisionEngine(
      application.profile,  // { monthlyRevenue, businessType }
      application           // { amount, tenureMonths }
    );

    // 5. Save decision to MongoDB
    const decision = await Decision.create({
      applicationId,
      profileId:        application.profileId,
      status:           result.status,
      creditScore:      result.creditScore,
      reasonCodes:      result.reasonCodes,
      breakdown:        result.breakdown,
      inputs:           result.inputs,
      processingTimeMs: Date.now() - start,
    });

    // 6. Mark application as decided in PostgreSQL
    await application.update({ status: 'decided' });

    AuditLog.create({
      event: 'DECISION_COMPLETED',
      applicationId,
      profileId: application.profileId,
      result: {
        status:      result.status,
        creditScore: result.creditScore,
        reasonCodes: result.reasonCodes,
      },
      durationMs: Date.now() - start,
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: `Application ${result.status.toLowerCase()}`,
      data: {
        applicationId,
        status:           result.status,
        creditScore:      result.creditScore,
        reasonCodes:      result.reasonCodes,
        breakdown:        result.breakdown,
        inputs:           result.inputs,
        processingTimeMs: Date.now() - start,
        decidedAt:        decision.createdAt,
      },
    });

  } catch (err) {
    // If engine crashes, roll back status so user can retry
    await LoanApplication.update(
      { status: 'pending' },
      { where: { id: applicationId } }
    ).catch(() => {});

    next(err);
  }
};

// GET /api/v1/decision/:applicationId
// Retrieves an existing decision
const getDecision = async (req, res, next) => {
  try {
    const decision = await Decision.findOne({ applicationId: req.params.applicationId });

    if (!decision) {
      return res.status(404).json({
        success: false,
        error: 'DECISION_NOT_FOUND',
        message: `No decision yet for application: ${req.params.applicationId}. Call POST first.`,
      });
    }

    return res.json({ success: true, data: decision });
  } catch (err) {
    next(err);
  }
};

module.exports = { makeDecision, getDecision };