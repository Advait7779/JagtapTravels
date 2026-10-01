function validateProductionConfig(env, { hasUsers = false } = {}) {
  if (env.NODE_ENV !== 'production') return;
  const errors = [];
  if (env.STORAGE_MODE !== 'postgres') errors.push('STORAGE_MODE must be postgres.');
  if (env.TRUST_PROXY !== '1') errors.push('TRUST_PROXY must be 1 behind the Coolify proxy.');
  if (!hasUsers) {
    const adminEmail = String(env.ADMIN_EMAIL || '').trim();
    const adminPassword = String(env.ADMIN_PASSWORD || '');
    const adminFullName = String(env.ADMIN_FULL_NAME || '').trim();
    const hasAdminBootstrap = Boolean(adminEmail || adminPassword);
    if (hasAdminBootstrap) {
      if (!adminEmail || !adminPassword)
        errors.push('ADMIN_EMAIL and ADMIN_PASSWORD must both be set for administrator bootstrap.');
      if (adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail))
        errors.push('ADMIN_EMAIL must be a valid email address.');
      const normalized = adminPassword.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        adminPassword.length < 12 ||
        ['admin123', 'password123', 'jagtaptours', 'adminpassword'].includes(normalized)
      )
        errors.push('ADMIN_PASSWORD must be a strong password of at least 12 characters.');
      if (adminFullName.length > 200)
        errors.push('ADMIN_FULL_NAME must not exceed 200 characters.');
    } else if (String(env.SETUP_TOKEN || '').length < 32) {
      errors.push(
        'Set ADMIN_EMAIL and ADMIN_PASSWORD, or provide a SETUP_TOKEN of at least 32 characters for first-run setup.',
      );
    }
  }
  const idleMinutes = Number(env.SESSION_IDLE_MINUTES || 10080);
  if (!Number.isFinite(idleMinutes) || idleMinutes < 5 || idleMinutes > 10080)
    errors.push('SESSION_IDLE_MINUTES must be between 5 and 10080.');
  try {
    const database = new URL(env.DATABASE_URL || '');
    const password = decodeURIComponent(database.password || '');
    if (!['postgres:', 'postgresql:'].includes(database.protocol))
      errors.push('DATABASE_URL must use PostgreSQL.');
    if (password.length < 20 || /^(password|postgres|changeme|admin123)$/i.test(password))
      errors.push('DATABASE_URL must contain a strong database password of at least 20 characters.');
  } catch {
    errors.push('DATABASE_URL must be a valid PostgreSQL URL.');
  }
  if (errors.length) throw new Error(`Unsafe production configuration: ${errors.join(' ')}`);
}

module.exports = { validateProductionConfig };
