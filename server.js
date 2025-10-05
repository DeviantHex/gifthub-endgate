const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Configure based on your needs
}));

app.use(cors());
app.use(express.static('public'));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Get real client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress;
}

// Main gift page route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gift redemption endpoint
app.post('/api/redeem', async (req, res) => {
  const { token, cardData } = req.body;
  const clientIP = getClientIP(req);

  if (!token || !cardData) {
    return res.status(400).json({
      success: false,
      error: 'Token and card data are required'
    });
  }

  try {
    // Forward to your backend gift redemption endpoint
    const response = await axios.post(`${BACKEND_URL}/api/gift/redeem`, {
      token,
      cardData
    }, {
      headers: {
        'X-Forwarded-For': clientIP,
        'X-Real-IP': clientIP,
        'User-Agent': req.headers['user-agent']
      },
      timeout: 10000
    });

    res.json(response.data);

  } catch (error) {
    console.error('Gift redemption error:', error.message);
    
    if (error.response) {
      // Backend returned an error
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      res.status(503).json({
        success: false,
        error: 'Service timeout - please try again'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Gift processing service unavailable'
      });
    }
  }
});

app.post('/api/validate-token', async (req, res) => {
    const { token } = req.body;
    const clientIP = getClientIP(req);

    if (!token) {
        return res.status(400).json({
            valid: false,
            reason: 'Token is required'
        });
    }

    try {
        // Call your backend security API to validate the token
        const validationResponse = await axios.post(
            `${BACKEND_URL}/api/auth/validate-token`,
            { token },
            {
                headers: {
                    'X-Forwarded-For': clientIP,
                    'X-Real-IP': clientIP,
                    'User-Agent': req.headers['user-agent']
                },
                timeout: 5000
            }
        );

        // Forward the response from your backend
        res.json(validationResponse.data);

    } catch (error) {
        console.error('Token validation error:', error.message);
        
        if (error.response) {
            // Backend returned an error
            res.status(error.response.status).json(error.response.data);
        } else if (error.code === 'ECONNABORTED') {
            res.status(503).json({
                valid: false,
                reason: 'Token validation service timeout'
            });
        } else {
            res.status(500).json({
                valid: false,
                reason: 'Token validation service unavailable'
            });
        }
    }
});

// Check redemption status
app.get('/api/status/:token', async (req, res) => {
  const { token } = req.params;
  const clientIP = getClientIP(req);

  try {
    const response = await axios.get(`${BACKEND_URL}/api/gift/status/${token}`, {
      headers: {
        'X-Forwarded-For': clientIP,
        'X-Real-IP': clientIP
      },
      timeout: 5000
    });

    res.json(response.data);

  } catch (error) {
    console.error('Status check error:', error.message);
    res.status(500).json({ error: 'Status check failed' });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, {
      timeout: 3000
    });
    res.json({
      status: 'healthy',
      giftService: 'operational',
      backend: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      giftService: 'operational',
      backend: 'unavailable',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log('\n🎁 ===== GIFT REDEMPTION PAGE STARTED =====');
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 Backend: ${BACKEND_URL}`);
  console.log(`🛡️  Security features enabled`);
  console.log(`======================================\n`);
});