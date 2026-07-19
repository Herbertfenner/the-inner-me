import assert from 'node:assert/strict';
import { ReflectionEngine } from '../reflection/reflectionEngine.js';

const engine = new ReflectionEngine();

const safety = engine.decide({
  message: 'I want to end my life',
  decision: { route: 'safety' },
  depth: 4,
  conversation: [{ role: 'user', content: 'I want to end my life' }]
});
assert.equal(safety.allowQuestion, true);
assert.equal(safety.mode, 'ask');

const shift = engine.decide({
  message: 'I really want to live and make something of my life',
  decision: { route: 'recovery' },
  depth: 3,
  conversation: [
    { role: 'user', content: 'I have been struggling for years' },
    { role: 'user', content: 'I really want to live and make something of my life' }
  ]
});
assert.equal(shift.allowQuestion, false);
assert.equal(shift.mode, 'house_reflection');
assert.match(shift.houseVoice, /want to live/i);

const pattern = engine.decide({
  message: 'I keep doing this',
  decision: { route: 'identity' },
  brain: { patterns: [{ value: 'I avoid the next step', count: 4 }] },
  depth: 2,
  conversation: [{ role: 'user', content: 'I keep doing this' }]
});
assert.equal(pattern.mode, 'pattern_reflection');
assert.equal(pattern.allowQuestion, false);

const business = engine.decide({
  message: 'I need customers',
  decision: { route: 'business' },
  depth: 1
});
assert.equal(business.mode, 'challenge');
assert.equal(business.allowQuestion, true);

console.log('Reflection Engine tests passed');
