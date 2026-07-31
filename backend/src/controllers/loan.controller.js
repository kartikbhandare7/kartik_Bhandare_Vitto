const BusinessProfile = require('../models/pg/BusinessProfile');
const LoanApplication = require('../models/pg/LoanApplication');
const AuditLog        = require('../models/mongo/AuditLog');

// POST /api/v1/loan/apply
const applyForLoan = async (req, res, next) => {
  const start = Date.now();
  try {
    const { profileId, amount, tenureMonths, purpose } = req.body;

    // Check the profile actually exists before creating loan
    const profile = await BusinessProfile.findByPk(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'PROFILE_NOT_FOUND',
        message: `No business profile found with id: ${profileId}`,
      });
    }

    const application = await LoanApplication.create({
      profileId,
      amount,
      tenureMonths,
      purpose,
      status: 'pending',
    });

    AuditLog.create({
      event: 'APPLICATION_SUBMITTED',
      applicationId: application.id,
      profileId,
      payload: { amount, tenureMonths, purpose },
      ip: req.ip,
      userAgent: req.get('user-agent'),
      durationMs: Date.now() - start,
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      data: {
        applicationId: application.id,
        profileId:     application.profileId,
        amount:        parseFloat(application.amount),
        tenureMonths:  application.tenureMonths,
        purpose:       application.purpose,
        status:        application.status,
        createdAt:     application.createdAt,
        // Tell the frontend what to call next
        nextStep: `POST /api/v1/decision/${application.id}`,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/loan/:id
const getLoan = async (req, res, next) => {
  try {
    const application = await LoanApplication.findByPk(req.params.id, {
      include: [{ association: 'profile' }],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'APPLICATION_NOT_FOUND',
        message: `No application found with id: ${req.params.id}`,
      });
    }

    return res.json({ success: true, data: application });
  } catch (err) {
    next(err);
  }
};

module.exports = { applyForLoan, getLoan };