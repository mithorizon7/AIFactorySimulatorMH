import { createHash, randomBytes } from 'node:crypto';
import type { Express, Request, Response } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

export function configureSecurity(app: Express) {
  app.disable('x-powered-by');
  app.set('query parser', 'simple');
  const configuredHosts = [process.env.PUBLIC_HOSTS, process.env.REPLIT_DOMAINS, ...(process.env.NODE_ENV !== 'production' ? [process.env.DEV_ALLOWED_HOSTS] : [])]
    .flatMap(value => value?.split(',') ?? []).map(value => value.trim().toLowerCase()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' && configuredHosts.length === 0) {
    throw new Error('Set PUBLIC_HOSTS to the exact production hostname(s).');
  }
  const hosts = new Set(['localhost', '127.0.0.1', '[::1]', ...configuredHosts]);
  // Only trust proxy networks explicitly supplied by the hosting operator.
  app.set('trust proxy', process.env.TRUSTED_PROXIES?.split(',').map(value => value.trim()).filter(Boolean) || false);
  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
    });
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'");
    }
    next();
  });
  app.use((req, res, next) => {
    try {
      const host = req.get('Host');
      if (!host) throw new Error('missing host');
      const parsed = new URL(`http://${host}`);
      if (parsed.host !== host.toLowerCase() || !hosts.has(parsed.hostname.toLowerCase())) throw new Error('invalid host');
    } catch {
      return res.status(403).json({ success: false, message: 'Host not allowed.' });
    }
    next();
  });
  app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    // Browsers send this on cross-site forms/fetches even if Origin is omitted.
    if (req.get('Sec-Fetch-Site') === 'cross-site') return res.status(403).json({ success: false, message: 'Cross-site request rejected.' });
    const origin = req.get('Origin');
    if (origin) {
      try {
        const scheme = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
        if (new URL(origin).origin !== `${scheme}://${req.get('Host')}`) throw new Error('origin mismatch');
      } catch {
        return res.status(403).json({ success: false, message: 'Cross-site request rejected.' });
      }
    }
    if (!req.is('application/json')) return res.status(415).json({ success: false, message: 'Use application/json.' });
    next();
  });
}

export const leaderboardWriteLimit = () => rateLimit({
  windowMs: 60_000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false,
  // Cloud ingress may share one source IP across a whole classroom.
  keyGenerator: req => {
    const token = ownerToken(req);
    return token ? createHash('sha256').update(token).digest('hex')
      : ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? 'unknown');
  },
});

function ownerToken(req: Request): string | undefined {
  const name = process.env.NODE_ENV === 'production' ? '__Host-ai-factory-save' : 'ai-factory-save';
  const token = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : undefined;
}

export function saveOwnerHash(req: Request, res: Response, create: boolean): string | undefined {
  const production = process.env.NODE_ENV === 'production';
  const name = production ? '__Host-ai-factory-save' : 'ai-factory-save';
  let token = ownerToken(req);
  if (!token) {
    if (!create) return undefined;
    token = randomBytes(32).toString('hex');
    res.cookie(name, token, { httpOnly: true, secure: production, sameSite: 'strict', path: '/', maxAge: 30 * 24 * 60 * 60 * 1000 });
  }
  return createHash('sha256').update(token).digest('hex');
}
