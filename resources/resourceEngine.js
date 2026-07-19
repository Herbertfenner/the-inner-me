/*
====================================================
LifeOS Resource Engine v1
====================================================
Selects practical tools from the Builder's current
House route, mission, specialist, and recent memory.
*/

import { HouseMemory } from "../memory/memory.js";
import { Missions } from "../missions/missionEngine.js";

const LIBRARY = {
  safety: [
    { title: "Immediate Safety Connection", type: "Safety", minutes: 3, purpose: "Move from isolation toward real-time human support.", steps: ["Get physically near a safe person or public place.", "Call or text 988 in the U.S., or contact local emergency services if danger is immediate.", "Move away from anything you could use to hurt yourself."] }
  ],
  stabilization: [
    { title: "Steady the Next Ten Minutes", type: "Grounding", minutes: 10, purpose: "Reduce the pressure before making a major decision.", steps: ["Put both feet on the floor and name five things you can see.", "Drink water and slow your breathing without forcing it.", "Text one safe person: ‘I need company, not solutions.’"] }
  ],
  recovery: [
    { title: "Recovery Support Map", type: "Worksheet", minutes: 12, purpose: "Identify the people and places that protect recovery.", steps: ["Name one person you can contact before using.", "Name one meeting, program, counselor, sponsor, or recovery coach available to you.", "Write the exact sentence you will use when asking for help."] },
    { title: "Trigger → Choice Map", type: "Exercise", minutes: 15, purpose: "Catch the decision point before the old pattern takes over.", steps: ["Name the trigger.", "Name what happens in your body and thoughts.", "Choose one interruption you can use before acting."] }
  ],
  grief: [
    { title: "What Grief Is Carrying", type: "Reflection", minutes: 12, purpose: "Separate the loss from the meaning attached to it.", steps: ["Name what was lost.", "Name what changed because of the loss.", "Name one memory, value, or relationship you want to preserve."] }
  ],
  relationships: [
    { title: "The Honest Sentence", type: "Conversation Tool", minutes: 8, purpose: "Turn confusion into a clear need, boundary, repair, or support request.", steps: ["When this happens, I feel…", "What I need is…", "What I am asking for is…"] }
  ],
  identity: [
    { title: "Identity Evidence", type: "Worksheet", minutes: 10, purpose: "Challenge a limiting identity with lived evidence.", steps: ["Write the belief you have been carrying.", "List three moments that do not fit that belief.", "Write the truer identity statement you are practicing now."] }
  ],
  purpose: [
    { title: "Purpose Thread", type: "Reflection", minutes: 15, purpose: "Connect pain, gifts, people, and contribution.", steps: ["What problem keeps pulling at your attention?", "Who do you feel responsible to help?", "What strength or experience could become service?"] }
  ],
  leadership: [
    { title: "Leadership Reality Check", type: "Assessment", minutes: 12, purpose: "Move from title-based leadership to responsibility and influence.", steps: ["Who is affected by your current choices?", "What standard are you modeling?", "What conversation or decision are you avoiding?"] }
  ],
  business: [
    { title: "One Real Customer", type: "Business Sprint", minutes: 20, purpose: "Replace broad planning with one real customer conversation.", steps: ["Name one person with the problem you solve.", "Write one question that helps you understand the problem.", "Contact that person before improving the offer again."] },
    { title: "Offer Clarity Card", type: "Business Tool", minutes: 15, purpose: "Make the offer easier to understand and buy.", steps: ["I help…", "Who struggle with…", "Get this result…", "Through this simple offer…"] }
  ],
  action: [
    { title: "Next Honest Step", type: "Execution Tool", minutes: 8, purpose: "Convert clarity into a move small enough to complete.", steps: ["Choose one action.", "Choose a real time.", "Choose one person who will know whether you did it."] }
  ]
};

function latestContext() {
  const memories = HouseMemory.all();
  const latest = memories[memories.length - 1] || null;
  const route = latest?.decision?.route || latest?.mission?.route || "action";
  const missions = Missions.all ? Missions.all() : [];
  const activeMission = missions.find(item => item.status !== "completed" && item.route === route) || missions.find(item => item.status !== "completed") || null;
  return { latest, route, activeMission };
}

export class ResourceEngine {
  snapshot() {
    const context = latestContext();
    const resources = LIBRARY[context.route] || LIBRARY.action;
    return {
      route: context.route,
      room: context.latest?.decision?.room || context.latest?.room || "The House",
      specialist: context.latest?.specialist?.label || "Coach Herb",
      mission: context.activeMission,
      recommended: resources[0],
      resources,
      librarySize: Object.values(LIBRARY).flat().length
    };
  }

  forRoute(route) {
    return LIBRARY[route] || LIBRARY.action;
  }
}

export const Resources = new ResourceEngine();
