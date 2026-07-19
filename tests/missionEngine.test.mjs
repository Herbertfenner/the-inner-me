import assert from 'node:assert/strict';
import { MissionEngine } from '../missions/missionEngine.js';

const store = new Map();
global.localStorage = {
  getItem: key => store.has(key) ? store.get(key) : null,
  setItem: (key, value) => store.set(key, value),
  removeItem: key => store.delete(key)
};

const missions = new MissionEngine('test.missions');
missions.clear();

const recovery = missions.propose({
  decision: { route: 'recovery', room: 'Recovery Room' },
  specialist: { label: 'Recovery Coach Herb' },
  message: 'I have been dealing with addiction for four years.',
  learned: ['Recovery is an active life priority.']
});

assert.equal(recovery.title, 'Recovery Foundation');
assert.equal(recovery.tasks.length, 3);
assert.equal(missions.active().length, 1);

const sameRoute = missions.propose({
  decision: { route: 'recovery', room: 'Recovery Room' },
  specialist: { label: 'Recovery Coach Herb' },
  message: 'I want to get serious about recovery.'
});
assert.equal(sameRoute.id, recovery.id, 'The same active route should continue the existing mission.');

missions.toggleTask(recovery.id, '1');
assert.equal(missions.progress(missions.all()[0]).done, 1);

missions.toggleTask(recovery.id, '2');
missions.toggleTask(recovery.id, '3');
assert.equal(missions.all()[0].status, 'completed');

missions.addReturnNote(recovery.id, 'I called a recovery coach and attended a meeting.');
assert.match(missions.all()[0].returnNote, /recovery coach/);

const business = missions.propose({
  decision: { route: 'business', room: 'The Marketplace' },
  specialist: { label: 'Business Coach Herb' },
  message: 'I want to build a business but I have no customers.'
});
assert.equal(business.title, 'One Real Customer');
assert.equal(missions.all().length, 2);

console.log('Mission Engine tests passed.');
