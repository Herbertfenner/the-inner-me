/*
====================================================
LifeOS Reflection Engine v1
====================================================
Gives the House permission to pause, reflect, teach, challenge,
or ask—rather than forcing every turn into another question.
*/

const STRONG_SHIFT = /\b(i want to live|i believe i can|i am ready|i need help|i can call|i will call|i want recovery|i want treatment|i am becoming|i finally realize|i understand now)\b/i;
const HEAVY_DISCLOSURE = /\b(addiction|depressed|depression|grief|trauma|abuse|overwhelmed|ashamed|hopeless|alone|treatment|sponsor|craving|urge to use)\b/i;

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function recentUserTurns(conversation = []) {
  return conversation.filter(turn => turn?.role === "user").slice(-4).map(turn => clean(turn.content)).filter(Boolean);
}

function strongestLine(lines = []) {
  return [...lines].reverse().find(line => STRONG_SHIFT.test(line)) || lines.at(-1) || "";
}

export class ReflectionEngine {
  decide({ message = "", decision = {}, brain = {}, specialist = {}, depth = 0, conversation = [] } = {}) {
    const text = clean(message);
    const turns = recentUserTurns(conversation);
    const route = decision.route || "action";

    if (route === "safety") {
      return {
        mode: "ask",
        allowQuestion: true,
        label: "Safety first",
        prompt: "Stay direct. Confirm present safety and connect the Builder to immediate human support.",
        houseVoice: null
      };
    }

    const recurring = Array.isArray(brain?.patterns)
      ? brain.patterns.find(pattern => Number(pattern?.count) >= 2)
      : null;
    const shift = STRONG_SHIFT.test(text) || turns.some(line => STRONG_SHIFT.test(line));
    const heavy = HEAVY_DISCLOSURE.test(text);

    if (depth >= 3 && shift) {
      const line = strongestLine(turns.length ? turns : [text]);
      return {
        mode: "house_reflection",
        allowQuestion: false,
        label: "The House notices",
        prompt: "Do not ask another question yet. Reflect the movement in the Builder's own words and give the moment room to breathe.",
        houseVoice: line
          ? `You entered carrying one thing, but something shifted when you said: “${line}” This moment deserves to be noticed before it is turned into another task.`
          : "Something changed in the way you are speaking. Pause long enough to notice it before moving on."
      };
    }

    if (depth >= 2 && recurring) {
      return {
        mode: "pattern_reflection",
        allowQuestion: false,
        label: "Pattern reflection",
        prompt: "Pause the questioning. Name the recurring pattern compassionately and invite one quiet minute of observation.",
        houseVoice: `This theme has returned ${recurring.count} times. The House is not calling that failure; it is calling it a pattern worth seeing clearly.`
      };
    }

    if (depth >= 2 && heavy) {
      return {
        mode: "pause",
        allowQuestion: false,
        label: "A moment to breathe",
        prompt: "Offer a brief grounding reflection. Do not add a follow-up question on this turn.",
        houseVoice: "You do not have to answer another question immediately. Read what you just said once more, breathe, and notice what it took to say it honestly."
      };
    }

    if (route === "leadership" || route === "business") {
      return {
        mode: "challenge",
        allowQuestion: true,
        label: "Grounded challenge",
        prompt: "Ask one precise question that exposes the real decision or marketplace test. Avoid generic encouragement.",
        houseVoice: null
      };
    }

    return {
      mode: "ask",
      allowQuestion: true,
      label: specialist?.label || "Coach Herb",
      prompt: "Continue with one focused, human question only if it genuinely advances understanding.",
      houseVoice: null
    };
  }
}

export const Reflection = new ReflectionEngine();
