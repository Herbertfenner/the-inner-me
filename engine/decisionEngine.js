/*
====================================================
LifeOS Decision Engine v1
====================================================
Chooses the safest and most useful next path from the
Builder's present words, history, profile, and Brain.
*/

const ROUTES = {
  safety: {
    room: "Safety Room",
    mode: "safety",
    objective: "Confirm immediate safety and connect the Builder to real human support.",
    allowActionPlan: false,
    priority: 100
  },
  stabilization: {
    room: "The Hearth",
    mode: "stabilization",
    objective: "Reduce overwhelm, restore steadiness, and identify immediate support.",
    allowActionPlan: false,
    priority: 90
  },
  recovery: {
    room: "Recovery Room",
    mode: "recovery",
    objective: "Clarify the recovery need, existing supports, and the next safe recovery step.",
    allowActionPlan: true,
    priority: 80
  },
  grief: {
    room: "The Hearth",
    mode: "grief",
    objective: "Make room for loss before asking the Builder to solve or perform.",
    allowActionPlan: false,
    priority: 70
  },
  relationship: {
    room: "The Bridge",
    mode: "relationship",
    objective: "Clarify the relational pattern, boundary, repair, or support need.",
    allowActionPlan: true,
    priority: 60
  },
  identity: {
    room: "The Mirror",
    mode: "identity",
    objective: "Separate the Builder's identity from shame, failure, fear, or old labels.",
    allowActionPlan: false,
    priority: 55
  },
  purpose: {
    room: "The Garden",
    mode: "purpose",
    objective: "Name the life, calling, or future the Builder is trying to grow toward.",
    allowActionPlan: true,
    priority: 50
  },
  leadership: {
    room: "The Forge",
    mode: "leadership",
    objective: "Clarify responsibility, influence, courage, and the next leadership decision.",
    allowActionPlan: true,
    priority: 45
  },
  business: {
    room: "The Marketplace",
    mode: "business",
    objective: "Clarify the business constraint, decision, customer, or execution priority.",
    allowActionPlan: true,
    priority: 40
  },
  action: {
    room: "The Forge",
    mode: "action",
    objective: "Turn sufficient clarity into one realistic next step with support and safeguards.",
    allowActionPlan: true,
    priority: 10
  }
};

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function includesAny(text, expressions) {
  return expressions.some(expression => expression.test(text));
}

export class DecisionEngine {
  decide({ message, profile = {}, brain = {}, depth = 1, conversation = [] } = {}) {
    const latest = clean(message);
    const history = Array.isArray(conversation)
      ? conversation.map(turn => clean(turn?.content)).filter(Boolean).slice(-12).join(" ")
      : "";
    const evidence = `${history} ${latest}`.toLowerCase();
    const signals = [];

    const immediateDanger = includesAny(evidence, [
      /\b(i am|i'm) going to (kill|hurt|harm) myself\b/,
      /\b(plan to|about to|ready to) (kill|hurt|harm|end)\b/,
      /\bending my life now\b/,
      /\boverdose now\b/,
      /\bhave (a )?(gun|weapon|pills|knife)\b/
    ]);

    const selfHarm = includesAny(evidence, [
      /\bsuicid/,
      /\bkill myself\b/,
      /\bend my life\b/,
      /\bwant to die\b/,
      /\bgive up (on )?living\b/,
      /\bhurt myself\b/,
      /\bharm myself\b/,
      /\bself[- ]harm\b/
    ]);

    if (immediateDanger || selfHarm) {
      signals.push(immediateDanger ? "immediate-danger-language" : "self-harm-language");
      return this.result("safety", {
        confidence: immediateDanger ? 1 : 0.96,
        signals,
        instruction: "Do not move to Choice or Action. Ask a direct present-tense safety question. Encourage immediate human support and emergency help when danger is present."
      });
    }

    if (includesAny(evidence, [
      /\baddict/,
      /\brelaps/,
      /\bcraving/,
      /\busing (drugs|alcohol|again)\b/,
      /\bsober|sobriety\b/,
      /\brecovery program\b/
    ])) {
      signals.push("recovery-language");
      return this.result("recovery", {
        confidence: 0.92,
        signals,
        instruction: "Stay recovery-oriented. Ask about current use, immediate safety, existing treatment or peer support, and the smallest safe next recovery step."
      });
    }

    if (includesAny(evidence, [
      /\bpanic|panicking\b/,
      /\boverwhelm/,
      /\bcan't cope\b/,
      /\bfalling apart\b/,
      /\bno sleep\b/,
      /\bdepress(ed|ion)\b/
    ])) {
      signals.push("stabilization-needed");
      return this.result("stabilization", {
        confidence: 0.84,
        signals,
        instruction: "Do not rush into a performance plan. Help the Builder slow down, name what is heaviest, and identify one available human support."
      });
    }

    if (includesAny(evidence, [/\bgrief|grieving|died|death|funeral|loss of|miss him|miss her\b/])) {
      signals.push("grief-language");
      return this.result("grief", { confidence: 0.88, signals });
    }

    if (includesAny(evidence, [/\bmarriage|husband|wife|partner|relationship|trust|betray|boundary|family conflict\b/])) {
      signals.push("relationship-language");
      return this.result("relationship", { confidence: 0.82, signals });
    }

    if (includesAny(evidence, [/\bwho am i|identity|worthless|failure|not enough|ashamed|hate myself\b/])) {
      signals.push("identity-language");
      return this.result("identity", { confidence: 0.84, signals });
    }

    if (includesAny(evidence, [/\bpurpose|calling|legacy|meaning|future|make something of my life|dream\b/])) {
      signals.push("purpose-language");
      return this.result("purpose", { confidence: 0.78, signals });
    }

    if (includesAny(evidence, [/\blead|leader|team|staff|influence|delegate|accountability\b/])) {
      signals.push("leadership-language");
      return this.result("leadership", { confidence: 0.78, signals });
    }

    if (includesAny(evidence, [/\bbusiness|customer|revenue|sales|launch|company|client|market\b/])) {
      signals.push("business-language");
      return this.result("business", { confidence: 0.78, signals });
    }

    const recurring = Array.isArray(brain?.patterns)
      ? brain.patterns.find(pattern => Number(pattern?.count) >= 2)
      : null;
    if (recurring) signals.push(`recurring:${clean(recurring.type)}`);

    const hasGoal = Array.isArray(profile?.goals) && profile.goals.length > 0;
    const hasProject = Array.isArray(profile?.projects) && profile.projects.length > 0;
    const enoughDepth = Number(depth) >= 3;

    return this.result("action", {
      confidence: enoughDepth || hasGoal || hasProject ? 0.76 : 0.58,
      signals,
      instruction: enoughDepth
        ? "Clarity may be sufficient. Offer one grounded choice, but do not force action if the Builder is still confused."
        : "Continue the conversation until the Builder can name what is happening, what it is costing, and what support or direction is needed."
    });
  }

  result(routeName, overrides = {}) {
    const route = ROUTES[routeName] || ROUTES.action;
    return {
      route: routeName,
      room: route.room,
      mode: route.mode,
      objective: route.objective,
      allowActionPlan: route.allowActionPlan,
      priority: route.priority,
      confidence: overrides.confidence ?? 0.5,
      signals: overrides.signals || [],
      instruction: overrides.instruction || route.objective
    };
  }
}

export const HouseDecision = new DecisionEngine();
