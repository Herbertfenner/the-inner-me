/*
====================================================
LifeOS Execution Engine v1
====================================================
Turns a Mission, Builder context, and House decision into
an editable first-draft plan so the Builder refines instead
of starting from an empty form.
*/

const ROUTE_PLANS = {
  recovery: {
    action: "Contact one recovery support and tell them honestly where you are today.",
    when: "Within the next 24 hours",
    support: "A sponsor, recovery coach, counselor, meeting leader, treatment program, or trusted safe person",
    barrier: "Shame, cravings, isolation, or telling yourself you should handle this alone",
    counter: "send the shortest honest message possible: ‘I need support today. Can you talk?’",
    returnQuestion: "Who did you contact, what happened, and what support is now in place?"
  },
  business: {
    action: "Identify one ideal customer and contact three real people for a short problem-discovery conversation.",
    when: "Before the end of this week",
    support: "A business mentor, accountability partner, coach, or trusted person who will verify the outreach happened",
    barrier: "Overthinking the offer, fear of rejection, or trying to perfect everything before speaking to customers",
    counter: "use one simple message and send it before editing it more than twice",
    returnQuestion: "How many people did you contact, what did they say, and what did you learn about the real problem?"
  },
  leadership: {
    action: "Name the decision only you can make and communicate the next clear expectation to the person affected.",
    when: "Within 48 hours",
    support: "A mentor, supervisor, board member, or accountability partner",
    barrier: "Avoiding discomfort, trying to please everyone, or delaying until the situation becomes urgent",
    counter: "write the decision in one sentence and schedule the conversation before doing more analysis",
    returnQuestion: "What decision did you communicate, how was it received, and what now requires follow-through?"
  },
  relationship: {
    action: "Write the honest sentence, decide whether it is a boundary, request, apology, or repair, and schedule the conversation.",
    when: "Within the next seven days",
    support: "A counselor, pastor, mentor, or trusted person who supports healthy communication without taking control",
    barrier: "Fear of conflict, anger, people-pleasing, or rehearsing the conversation without having it",
    counter: "pause, read the honest sentence once, and speak from the need instead of the accusation",
    returnQuestion: "Did the conversation happen, what did you say, and what boundary or repair became clearer?"
  },
  identity: {
    action: "Write the old label, list two pieces of evidence that it is incomplete, and finish: ‘I am becoming someone who…’",
    when: "Today before bed",
    support: "A coach, mentor, counselor, pastor, or trusted person who knows your growth",
    barrier: "Shame, negative self-talk, or dismissing evidence of progress",
    counter: "read the evidence out loud before repeating the old label",
    returnQuestion: "What old label lost some power, and what new identity statement feels most truthful?"
  },
  purpose: {
    action: "Describe the life you are fighting for, name who benefits from your growth, and choose one action that matches that future.",
    when: "Within the next three days",
    support: "A coach, mentor, pastor, family member, or trusted person connected to your calling",
    barrier: "Feeling overwhelmed by the whole vision or waiting for perfect certainty",
    counter: "choose the smallest action that still points in the direction of the life you described",
    returnQuestion: "What future did you name, and what action proved you are already moving toward it?"
  },
  grief: {
    action: "Write one memory you do not want to lose and share what you miss most with one safe person.",
    when: "When you have a supported, unhurried moment this week",
    support: "A grief counselor, pastor, family member, support group, or trusted friend",
    barrier: "Avoiding the pain, feeling pressure to be strong, or believing grief should already be over",
    counter: "give yourself ten minutes to remember without trying to solve the grief",
    returnQuestion: "What memory did you preserve, and what changed when you let someone witness the loss?"
  },
  stabilization: {
    action: "Name the heaviest part of today, contact one safe person, and complete one basic act of care.",
    when: "Within the next two hours",
    support: "A trusted person, counselor, doctor, pastor, peer support, or care team",
    barrier: "Overwhelm, isolation, exhaustion, or believing basic care does not matter",
    counter: "do only the next safest step and let another person know what you are doing",
    returnQuestion: "What helped lower the pressure, and who now knows you need support?"
  },
  safety: {
    action: "Contact or get physically near a safe person now and use crisis or emergency support if danger is immediate.",
    when: "Now",
    support: "A trusted person, 988 in the U.S., local crisis service, emergency department, or emergency services",
    barrier: "Isolation, lack of trust, access to means, or believing you must solve this alone",
    counter: "move toward another person and away from anything you could use to hurt yourself",
    returnQuestion: "Are you with a safe person or connected to immediate human support now?"
  },
  action: {
    action: "Complete the smallest meaningful step connected to the active mission.",
    when: "Within the next 24 hours",
    support: "One accountable person who can check whether the step happened",
    barrier: "Overthinking, distraction, fear, or waiting for motivation",
    counter: "work for ten minutes before deciding whether to stop",
    returnQuestion: "What happened when you attempted the step—completed, attempted, changed, or not yet?"
  }
};

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function firstOpenTask(mission) {
  return mission?.tasks?.find(task => !task.done)?.text || "";
}

export class ExecutionEngine {
  draft({ decision = {}, mission = {}, brain = {}, profile = {}, message = "" } = {}) {
    const route = decision.route || mission.route || "action";
    const base = ROUTE_PLANS[route] || ROUTE_PLANS.action;
    const recurring = Array.isArray(brain?.patterns)
      ? brain.patterns.find(pattern => Number(pattern?.count) >= 2)
      : null;
    const activeCommitment = Array.isArray(brain?.commitments)
      ? brain.commitments.find(item => item.status === "active")
      : null;
    const missionTask = firstOpenTask(mission);

    return {
      route,
      missionId: mission?.id || null,
      missionTitle: mission?.title || "One Grounded Next Step",
      action: clean(missionTask || base.action),
      when: base.when,
      support: base.support,
      barrier: recurring?.value ? `The recurring pattern LifeOS noticed: ${clean(recurring.value)}` : base.barrier,
      counter: activeCommitment?.value
        ? `return to your active commitment—${clean(activeCommitment.value)}—and ${base.counter}`
        : base.counter,
      returnQuestion: base.returnQuestion,
      source: clean(message),
      confidence: missionTask ? "high" : "recommended",
      editable: true,
      profileSignals: {
        goals: Array.isArray(profile?.goals) ? profile.goals.slice(-2) : [],
        projects: Array.isArray(profile?.projects) ? profile.projects.slice(-2) : []
      }
    };
  }
}

export const Execution = new ExecutionEngine();
