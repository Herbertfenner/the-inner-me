import assert from 'node:assert/strict';
import { ExecutionEngine } from '../execution/executionEngine.js';

const engine = new ExecutionEngine();

const recovery = engine.draft({
  decision: { route: 'recovery' },
  mission: {
    id: 'm1',
    title: 'Recovery Foundation',
    tasks: [{ id: '1', text: 'Reach out to one recovery support.', done: false }]
  },
  brain: { patterns: [], commitments: [] },
  profile: {},
  message: 'I have been dealing with addiction for four years.'
});

assert.equal(recovery.route, 'recovery');
assert.equal(recovery.missionTitle, 'Recovery Foundation');
assert.equal(recovery.action, 'Reach out to one recovery support.');
assert.match(recovery.support, /sponsor|recovery coach/i);
assert.equal(recovery.editable, true);

const business = engine.draft({
  decision: { route: 'business' },
  mission: { title: 'One Real Customer', tasks: [] },
  brain: {
    patterns: [{ count: 3, value: 'fear of rejection' }],
    commitments: [{ status: 'active', value: 'contact three people' }]
  },
  profile: { goals: ['Find customers'], projects: ['R3'] },
  message: 'I want to build a business but have no customers.'
});

assert.equal(business.route, 'business');
assert.match(business.action, /ideal customer|three real people/i);
assert.match(business.barrier, /fear of rejection/i);
assert.match(business.counter, /contact three people/i);
assert.deepEqual(business.profileSignals.goals, ['Find customers']);

const safety = engine.draft({
  decision: { route: 'safety' },
  mission: { title: 'Immediate Safety Connection', tasks: [] }
});
assert.equal(safety.when, 'Now');
assert.match(safety.action, /safe person|crisis|emergency/i);

console.log('Execution Engine tests passed.');
