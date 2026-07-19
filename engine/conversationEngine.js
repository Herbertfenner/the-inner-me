/*
====================================================
LifeOS Conversation Engine v3
====================================================
*/

import { Builder } from "../house/builderProfile.js";
import { MemoryType } from "../memory/memoryClassifier.js";
import { CoachInsights } from "../coach/insightEngine.js";
import { BuilderBrain } from "../brain/builderBrain.js";

export class ConversationEngine {
    process(message) {
        const original = String(message ?? "");
        const clean = original.trim();
        const classification = MemoryType.classify(clean);

        if (classification.type !== "conversation") {
            Builder.apply(classification.type, classification.value);
        }

        const profile = Builder.getProfile();
        const brain = BuilderBrain.observe({
            message: clean,
            classification,
            profile
        });
        const insights = this.buildInsights(profile, brain);

        return {
            original,
            clean,
            classification,
            profile,
            brain,
            insights,
            status: clean ? "processed" : "empty",
            timestamp: new Date().toISOString()
        };
    }

    buildInsights(profile, brain) {
        const insights = CoachInsights.analyze(profile);
        const recurring = brain.patterns.find(pattern => pattern.count >= 2);
        const activeCommitments = brain.commitments.filter(item => item.status === "active");

        if (recurring) {
            insights.unshift(
                `This theme has appeared ${recurring.count} times: ${recurring.value}`
            );
        }

        if (activeCommitments.length > 0) {
            insights.push(
                `You currently have ${activeCommitments.length} active commitment${activeCommitments.length === 1 ? "" : "s"}.`
            );
        }

        return [...new Set(insights)].slice(0, 6);
    }

    context(message) {
        const result = this.process(message);
        return {
            classification: result.classification,
            profile: result.profile,
            brain: {
                patterns: result.brain.patterns,
                commitments: result.brain.commitments.slice(-5),
                victories: result.brain.victories.slice(-5),
                lessons: result.brain.lessons.slice(-5),
                recentTimeline: result.brain.timeline.slice(-8),
                signals: result.brain.signals
            },
            insights: result.insights
        };
    }

    getBrain(profile = Builder.getProfile()) {
        return BuilderBrain.snapshot(profile);
    }
}

export const Conversation = new ConversationEngine();
