const Joi = require('joi');

// PAN format: 5 uppercase letters + 4 digits + 1 uppercase letter
// Example: ABCDE1234F
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const schemas = {

  // Used when creating a business profile
  createProfile: Joi.object({
    ownerName: Joi.string().min(2).max(100).required()
      .messages({ 'any.required': 'Owner name is required' }),

    pan: Joi.string().pattern(PAN_REGEX).uppercase().required()
      .messages({
        'string.pattern.base': 'PAN must be in format ABCDE1234F',
        'any.required': 'PAN is required',
      }),

    businessType: Joi.string()
      .valid('retail', 'manufacturing', 'services', 'other')
      .required()
      .messages({
        'any.only': 'Business type must be: retail, manufacturing, services, or other',
        'any.required': 'Business type is required',
      }),

    monthlyRevenue: Joi.number().positive().min(1).required()
      .messages({
        'number.positive': 'Monthly revenue must be a positive number',
        'any.required': 'Monthly revenue is required',
      }),
  }),

  // Used when submitting a loan application
  createLoan: Joi.object({
    profileId: Joi.string().uuid().required()
      .messages({
        'string.guid': 'profileId must be a valid UUID',
        'any.required': 'profileId is required',
      }),

    amount: Joi.number().positive().min(1000).required()
      .messages({
        'number.min': 'Loan amount must be at least ₹1,000',
        'any.required': 'Loan amount is required',
      }),

    tenureMonths: Joi.number().integer().min(1).max(360).required()
      .messages({
        'number.min': 'Tenure must be at least 1 month',
        'any.required': 'Tenure is required',
      }),

    purpose: Joi.string().min(5).max(500).required()
      .messages({
        'string.min': 'Purpose must be at least 5 characters',
        'any.required': 'Loan purpose is required',
      }),
  }),

};

// This function returns an Express middleware
// Usage: router.post('/profile', validate('createProfile'), controller)
const validate = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName];

  const { error, value } = schema.validate(req.body, {
    abortEarly: false,   // show ALL errors, not just the first one
    stripUnknown: true,  // remove any extra fields the user sends
    convert: true,       // "123" string becomes 123 number automatically
  });

  if (error) {
    // Format errors as an array of { field, message } objects
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));

    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'One or more fields are invalid',
      details,
    });
  }

  req.body = value; // replace body with the cleaned/coerced version
  next();
};

module.exports = { validate };