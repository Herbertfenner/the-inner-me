/*
====================================================
LifeOS Return Engine v1
====================================================
Builds a grounded return brief from House Memory,
Builder Brain, and active Missions so the Builder
never has to start over.
*/

import { HouseMemory } from "../memory/memory.js";
import { BuilderBrain } from "../brain/builderBrain.js";
import { Builder } from "../house/builderProfile.js";
import { Missions } from "../missions/missionEngine.js";

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function latestMeaningfulMemory() {
  return HouseMemory.latest(20).find(item =>
    item?.returnQuestion || item?.action || item?.mission?.title || item?.truth
  ) || null;
}

function activeMission() {
  const list = typeof Missions.all === "function" ? Missions.all() : [];
  return [...list].reverse().find(item => item.status !== "completed") || null;
}

function missionProgress(mission) {
  const tasks = Array.isArray(mission?.tasks) ? mission.tasks : [];
  const done = tasks.filter(task => task.done).length;
  return {
    done,
    total: tasks.length,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    nextTask: tasks.find(task => !task.done)?.text || ""
  };
}

function strongestPattern(brain) {
  return [...(brain?.patterns || [])]
    .filter(item => Number(item?.count) >= 2)
    .sort((a, b) => Number(b.count) - Number(a.count))[0] || null;
}

export class ReturnEngine {
  snapshot() {
    const memory = latestMeaningfulMemory();
    const profile = Builder.getProfile();
    const brain = BuilderBrain.snapshot(profile);
    const mission = activeMission();
    const progress = missionProgress(mission);
    const pattern = strongestPattern(brain);

    const returnQuestion = clean(
      memory?.returnQuestion ||
      mission?.returnQuestion ||
      "What happened since the last time you were here—completed, attempted, changed, or not yet?"
    );

    const firstStep = clean(
      progress.nextTask ||
      memory?.action ||
      "Tell the truth about what happened next."
    );

    const room = clean(memory?.decision?.room || memory?.room || mission?.room || "The House");
    const specialist = clean(memory?.specialist?.label || mission?.specialist || "Coach Herb");
    const missionTitle = clean(mission?.title || memory?.mission?.title || "Your next honest step");

    return {
      hasHistory: Boolean(memory || mission || (brain?.timeline || []).length),
      room,
      specialist,
      mission,
      missionTitle,
      progress,
      memory,
      pattern,
      returnQuestion,
      firstStep,
      welcome: memory
        ? `You do not need to explain everything again. The House remembers that you were working through ${clean(memory.truth || missionTitle).toLowerCase()}.`
        : "You are not starting over. Start with what is true today.",
      continuity: [
        mission ? `Your active mission is ${missionTitle}.` : "No active mission is waiting.",
        progress.total ? `${progress.done} of ${progress.total} mission steps are complete.` : "Mission progress will begin after your next grounded step.",
        pattern ? `LifeOS has noticed a recurring theme: ${clean(pattern.value)}.` : "A recurring pattern has not been confirmed yet."
      ],
      prompt: returnQuestion,
      suggestedAnswer: firstStep
    };
  }
}

export const Return = new ReturnEngine();
