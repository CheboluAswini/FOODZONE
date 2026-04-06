const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Support both 'token' header (legacy) and 'Authorization' header (standard)
    const token = req.headers.token || 
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      console.log('[AUTH] No token provided');
      return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Store user ID in req.user (non-destructive)
      req.user = { id: decoded.id };
      console.log(`[AUTH] User authenticated: ${decoded.id}`);
      next();
    } catch (error) {
      console.log('[AUTH] Invalid token:', error.message);
      res.status(401).json({ success: false, message: "Invalid Token" });
    }
  } catch (error) {
    console.log('[AUTH] Auth error:', error);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
};

module.exports = authMiddleware;
