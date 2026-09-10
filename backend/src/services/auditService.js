const db = require('../db');
const logger = require('../utils/logger');

/**
 * Record an audit log entry in background without blocking response.
 */
async function logAudit(options = {}) {
  try {
    const {
      req,
      userId,
      userName,
      userRole,
      module,
      action,
      entityType,
      entityId,
      entityNumber,
      details,
      ipAddress,
      status = 'SUCCESS'
    } = options;

    const resolvedUserId = userId || req?.user?.id || null;
    const resolvedUserName = userName || req?.user?.full_name || req?.user?.name || (resolvedUserId ? 'User' : 'System');
    const resolvedUserRole = userRole || req?.user?.role || req?.user?.role_name || null;
    const resolvedIp = ipAddress || req?.ip || req?.headers?.['x-forwarded-for'] || req?.connection?.remoteAddress || null;

    let detailsString = details;
    if (typeof details === 'object' && details !== null) {
      try {
        detailsString = JSON.stringify(details);
      } catch (e) {
        detailsString = String(details);
      }
    }

    // Insert into DB
    const [inserted] = await db('audit_logs').insert({
      user_id: resolvedUserId,
      user_name: resolvedUserName,
      user_role: resolvedUserRole,
      module: module || 'SYSTEM',
      action: action || 'ACTION',
      entity_type: entityType || null,
      entity_id: entityId ? String(entityId) : null,
      entity_number: entityNumber ? String(entityNumber) : null,
      details: detailsString || null,
      ip_address: resolvedIp,
      status,
      created_at: db.fn.now()
    }).returning('*');

    // Also write info log to Winston file
    logger.info(`[AUDIT] ${module}:${action} by ${resolvedUserName} (${resolvedUserRole || 'N/A'}) - ${detailsString || ''}`, {
      audit_id: inserted?.id,
      module,
      action,
      entity_number: entityNumber,
      user_id: resolvedUserId,
      ip: resolvedIp,
    });

    return inserted;
  } catch (err) {
    // Log to Winston error log but never throw to disrupt user request
    logger.error(`Failed to record audit log: ${err.message}`, { error: err.stack });
    return null;
  }
}

/**
 * Fetch paginated and filtered audit logs for admin UI.
 */
async function getAuditLogs(filters = {}) {
  const {
    page = 1,
    limit = 25,
    module,
    action,
    user_id,
    search,
    from_date,
    to_date,
  } = filters;

  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  let query = db('audit_logs');

  if (module && module !== 'all') {
    query = query.where('module', module);
  }

  if (action) {
    query = query.where('action', 'ilike', `%${action}%`);
  }

  if (user_id) {
    query = query.where('user_id', user_id);
  }

  if (from_date) {
    query = query.where('created_at', '>=', `${from_date} 00:00:00`);
  }

  if (to_date) {
    query = query.where('created_at', '<=', `${to_date} 23:59:59`);
  }

  if (search) {
    query = query.where(builder => {
      builder.where('user_name', 'ilike', `%${search}%`)
        .orWhere('action', 'ilike', `%${search}%`)
        .orWhere('module', 'ilike', `%${search}%`)
        .orWhere('entity_number', 'ilike', `%${search}%`)
        .orWhere('details', 'ilike', `%${search}%`);
    });
  }

  // Clone for count
  const countQuery = query.clone().count('id as total').first();
  const [{ total }] = await countQuery;

  const logs = await query
    .orderBy('created_at', 'desc')
    .limit(parseInt(limit))
    .offset(offset);

  return {
    logs,
    pagination: {
      total: parseInt(total || 0),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(parseInt(total || 0) / parseInt(limit)) || 1
    }
  };
}

/**
 * Quick audit dashboard metrics.
 */
async function getAuditSummary() {
  const today = new Date().toISOString().slice(0, 10);

  const [totalEvents] = await db('audit_logs').count('id as count');
  const [todayEvents] = await db('audit_logs').where('created_at', '>=', `${today} 00:00:00`).count('id as count');
  const [authEvents] = await db('audit_logs').where('module', 'AUTH').count('id as count');
  const [procurementEvents] = await db('audit_logs').where('module', 'PROCUREMENT').count('id as count');
  const [inventoryEvents] = await db('audit_logs').where('module', 'INVENTORY').count('id as count');

  const recentEvents = await db('audit_logs')
    .orderBy('created_at', 'desc')
    .limit(10);

  return {
    total_events: parseInt(totalEvents?.count || 0),
    today_events: parseInt(todayEvents?.count || 0),
    auth_events: parseInt(authEvents?.count || 0),
    procurement_events: parseInt(procurementEvents?.count || 0),
    inventory_events: parseInt(inventoryEvents?.count || 0),
    recent_events: recentEvents
  };
}

module.exports = {
  logAudit,
  getAuditLogs,
  getAuditSummary
};
