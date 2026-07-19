/*
====================================================
LifeOS Builder Home v1
====================================================
Creates a return experience from Builder Brain,
House Memory, Missions, and the latest specialist route.
*/

import { BuilderBrain } from "../brain/builderBrain.js";
import { Missions } from "../missions/missionEngine.js";
import { HouseMemory } from "../memory/memory.js";
import { Builder } from "../house/builderProfile.js";

function newest(items = [], field = "createdAt") {
  return [...items].sort((a, b) => new Date(b?.[field] || b?.created || 0) - new Date(a?.[field] || a?.created || 0))[0] || null;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export class BuilderHomeEngine {
  snapshot() {
    const profile = Builder.getProfile();
    const brain = BuilderBrain.snapshot(profile);
    const memories = HouseMemory.all();
    const missions = Missions.all();
    const activeMissions = missions.filter(item => item.status === "active");
    const primaryMission = newest(activeMissions, "updatedAt") || newest(activeMissions, "createdAt");
    const latestMemory = newest(memories, "created");
    const latestTimeline = newest(brain.timeline || [], "createdAt");
    const recentLearned = Array.isArray(latestMemory?.learned) ? latestMemory.learned.slice(0, 4) : [];
    const progress = primaryMission ? Missions.progress(primaryMission) : { done: 0, total: 0, percent: 0 };
    const nextTask = primaryMission?.tasks?.find(task => !task.done) || null;

    return {
      greeting: greeting(),
      profile,
      brain,
      memories,
      missions,
      activeMissions,
      primaryMission,
      progress,
      nextTask,
      latestMemory,
      latestTimeline,
      recentLearned,
      room: latestMemory?.decision?.room || primaryMission?.room || "The House",
      specialist: latestMemory?.specialist?.label || primaryMission?.specialist || "Coach Herb",
      welcomeBack: this.buildWelcome({ latestMemory, primaryMission, profile }),
      returnQuestion: this.buildReturnQuestion({ latestMemory, primaryMission, nextTask }),
      recommendedAction: nextTask?.text || primaryMission?.objective || "Begin with what is true today."
    };
  }

  buildWelcome({ latestMemory, primaryMission, profile }) {
    const name = profile?.name ? `, ${profile.name}` : "";
    if (latestMemory && primaryMission) {
      return `${greeting()}${name}. LifeOS remembers what you were carrying and the mission now in front of you.`;
    }
    if (latestMemory) return `${greeting()}${name}. You do not have to start over. The House remembers where you left off.`;
    if (primaryMission) return `${greeting()}${name}. Your mission is still active, and your next step is waiting.`;
    return `${greeting()}${name}. Start with what is real, and the House will meet you there.`;
  }

  buildReturnQuestion({ latestMemory, primaryMission, nextTask }) {
    if (primaryMission?.returnNote) return "What has changed since your last check-in?";
    if (nextTask) return `What happened with this next step: ${nextTask.text}`;
    if (latestMemory?.choice) return `Last time you chose: “${latestMemory.choice}” What happened when you tried it?`;
    return "What is true for you today?";
  }
}

export const BuilderHome = new BuilderHomeEngine();
