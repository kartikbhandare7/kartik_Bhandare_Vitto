const BusinessProfile = require('../models/pg/BusinessProfile');
const AuditLog        = require('../models/mongo/AuditLog');

// POST /api/v1/profile
// Creates a new business profile
const createProfile = async (req, res, next) => {
  const start = Date.now();
  try {
    const { ownerName, pan, businessType, monthlyRevenue } = req.body;

    const profile = await BusinessProfile.create({
      ownerName,
      pan: pan.toUpperCase(),
      businessType,
      monthlyRevenue,
    });

    // Write audit log (non-blocking — failure here won't break the response)
    AuditLog.create({
      event: 'PROFILE_CREATED',
      profileId: profile.id,
      payload: { ownerName, pan, businessType, monthlyRevenue },
      ip: req.ip,
      userAgent: req.get('user-agent'),
      durationMs: Date.now() - start,
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Business profile created successfully',
      data: {
        profileId:      profile.id,
        ownerName:      profile.ownerName,
        pan:            profile.pan,
        businessType:   profile.businessType,
        monthlyRevenue: parseFloat(profile.monthlyRevenue),
        createdAt:      profile.createdAt,
      },
    });
  } catch (err) {
    next(err); // passes to errorHandler middleware
  }
};

// GET /api/v1/profile/:id
// Fetches a profile along with all its loan applications
const getProfile = async (req, res, next) => {
  try {
    const profile = await BusinessProfile.findByPk(req.params.id, {
      include: [{
        association: 'applications',
        attributes: ['id', 'amount', 'status', 'createdAt'],
      }],
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'PROFILE_NOT_FOUND',
        message: `No profile found with id: ${req.params.id}`,
      });
    }

    return res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

module.exports = { createProfile, getProfile };