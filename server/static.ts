import express, { type Express } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export function serveStatic(app: Express) {
  const distPath = fileURLToPath(new URL('./public', import.meta.url));
  if (!fs.existsSync(distPath)) throw new Error('Build the client before starting production.');
  app.use(express.static(distPath, { dotfiles: 'deny' }));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}
