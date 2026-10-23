import type { Response } from "express";

export const CSP_NONCE_PLACEHOLDER = "__AI_FACTORY_REQUEST_NONCE__";
export function renderNonceHtml(template: string, response: Response): string {
  const nonce: unknown = response.locals.cspNonce;
  if (typeof nonce !== "string" || !/^[A-Za-z0-9+/]{32}$/.test(nonce))
    throw new Error("Missing request-scoped CSP nonce");
  return template.replaceAll(CSP_NONCE_PLACEHOLDER, nonce);
}
