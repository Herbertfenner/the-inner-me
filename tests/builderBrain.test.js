import assert from "node:assert/strict";
import test from "node:test";
import { BuilderBrainEngine } from "../brain/builderBrain.js";

function memoryStorage() {
    const data = new Map();
    return {
        getItem: key => data.has(key) ? data.get(key) : null,
        setItem: (key, value) => data.set(key, String(value)),
        removeItem: key => data.delete(key)
    };
}

test("Builder Brain records recurring patterns", () => {
    const brain = new BuilderBrainEngine("test-patterns", memoryStorage());
    const classification = { type: "challenges", value: "procrastination" };

    brain.observe({ message: "Procrastination keeps getting in my way.", classification });
    const snapshot = brain.observe({ message: "I am dealing with procrastination again.", classification });

    assert.equal(snapshot.patterns[0].type, "challenges");
    assert.equal(snapshot.patterns[0].count, 2);
    assert.equal(snapshot.signals.recurringPatterns, 1);
});

test("Builder Brain detects commitments, victories, and lessons", () => {
    const brain = new BuilderBrainEngine("test-events", memoryStorage());

    brain.observe({
        message: "I will call my mentor tomorrow.",
        classification: { type: "conversation", value: "" }
    });
    brain.observe({
        message: "I did it and completed the call.",
        classification: { type: "conversation", value: "" }
    });
    const snapshot = brain.observe({
        message: "I learned that asking for support makes me stronger.",
        classification: { type: "strengths", value: "asking for support" }
    });

    assert.equal(snapshot.commitments.length, 1);
    assert.equal(snapshot.victories.length, 1);
    assert.equal(snapshot.lessons.length, 1);
    assert.ok(snapshot.timeline.length >= 4);
});

test("Builder Brain persists between instances", () => {
    const storage = memoryStorage();
    const first = new BuilderBrainEngine("test-persistence", storage);

    first.observe({
        message: "My goal is to finish the program.",
        classification: { type: "goals", value: "finish the program" }
    });

    const second = new BuilderBrainEngine("test-persistence", storage);
    const snapshot = second.snapshot({ goals: ["finish the program"] });

    assert.equal(snapshot.signals.conversationsObserved, 1);
    assert.equal(snapshot.patterns[0].value, "finish the program");
    assert.equal(snapshot.signals.activeGoals, 1);
});
