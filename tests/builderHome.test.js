import assert from 'node:assert/strict';

const store = new Map();
global.localStorage = {
  getItem: key => store.has(key) ? store.get(key) : null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: key => store.delete(key),
  clear: () => store.clear()
};

const { BuilderHome } = await import('../home/builderHome.js');
const { Missions } = await import('../missions/missionEngine.js');
const { HouseMemory } = await import('../memory/memory.js');

localStorage.clear();

const empty = BuilderHome.snapshot();
assert.equal(empty.activeMissions.length, 0);
assert.match(empty.returnQuestion, /true for you today/i);

const mission = Missions.propose({
  decision: { route: 'business', room: 'The Marketplace' },
  specialist: { label: 'Business Coach Herb' },
  message: 'I need my first customer.',
  learned: ['The Builder has named an active business goal.']
});

HouseMemory.remember({
  type: 'session',
  room: 'The Marketplace',
  choice: 'Talk to one real customer.',
  action: 'Send one invitation.',
  specialist: { label: 'Business Coach Herb' },
  decision: { room: 'The Marketplace', route: 'business' },
  learned: ['The Builder wants a real customer, not more planning.']
});

const home = BuilderHome.snapshot();
assert.equal(home.primaryMission.id, mission.id);
assert.equal(home.room, 'The Marketplace');
assert.equal(home.specialist, 'Business Coach Herb');
assert.match(home.recommendedAction, /person|problem|contact/i);
assert.ok(home.returnQuestion.length > 10);
assert.equal(home.recentLearned.length, 1);

Missions.toggleTask(mission.id, '1');
const progressed = BuilderHome.snapshot();
assert.equal(progressed.progress.done, 1);
assert.equal(progressed.progress.total, 3);

console.log('Builder Home tests passed');
