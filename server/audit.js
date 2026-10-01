const crypto = require('node:crypto');

const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');

function rehash(entries) {
  let previousHash = null;
  for (const entry of entries) {
    entry.previousHash = previousHash;
    const { hash, ...payload } = entry;
    entry.hash = digest(JSON.stringify(payload));
    previousHash = entry.hash;
  }
}

async function auditEvent(repo, event) {
  return repo.change((data) => {
    const previous = data.auditLogs.at(-1);
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: event.userId || null,
      userEmail: event.userEmail || null,
      action: event.action,
      method: event.method,
      path: event.path,
      targetId: event.targetId || null,
      outcome: event.outcome,
      statusCode: event.statusCode,
      ip: String(event.ip || '').slice(0, 100),
      userAgent: String(event.userAgent || '').slice(0, 500),
      previousHash: previous?.hash || null,
    };
    entry.hash = digest(JSON.stringify(entry));
    data.auditLogs.push(entry);
    if (data.auditLogs.length > 10000) {
      data.auditLogs.splice(0, data.auditLogs.length - 10000);
      rehash(data.auditLogs);
    }
    return entry;
  });
}

function actionName(req) {
  const path = req.path.replace(/^\//, '').replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id');
  return `${req.method.toLowerCase()}.${path.replace(/\//g, '.') || 'api'}`;
}

function auditMiddleware(repo) {
  return (req, res, next) => {
    const originalEnd = res.end;
    let ending = false;
    res.end = function auditedEnd(...args) {
      if (ending) return res;
      ending = true;
      res.end = originalEnd;
      const shouldRecord =
        !req.originalUrl.startsWith('/api/health') &&
        (req.method !== 'GET' || res.statusCode >= 400);
      if (!shouldRecord) return originalEnd.apply(res, args);
      const actor = req.user || req.auditActor;
      const event = {
        userId: actor?.id,
        userEmail: actor?.email,
        action: actionName(req),
        method: req.method,
        path: req.originalUrl.split('?')[0],
        targetId: req.params?.id || req.params?.docId,
        outcome: res.statusCode < 400 ? 'success' : 'failure',
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };
      auditEvent(repo, event)
        .catch((error) => console.error('Audit log write failed:', error.message))
        .finally(() => originalEnd.apply(res, args));
      return res;
    };
    next();
  };
}

function verifyAuditChain(entries) {
  let previousHash = null;
  for (const source of entries) {
    const { hash, ...entry } = source;
    if (entry.previousHash !== previousHash || digest(JSON.stringify(entry)) !== hash) return false;
    previousHash = hash;
  }
  return true;
}

module.exports = { auditEvent, auditMiddleware, verifyAuditChain };
