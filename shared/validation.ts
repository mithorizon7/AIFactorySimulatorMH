import { z } from "zod";

// Configure before any schema is created: even a caught JIT probe violates CSP.
z.config({ jitless: true });

export { z, ZodError } from "zod";
