/*
====================================================
LifeOS Conversation Engine v9
====================================================
*/

import { Builder } from "../house/builderProfile.js";
import { MemoryType } from "../memory/memoryClassifier.js";
import { CoachInsights } from "../coach/insightEngine.js";
import { BuilderBrain } from "../brain/builderBrain.js";
import { HouseDecision } from "./decisionEngine.js";
import { CoachMode } from "../coach/specialistModes.js";
import { Missions } from "../missions/missionEngine.js";
import { Execution } from "../execution/executionEngine.js";
import { Reflection } from "../reflection/reflectionEngine.js";
import { Growth } from "../growth/growthEngine.js";

export class ConversationEngine {
    process(message, options = {}) {
        const original = String(message ?? "");
        const clean = original.trim();
        const classification = MemoryType.classify(clean);

        if (classification.type !== "conversation") {
            Builder.apply(classification.type, classification.value);
        }

        const profile = Builder.getProfile();
        const brain = BuilderBrain.observe({ message: clean, classification, profile });
        const decision = HouseDecision.decide({
            message: clean,
            profile,
            brain,
            depth: options.depth,
            conversation: options.conversation
        });
        const specialist = CoachMode.select(decision, { profile, brain, classification });
        const mission = Missions.propose({
            decision,
            specialist,
            message: clean,
            learned: specialist.learned
        });
        const execution = Execution.draft({ decision, mission, brain, profile, message: clean });
        const reflection = Reflection.decide({
            message: clean,
            decision,
            brain,
            specialist,
            depth: Number(options.depth || 0),
            conversation: options.conversation || []
        });
        const growth = Growth.observe({ message: clean, decision, brain, mission });
        const insights = this.buildInsights(profile, brain, decision, specialist, mission, execution, reflection, growth);

        return {
            original,
            clean,
            classification,
            profile,
            brain,
            decision,
            specialist,
            mission,
            execution,
            reflection,
            growth,
            learned: specialist.learned,
            insights,
            status: clean ? "processed" : "empty",
            timestamp: new Date().toISOString()
        };
    }

    buildInsights(profile, brain, decision, specialist, mission, execution, reflection, growth) {
        const insights = CoachInsights.analyze(profile);
        const recurring = brain.patterns.find(pattern => pattern.count >= 2);
        const activeCommitments = brain.commitments.filter(item => item.status === "active");
        const rising = growth?.dimensions?.filter(item => item.trend > 0).sort((a,b)=>b.trend-a.trend)[0];

        if (rising) insights.unshift(`Growth signal rising: ${rising.label} (${rising.trend > 0 ? "+" : ""}${rising.trend}).`);
        if (reflection?.mode && reflection.mode !== "ask") insights.unshift(`Reflection mode selected: ${reflection.label}.`);
        if (execution?.action) insights.unshift(`Execution draft prepared: ${execution.action}`);
        if (mission?.title) insights.unshift(`Active mission: ${mission.title}.`);
        if (specialist?.label) insights.unshift(`${specialist.label} is active through ${decision.room}.`);
        if (decision?.route) insights.unshift(`The House selected the ${decision.route} path: ${decision.objective}`);
        if (recurring) insights.unshift(`This theme has appeared ${recurring.count} times: ${recurring.value}`);
        if (activeCommitments.length > 0) insights.push(`You currently have ${activeCommitments.length} active commitment${activeCommitments.length === 1 ? "" : "s"}.`);

        return [...new Set(insights)].slice(0, 10);
    }

    context(message, options = {}) {
        const result = this.process(message, options);
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
            decision: result.decision,
            specialist: result.specialist,
            mission: result.mission,
            execution: result.execution,
            reflection: result.reflection,
            growth: result.growth,
            learned: result.learned,
            insights: result.insights
        };
    }

    getBrain(profile = Builder.getProfile()) { return BuilderBrain.snapshot(profile); }
    getGrowth() { return Growth.snapshot(); }
}

export const Conversation = new ConversationEngine();
