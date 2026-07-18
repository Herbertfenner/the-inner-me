/*
====================================================
LifeOS Conversation Engine v2
====================================================
*/

import { Builder } from "../house/builderProfile.js";
import { MemoryType } from "../memory/memoryClassifier.js";
import { CoachInsights } from "../coach/insightEngine.js";

export class ConversationEngine {
    process(message) {
        const original = String(message ?? "");
        const clean = original.trim();
        const classification = MemoryType.classify(clean);

        if (classification.type !== "conversation") {
            Builder.apply(classification.type, classification.value);
        }

        const profile = Builder.getProfile();
        const insights = CoachInsights.analyze(profile);

        return {
            original,
            clean,
            classification,
            profile,
            insights,
            status: clean ? "processed" : "empty",
            timestamp: new Date().toISOString()
        };
    }

    context(message) {
        const result = this.process(message);
        return {
            classification: result.classification,
            profile: result.profile,
            insights: result.insights
        };
    }
}

export const Conversation = new ConversationEngine();
