import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// react-style-singleton/get-nonce (Radix scroll locking) supports this standard
// runtime nonce hook. Set it before mounting any component, never from user data.
const nonce = document.querySelector<HTMLMetaElement>(
  'meta[property="csp-nonce"]',
)?.nonce;
if (nonce && /^[A-Za-z0-9+/]{32}$/.test(nonce))
  Object.assign(globalThis, { __webpack_nonce__: nonce });

createRoot(document.getElementById("root")!).render(<App />);
