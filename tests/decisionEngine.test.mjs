import assert from "node:assert/strict";
import { DecisionEngine } from "../engine/decisionEngine.js";

const engine = new DecisionEngine();

const safety = engine.decide({ message: "I want to end my life" });
assert.equal(safety.route, "safety");
assert.equal(safety.allowActionPlan, false);

const recovery = engine.decide({ message: "I have been dealing with addiction for four years and I want recovery" });
assert.equal(recovery.route, "recovery");
assert.equal(recovery.allowActionPlan, true);

const stabilization = engine.decide({ message: "I feel depressed and overwhelmed" });
assert.equal(stabilization.route, "stabilization");
assert.equal(stabilization.allowActionPlan, false);

const purpose = engine.decide({ message: "I want to make something of my life and build a legacy" });
assert.equal(purpose.route, "purpose");

const relationship = engine.decide({ message: "I do not trust my partner after the betrayal" });
assert.equal(relationship.route, "relationship");

const business = engine.decide({ message: "My business launch has no customers or revenue" });
assert.equal(business.route, "business");

const action = engine.decide({
  message: "I am ready to take the next step",
  depth: 4,
  profile: { goals: ["Finish the project"], projects: [] },
  brain: { patterns: [] }
});
assert.equal(action.route, "action");
assert.equal(action.allowActionPlan, true);

console.log("Decision Engine routing tests passed.");
