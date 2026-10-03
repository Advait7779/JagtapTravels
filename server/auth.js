const crypto = require('node:crypto');
const { promisify } = require('node:util');
const { rateLimit } = require('express-rate-limit');
const { HttpError, text } = require('./domain');
const { isAdministrator } = require('./access');
const safeEqual = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const COOKIE = 'jagtap_session';
const scrypt = promisify(crypto.scrypt);
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  active: user.active !== false,
});

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [algorithm, salt, encoded] = String(stored || '').split('$');
  if (algorithm !== 'scrypt' || !salt || !/^[a-f0-9]{128}$/i.test(encoded || '')) return false;
  const expected = Buffer.from(encoded, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

function validPassword(value, minimumLength = 12) {
  const password = text(value, 'Password', true, 128);
  if (password.length < minimumLength)
    throw new HttpError(400, `Password must contain at least ${minimumLength} characters.`);
  const normalized = password.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (['admin123', 'password123', 'jagtaptours', 'adminpassword'].includes(normalized))
    throw new HttpError(400, 'Choose a stronger password that is not a common or demo password.');
  return password;
}

function validEmail(value) {
  const email = text(value, 'Email', true, 255).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new HttpError(400, 'Enter a valid email address.');
  return email;
}

async function bootstrapAdminFromEnv(repo, env = process.env) {
  const supplied = [env.ADMIN_EMAIL, env.ADMIN_PASSWORD].some(
    (value) => String(value || '').trim().length > 0,
  );
  if (!supplied) return { created: false };

  const email = validEmail(env.ADMIN_EMAIL);
  const fullName = text(env.ADMIN_FULL_NAME || 'Administrator', 'Full name', true, 200);
  const passwordHash = await hashPassword(validPassword(env.ADMIN_PASSWORD));
  return repo.change((data) => {
    if (data.users.length) return { created: false };
    const user = {
      id: crypto.randomUUID(),
      email,
      fullName,
      role: 'Administrator',
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    data.users.push(user);
    return { created: true, user: publicUser(user) };
  });
}

function readCookie(req) {
  const raw = (req.headers.cookie || '')
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(COOKIE + '='));
  return raw ? decodeURIComponent(raw.slice(COOKIE.length + 1)) : '';
}

function authRoutes(
  app,
  repo,
  {
    secure = process.env.NODE_ENV === 'production',
    setupToken = process.env.SETUP_TOKEN,
    idleMs = Math.max(5, Number(process.env.SESSION_IDLE_MINUTES) || 10080) * 60000,
  } = {},
) {
  const cookieOptions = { httpOnly: true, secure, sameSite: 'strict', path: '/' };
  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: 'Too many sign-in attempts. Try again in 15 minutes.' },
  });
  const dummyPasswordHash = hashPassword(crypto.randomBytes(32).toString('hex'));
  const touchIntervalMs = Math.min(5 * 60000, Math.max(1000, idleMs / 2));

  const addSession = (data, user, rememberMe, req) => {
    const token = crypto.randomBytes(32).toString('hex');
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const duration = rememberMe ? 30 * 24 * 3600000 : 7 * 24 * 3600000;
    const now = Date.now();
    const ownSessions = data.sessions.filter((session) => session.userId === user.id);
    const removeIds = new Set(ownSessions.slice(0, Math.max(0, ownSessions.length - 9)).map((s) => s.id));
    data.sessions = data.sessions.filter((session) => !removeIds.has(session.id));
    const session = {
      id: crypto.randomUUID(),
      tokenHash: digest(token),
      userId: user.id,
      csrfToken,
      expiresAt: now + duration,
      createdAt: new Date(now).toISOString(),
      lastSeenAt: new Date(now).toISOString(),
      ip: String(req.ip || '').slice(0, 100),
      userAgent: String(req.get('user-agent') || '').slice(0, 500),
    };
    data.sessions.push(session);
    return { token, csrfToken, duration, session };
  };

  app.get(
    '/api/auth/status',
    wrap(async (req, res) => res.json({ setupRequired: !(await repo.read()).users.length })),
  );

  app.post(
    '/api/auth/setup',
    limiter,
    wrap(async (req, res) => {
      if ((await repo.read()).users.length)
        throw new HttpError(409, 'Administrator setup is already complete.');
      if (!setupToken || !safeEqual(req.body.setupToken || '', setupToken))
        throw new HttpError(403, 'The first-run setup code is incorrect.');
      const email = validEmail(req.body.email);
      const fullName = text(req.body.fullName, 'Full name', true, 200);
      const passwordHash = await hashPassword(validPassword(req.body.password));
      const result = await repo.change((data) => {
        if (data.users.length) throw new HttpError(409, 'Administrator setup is already complete.');
        const user = {
          id: crypto.randomUUID(),
          email,
          fullName,
          role: 'Administrator',
          passwordHash,
          createdAt: new Date().toISOString(),
        };
        data.users.push(user);
        return { user, session: addSession(data, user, false, req) };
      });
      req.auditActor = result.user;
      res.cookie(COOKIE, result.session.token, { ...cookieOptions, maxAge: result.session.duration });
      res.status(201).json({
        user: publicUser(result.user),
        csrfToken: result.session.csrfToken,
      });
    }),
  );

  app.post(
    '/api/auth/login',
    limiter,
    wrap(async (req, res) => {
      const email = validEmail(req.body.email);
      const password = text(req.body.password, 'Password', true, 128);
      const snapshot = await repo.read();
      const user = snapshot.users.find((candidate) => candidate.email?.toLowerCase() === email);
      const authenticated = await verifyPassword(password, user?.passwordHash || (await dummyPasswordHash));
      if (!user || !authenticated || user.active === false)
        throw new HttpError(401, 'Invalid email or password.');
      req.auditActor = user;
      const result = await repo.change((data) => {
        const current = data.users.find((candidate) => candidate.id === user.id);
        if (!current) throw new HttpError(401, 'Invalid email or password.');
        return { user: current, session: addSession(data, current, req.body.rememberMe === true, req) };
      });
      res.cookie(COOKIE, result.session.token, { ...cookieOptions, maxAge: result.session.duration });
      res.json({ user: publicUser(result.user), csrfToken: result.session.csrfToken });
    }),
  );

  app.use(
    '/api',
    wrap(async (req, res, next) => {
      if (req.path === '/public/inquiries' || req.path.startsWith('/public/')) return next();
      const token = readCookie(req);
      const tokenHash = token && digest(token);
      const data = await repo.read();
      const session = tokenHash && data.sessions.find((candidate) => candidate.tokenHash === tokenHash);
      const lastSeen = Date.parse(session?.lastSeenAt || session?.createdAt || 0);
      const expired =
        !session || session.expiresAt <= Date.now() || !lastSeen || Date.now() - lastSeen > idleMs;
      const user = !expired && data.users.find(
        (candidate) => candidate.id === session.userId && candidate.active !== false,
      );
      if (!user) {
        if (session)
          await repo.change((state) => {
            state.sessions = state.sessions.filter((candidate) => candidate.id !== session.id);
          });
        res.clearCookie(COOKIE, cookieOptions);
        throw new HttpError(401, 'Please sign in.');
      }
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const supplied = req.get('X-CSRF-Token') || '';
        if (!supplied || !safeEqual(supplied, session.csrfToken))
          throw new HttpError(403, 'Security token is missing or expired. Refresh and retry.');
      }
      if (Date.now() - lastSeen > touchIntervalMs) {
        const seenAt = new Date().toISOString();
        await repo.change((state) => {
          const stored = state.sessions.find((candidate) => candidate.id === session.id);
          if (stored) stored.lastSeenAt = seenAt;
        });
        session.lastSeenAt = seenAt;
      }
      req.user = user;
      req.session = session;
      next();
    }),
  );

  app.get('/api/auth/me', (req, res) =>
    res.json({ user: publicUser(req.user), csrfToken: req.session.csrfToken }),
  );

  const requireAdministrator = (req, res, next) => {
    if (!isAdministrator(req.user)) return next(new HttpError(403, 'Administrator access required.'));
    next();
  };

  app.get('/api/users', requireAdministrator, wrap(async (req, res) => {
    res.json((await repo.read()).users.map(publicUser));
  }));

  app.post('/api/users', requireAdministrator, wrap(async (req, res) => {
    const email = validEmail(req.body.email);
    const fullName = text(req.body.fullName, 'Full name', true, 200);
    const passwordHash = await hashPassword(validPassword(req.body.password, 6));
    const created = await repo.change((data) => {
      if (data.users.some((user) => user.email?.toLowerCase() === email))
        throw new HttpError(409, 'An account with this email already exists.');
      const user = {
        id: crypto.randomUUID(), email, fullName, role: 'Staff', active: true,
        passwordHash, createdAt: new Date().toISOString(),
      };
      data.users.push(user);
      return publicUser(user);
    });
    res.status(201).json(created);
  }));

  app.put('/api/users/:id', requireAdministrator, wrap(async (req, res) => {
    const email = validEmail(req.body.email);
    const fullName = text(req.body.fullName, 'Full name', true, 200);
    if (Object.hasOwn(req.body, 'password'))
      throw new HttpError(400, 'Password changes are not available.');
    if (req.body.active !== undefined && typeof req.body.active !== 'boolean')
      throw new HttpError(400, 'Active must be true or false.');
    const updated = await repo.change((data) => {
      const user = data.users.find((candidate) => candidate.id === req.params.id);
      if (!user) throw new HttpError(404, 'User not found.');
      if (isAdministrator(user)) throw new HttpError(403, 'Administrator accounts cannot be changed here.');
      if (data.users.some((candidate) => candidate.id !== user.id && candidate.email?.toLowerCase() === email))
        throw new HttpError(409, 'An account with this email already exists.');
      user.email = email;
      user.fullName = fullName;
      if (req.body.active !== undefined) user.active = req.body.active;
      if (user.active === false)
        data.sessions = data.sessions.filter((session) => session.userId !== user.id);
      return publicUser(user);
    });
    res.json(updated);
  }));

  app.delete('/api/users/:id', requireAdministrator, wrap(async (req, res) => {
    await repo.change((data) => {
      const user = data.users.find((candidate) => candidate.id === req.params.id);
      if (!user) throw new HttpError(404, 'User not found.');
      if (isAdministrator(user)) throw new HttpError(403, 'Administrator accounts cannot be removed here.');
      data.users = data.users.filter((candidate) => candidate.id !== user.id);
      data.sessions = data.sessions.filter((session) => session.userId !== user.id);
    });
    res.json({ success: true });
  }));

  app.get(
    '/api/auth/sessions',
    wrap(async (req, res) => {
      const sessions = (await repo.read()).sessions
        .filter((session) => session.userId === req.user.id)
        .map(({ id, createdAt, lastSeenAt, expiresAt, ip, userAgent }) => ({
          id,
          createdAt,
          lastSeenAt,
          expiresAt,
          ip,
          userAgent,
          current: id === req.session.id,
        }))
        .sort((a, b) => Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt));
      res.json(sessions);
    }),
  );

  app.delete(
    '/api/auth/sessions/:id',
    wrap(async (req, res) => {
      let removed = false;
      await repo.change((data) => {
        const before = data.sessions.length;
        data.sessions = data.sessions.filter(
          (session) => !(session.id === req.params.id && session.userId === req.user.id),
        );
        removed = data.sessions.length !== before;
      });
      if (!removed) throw new HttpError(404, 'Session not found.');
      if (req.params.id === req.session.id) res.clearCookie(COOKIE, cookieOptions);
      res.json({ success: true, signedOut: req.params.id === req.session.id });
    }),
  );

  app.post(
    '/api/auth/logout-all',
    wrap(async (req, res) => {
      await repo.change((data) => {
        data.sessions = data.sessions.filter((session) => session.userId !== req.user.id);
      });
      res.clearCookie(COOKIE, cookieOptions);
      res.json({ success: true, signedOut: true });
    }),
  );

  app.get(
    '/api/security/audit-logs',
    requireAdministrator,
    wrap(async (req, res) => {
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
      res.json((await repo.read()).auditLogs.slice(-limit).reverse());
    }),
  );

  app.post(
    '/api/auth/logout',
    wrap(async (req, res) => {
      await repo.change((data) => {
        data.sessions = data.sessions.filter((session) => session.id !== req.session.id);
      });
      res.clearCookie(COOKIE, cookieOptions);
      res.json({ success: true });
    }),
  );
}

module.exports = { authRoutes, bootstrapAdminFromEnv, hashPassword, verifyPassword };
