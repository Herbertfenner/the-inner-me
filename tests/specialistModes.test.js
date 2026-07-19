import assert from "node:assert/strict";
import { CoachMode } from "../coach/specialistModes.js";

const recovery = CoachMode.select(
  { route: "recovery", mode: "recovery", room: "Recovery Room" },
  { brain: { patterns: [{ type: "challenges", count: 3 }] }, profile: {} }
);
assert.equal(recovery.label, "Recovery Coach Herb");
assert.match(recovery.stance, /recovery-oriented/i);
assert.ok(recovery.learned.some(item => /recurring/i.test(item)));

const business = CoachMode.select(
  { route: "business", mode: "business", room: "The Marketplace" },
  { brain: { patterns: [], commitments: [] }, profile: { projects: ["Launch R3"] } }
);
assert.equal(business.label, "Business Coach Herb");
assert.ok(business.learned.some(item => /project/i.test(item)));

const safety = CoachMode.select(
  { route: "safety", mode: "safety", room: "Safety Room" },
  { brain: { patterns: [], commitments: [] }, profile: {} }
);
assert.equal(safety.label, "Safety Coach Herb");
assert.match(safety.stance, /immediate human support/i);

console.log("Specialist mode tests passed");
