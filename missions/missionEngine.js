/*
====================================================
LifeOS Mission Engine v1
====================================================
Turns House decisions into persistent, returnable missions.
*/

const STORAGE_KEY = "lifeos.missions.v1";

const BLUEPRINTS = {
  safety: {
    title: "Immediate Safety Connection",
    objective: "Move from carrying this alone to real human support now.",
    cadence: "now",
    tasks: [
      "Contact or get physically near one safe person now.",
      "Call or text 988 in the U.S., or use your local crisis service.",
      "Move away from anything you could use to hurt yourself."
    ]
  },
  stabilization: {
    title: "Steady the Ground",
    objective: "Lower the pressure enough to think, breathe, and connect.",
    cadence: "today",
    tasks: [
      "Name the heaviest part of today in one sentence.",
      "Tell one safe person you need support, not advice.",
      "Choose one basic act of care: water, food, medication as prescribed, rest, or fresh air."
    ]
  },
  recovery: {
    title: "Recovery Foundation",
    objective: "Strengthen the support underneath the life you are rebuilding.",
    cadence: "today",
    tasks: [
      "Reach out to one recovery support: sponsor, meeting, coach, counselor, program, or safe person.",
      "Write down one trigger that has shown up this week.",
      "Name one reason you still want recovery and life."
    ]
  },
  grief: {
    title: "Make Room for the Loss",
    objective: "Honor what was lost without forcing yourself to move on quickly.",
    cadence: "this week",
    tasks: [
      "Write one memory you do not want to lose.",
      "Tell one safe person what you miss most.",
      "Choose one gentle ritual of remembrance or rest."
    ]
  },
  relationship: {
    title: "One Honest Relationship Step",
    objective: "Clarify the need, boundary, repair, or support request.",
    cadence: "this week",
    tasks: [
      "Write the honest sentence you need to say.",
      "Decide whether the next step is a boundary, request, apology, or conversation.",
      "Choose a safe time and place for the conversation."
    ]
  },
  identity: {
    title: "Separate Identity from the Struggle",
    objective: "Build a more truthful picture of who you are becoming.",
    cadence: "this week",
    tasks: [
      "Write the label you have been carrying.",
      "List two pieces of evidence that the label is not your whole identity.",
      "Write one sentence beginning: I am becoming someone who…"
    ]
  },
  purpose: {
    title: "Name the Life You Are Building",
    objective: "Turn hope and purpose into a direction you can return to.",
    cadence: "this week",
    tasks: [
      "Describe the life you are fighting for in five sentences.",
      "Name one person who would benefit from you becoming whole.",
      "Choose one action that matches that future."
    ]
  },
  leadership: {
    title: "The Leadership Decision",
    objective: "Move from vague pressure to one responsible leadership choice.",
    cadence: "this week",
    tasks: [
      "Name the decision only you can make.",
      "Identify who needs clarity from you.",
      "Set a deadline for communicating the decision."
    ]
  },
  business: {
    title: "One Real Customer",
    objective: "Replace broad business anxiety with one test in the marketplace.",
    cadence: "this week",
    tasks: [
      "Define the one person your offer helps most.",
      "Write the problem you solve in one clear sentence.",
      "Contact three real people and ask for a conversation, not a sale."
    ]
  },
  action: {
    title: "One Grounded Next Step",
    objective: "Turn clarity into one realistic action with support and a return point.",
    cadence: "today",
    tasks: [
      "Choose one action small enough to complete.",
      "Set the time you will do it.",
      "Tell one person who can support your follow-through."
    ]
  }
};

function now() {
  return new Date().toISOString();
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function id() {
  return `mission_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class MissionEngine {
  constructor(storageKey = STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  all() {
    try {
      const value = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  save(missions) {
    localStorage.setItem(this.storageKey, JSON.stringify(missions));
    return missions;
  }

  active() {
    return this.all().filter(mission => mission.status === "active");
  }

  propose({ decision = {}, specialist = {}, message = "", learned = [] } = {}) {
    const route = decision.route || "action";
    const blueprint = BLUEPRINTS[route] || BLUEPRINTS.action;
    const existing = this.active().find(mission => mission.route === route);

    if (existing) {
      existing.lastSeen = now();
      existing.context = clean(message) || existing.context;
      this.save(this.all().map(item => item.id === existing.id ? existing : item));
      return existing;
    }

    const mission = {
      id: id(),
      title: blueprint.title,
      objective: blueprint.objective,
      cadence: blueprint.cadence,
      route,
      room: decision.room || "The House",
      specialist: specialist.label || "Coach Herb",
      status: "active",
      context: clean(message),
      learned: Array.isArray(learned) ? learned.slice(0, 5) : [],
      tasks: blueprint.tasks.map((text, index) => ({ id: `${index + 1}`, text, done: false, completedAt: null })),
      createdAt: now(),
      updatedAt: now(),
      lastSeen: now(),
      returnNote: ""
    };

    this.save([...this.all(), mission]);
    return mission;
  }

  toggleTask(missionId, taskId) {
    const missions = this.all();
    const mission = missions.find(item => item.id === missionId);
    if (!mission) return null;
    const task = mission.tasks.find(item => item.id === String(taskId));
    if (!task) return mission;
    task.done = !task.done;
    task.completedAt = task.done ? now() : null;
    mission.updatedAt = now();
    if (mission.tasks.every(item => item.done)) mission.status = "completed";
    this.save(missions);
    return mission;
  }

  addReturnNote(missionId, note) {
    const missions = this.all();
    const mission = missions.find(item => item.id === missionId);
    if (!mission) return null;
    mission.returnNote = clean(note);
    mission.updatedAt = now();
    this.save(missions);
    return mission;
  }

  progress(mission) {
    const total = mission?.tasks?.length || 0;
    const done = mission?.tasks?.filter(task => task.done).length || 0;
    return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
  }

  clear() {
    localStorage.removeItem(this.storageKey);
  }
}

export const Missions = new MissionEngine();
