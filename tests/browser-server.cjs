const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Repository } = require('../server/data/repository');
const { createApp } = require('../server/app');
(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jagtap-browser-'));
  const repo = new Repository({ mode: 'json', file: path.join(dir, 'db.json') });
  await repo.initialize();
  const server = createApp(repo, {
    secure: false,
    setupToken: 'test-browser-setup-code-2026-only',
    uploadsDir: path.join(dir, 'uploads'),
  }).listen(5201, '127.0.0.1');
  const cleanup = () =>
    server.close(async () => {
      await repo.close();
      const resolved = path.resolve(dir);
      if (
        resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) &&
        path.basename(resolved).startsWith('jagtap-browser-')
      )
        await fs.rm(resolved, { recursive: true, force: true });
      process.exit(0);
    });
  process.once('SIGTERM', cleanup);
  process.once('SIGINT', cleanup);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
