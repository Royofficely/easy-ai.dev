const express = require('express');
const { AuthEvent, User } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get authentication event statistics
router.get('/auth-events', authMiddleware, async (req, res) => {
  try {
    const { days = 30, event_type, email } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const whereClause = {
      timestamp: {
        [Op.gte]: startDate
      }
    };
    
    if (event_type) {
      whereClause.event_type = event_type;
    }
    
    if (email) {
      whereClause.email = {
        [Op.like]: `%${email}%`
      };
    }
    
    const events = await AuthEvent.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name', 'role']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: parseInt(req.query.limit) || 100
    });
    
    res.json({
      events,
      total: events.length,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Error fetching auth events:', error);
    res.status(500).json({ error: 'Failed to fetch auth events' });
  }
});

// Get authentication statistics summary
router.get('/auth-stats', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get event counts by type
    const eventStats = await AuthEvent.findAll({
      where: {
        timestamp: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        'event_type',
        [AuthEvent.sequelize.fn('COUNT', AuthEvent.sequelize.col('id')), 'count']
      ],
      group: ['event_type']
    });
    
    // Get daily signup counts
    const dailySignups = await AuthEvent.findAll({
      where: {
        timestamp: {
          [Op.gte]: startDate
        },
        event_type: 'signup'
      },
      attributes: [
        [AuthEvent.sequelize.fn('DATE', AuthEvent.sequelize.col('timestamp')), 'date'],
        [AuthEvent.sequelize.fn('COUNT', AuthEvent.sequelize.col('id')), 'count']
      ],
      group: [AuthEvent.sequelize.fn('DATE', AuthEvent.sequelize.col('timestamp'))],
      order: [['date', 'DESC']]
    });
    
    // Get daily login counts
    const dailyLogins = await AuthEvent.findAll({
      where: {
        timestamp: {
          [Op.gte]: startDate
        },
        event_type: 'login'
      },
      attributes: [
        [AuthEvent.sequelize.fn('DATE', AuthEvent.sequelize.col('timestamp')), 'date'],
        [AuthEvent.sequelize.fn('COUNT', AuthEvent.sequelize.col('id')), 'count']
      ],
      group: [AuthEvent.sequelize.fn('DATE', AuthEvent.sequelize.col('timestamp'))],
      order: [['date', 'DESC']]
    });
    
    // Get unique users count
    const uniqueUsers = await AuthEvent.findAll({
      where: {
        timestamp: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        [AuthEvent.sequelize.fn('COUNT', AuthEvent.sequelize.fn('DISTINCT', AuthEvent.sequelize.col('email'))), 'unique_users']
      ]
    });
    
    res.json({
      period: `${days} days`,
      event_stats: eventStats,
      daily_signups: dailySignups,
      daily_logins: dailyLogins,
      unique_users: uniqueUsers[0]?.dataValues?.unique_users || 0
    });
  } catch (error) {
    console.error('Error fetching auth stats:', error);
    res.status(500).json({ error: 'Failed to fetch auth stats' });
  }
});

// Get recent activity
router.get('/recent-activity', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const recentEvents = await AuthEvent.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: limit
    });
    
    res.json({
      recent_events: recentEvents,
      total: recentEvents.length
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

module.exports = router;