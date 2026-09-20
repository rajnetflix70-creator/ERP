const { logAudit } = require('../services/auditService');

/**
 * Express middleware to automatically log mutating API operations (POST, PUT, PATCH, DELETE)
 */
module.exports = function autoAudit(moduleName) {
  return (req, res, next) => {
    // Only intercept state-changing methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const originalSend = res.send;
    const originalJson = res.json;

    let responseBody = null;

    res.json = function (body) {
      responseBody = body;
      return originalJson.apply(this, arguments);
    };

    res.send = function (body) {
      if (!responseBody) {
        responseBody = body;
      }
      return originalSend.apply(this, arguments);
    };

    res.on('finish', () => {
      // Only log if response status was successful (2xx or 3xx)
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const action = `${req.method}_${req.baseUrl?.split('/').pop() || 'RESOURCE'}`.toUpperCase();
        
        // Extract possible entity ID from params or response body
        const entityId = req.params?.id || responseBody?.data?.id || responseBody?.id || null;
        const entityNumber = responseBody?.data?.code || responseBody?.data?.job_no || responseBody?.data?.po_number || null;

        // Clean details for logging (omit passwords and tokens)
        const sanitizedBody = { ...req.body };
        delete sanitizedBody.password;
        delete sanitizedBody.token;
        delete sanitizedBody.refresh_token;

        logAudit({
          req,
          module: moduleName || req.baseUrl?.split('/').pop()?.toUpperCase() || 'GENERAL',
          action: `${req.method} ${req.originalUrl}`,
          entityType: req.baseUrl?.split('/').pop() || null,
          entityId,
          entityNumber,
          details: {
            method: req.method,
            path: req.originalUrl,
            params: req.params,
            body: Object.keys(sanitizedBody).length > 0 ? sanitizedBody : undefined
          },
          status: 'SUCCESS'
        }).catch(() => {});
      }
    });

    next();
  };
};
