import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchCreators } from '../lib/matching.js';
test('ranks creators by transparent exact field matches', () => {
  const business = { details: { Platform: 'Instagram', Location: 'Delhi', 'Category / niche': 'Food', 'Content format': 'Reels, Stories' } };
  const creators = [{ name: 'No match', details: { Platform: 'YouTube' } }, { name: 'Match', details: { Platform: 'instagram', Location: ' Delhi ', 'Content format': 'Reels' } }];
  const result = matchCreators(business, creators);
  assert.equal(result[0].creator.name, 'Match');
  assert.deepEqual(result[0].reasons, ['Platform', 'Location', 'Content format']);
  assert.equal(result[1].reasons.length, 0);
});
