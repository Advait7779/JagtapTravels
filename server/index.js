const crypto = require('node:crypto');
require('./config/db');
const { Repository } = require('./data/repository');
const { createApp } = require('./app');
const { bootstrapAdminFromEnv } = require('./auth');
const { validateProductionConfig } = require('./security');

async function start() {
  // Validate secrets before attempting a network connection; setup-token presence is rechecked
  // after storage is loaded because established installations no longer require that token.
  validateProductionConfig(process.env, { hasUsers: true });
  const repo = new Repository();
  await repo.initialize();
  let state = await repo.read();
  validateProductionConfig(process.env, { hasUsers: state.users.length > 0 });
  if (!state.users.length) {
    const bootstrap = await bootstrapAdminFromEnv(repo);
    if (bootstrap.created) {
      console.log('Initial administrator created from environment variables.');
      state = await repo.read();
    }
  }
  let setupToken = process.env.SETUP_TOKEN;
  if (!state.users.length && process.env.NODE_ENV !== 'production' && !setupToken) {
    setupToken = crypto.randomBytes(24).toString('base64url');
    console.log(`First-run setup code: ${setupToken}`);
  }

  const server = createApp(repo, {
    setupToken,
  }).listen(Number(process.env.PORT || 5000), '0.0.0.0', () =>
    console.log('CRM listening on port ' + (process.env.PORT || 5000) + '; storage: ' + repo.mode),
  );

  for (const signal of ['SIGINT', 'SIGTERM'])
    process.once(signal, () => {
      server.close(async () => {
        await repo.close();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    });
}

if (require.main === module)
  start().catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });

module.exports = { start };
