module.exports = function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: true, code: 'AUTH_REQUIRED', message: 'Authentication required' });
    }
    // super_admin and company_admin have universal access across all modules
    const universalAdminRoles = ['super_admin', 'company_admin'];
    if (universalAdminRoles.includes(req.user.role)) {
      return next();
    }
    // Check specific assigned roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Forbidden: Insufficient role permissions' });
    }
    next();
  };
};
