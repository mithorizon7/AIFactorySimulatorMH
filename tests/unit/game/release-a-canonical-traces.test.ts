import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import { canonicalJson } from "../../../client/src/lib/persistence/repository";
import { strategy, type Policy } from "./strategy-policies";

// Captured before any Release B mechanical edit, at shared-contract 63d347b.
// Every complete canonical tick state is covered, including IDs and RNG state.
const traces: Array<[number, Policy, string]> = [
  [
    1,
    "prerequisite-minimal",
    "684b60432c58021e058589cb8aa969cf5e9b901d22b98c109018af9caec565a1",
  ],
  [
    1,
    "revenue-first",
    "22ebaec3710c21faa207d0911aef85a3acb22a2cac023dbd3dd66b6b137eebca",
  ],
  [
    1,
    "capacity-first",
    "77a60355e23ba7b844e735c01ea95f626e4bbf5ae3fd199ed0e0f3e140733e4c",
  ],
  [
    42,
    "prerequisite-minimal",
    "dfe57e26fb43c872ecf464b6d9cb541ee10571f1bde96aca0857733d47156245",
  ],
  [
    42,
    "revenue-first",
    "eeca6d454b57b5e29efe95673d723d093d0d688777259ae2c50bf12699ed9358",
  ],
  [
    42,
    "capacity-first",
    "ed0d85d89bef33be766e84b742157a8f0d9ef787ed6398a7291b2859b7b06555",
  ],
  [
    4294967294,
    "prerequisite-minimal",
    "2d320ba1d4a1c9da434f297480b4959ce62150765f42bc16a3d6b4da4cdf3896",
  ],
  [
    4294967294,
    "revenue-first",
    "37968f865f851c0e69bde38a103743e5b2b2b256acbca6ce0b5f493dbcde68e1",
  ],
  [
    4294967294,
    "capacity-first",
    "79bf0e95918d36968be96f418a66764e99a27092a6056ffa5b6f9c1dc943a65d",
  ],
];

it.each(traces)(
  "preserves all canonical A tick states: seed %i %s",
  (seed, policy, digest) => {
    const agent = strategy(seed, policy);
    let state = agent.initial;
    const hash = createHash("sha256").update(canonicalJson(state));
    while (state.clock.status === "running" && state.clock.activeTick < 2000) {
      state = agent.step(state);
      hash.update(canonicalJson(state));
    }
    expect(state.clock.status).toBe("completed");
    expect(hash.digest("hex")).toBe(digest);
  },
);
