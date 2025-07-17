const { User } = require('../models');

// Middleware to check domain restrictions based on user plan
const domainAuth = async (req, res, next) => {
  try {
    // Skip domain check for localhost
    const origin = req.get('origin') || req.get('host');
    const isLocalhost = origin && (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('::1')
    );
    
    if (isLocalhost) {
      return next();
    }
    
    // Get user from token
    const user = await User.findByPk(req.user.user_id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Check plan restrictions
    const plan = user.plan || 'free';
    
    switch (plan) {
      case 'free':
        return res.status(403).json({ 
          error: 'Free plan only works on localhost',
          upgrade_url: 'https://easy-ai.dev/pricing',
          current_plan: 'free'
        });
        
      case 'pro':
        // Pro plan allows any domain
        return next();
        
      case 'enterprise':
        // Enterprise plan allows any domain
        return next();
        
      default:
        return res.status(403).json({ 
          error: 'Invalid plan',
          current_plan: plan
        });
    }
    
  } catch (error) {
    console.error('Domain auth error:', error);
    res.status(500).json({ error: 'Domain authentication failed' });
  }
};

module.exports = { domainAuth };