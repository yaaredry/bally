import { describe, test, expect } from 'vitest';
import {
  SKILL_LEVELS_BY_SPORT,
  SKILL_BADGE_COLORS,
  SKILL_HEX,
  getSkillLevelsForSports,
} from '../lib/skillLevels';

describe('SKILL_LEVELS_BY_SPORT', () => {
  test('Beach Volleyball has 7 levels', () => {
    expect(SKILL_LEVELS_BY_SPORT['Beach Volleyball']).toHaveLength(7);
    expect(SKILL_LEVELS_BY_SPORT['Beach Volleyball'][0]).toBe('1');
    expect(SKILL_LEVELS_BY_SPORT['Beach Volleyball'][6]).toBe('7');
  });

  test('Footvolley has 6 levels ending with League', () => {
    const levels = SKILL_LEVELS_BY_SPORT['Footvolley'];
    expect(levels[0]).toBe('E');
    expect(levels[levels.length - 1]).toBe('League');
  });

  test('Teqball has 7 levels', () => {
    expect(SKILL_LEVELS_BY_SPORT['Teqball']).toHaveLength(7);
  });
});

describe('SKILL_BADGE_COLORS', () => {
  test('every BV level has a badge color', () => {
    SKILL_LEVELS_BY_SPORT['Beach Volleyball'].forEach(lvl => {
      expect(SKILL_BADGE_COLORS[lvl]).toBeTruthy();
    });
  });

  test('every Footvolley level has a badge color', () => {
    SKILL_LEVELS_BY_SPORT['Footvolley'].forEach(lvl => {
      expect(SKILL_BADGE_COLORS[lvl]).toBeTruthy();
    });
  });

  test('"All welcome" has a badge color', () => {
    expect(SKILL_BADGE_COLORS['All welcome']).toBeTruthy();
  });
});

describe('SKILL_HEX', () => {
  test('every BV level has a hex color', () => {
    SKILL_LEVELS_BY_SPORT['Beach Volleyball'].forEach(lvl => {
      expect(SKILL_HEX[lvl]).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  test('every Footvolley level has a hex color', () => {
    SKILL_LEVELS_BY_SPORT['Footvolley'].forEach(lvl => {
      expect(SKILL_HEX[lvl]).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe('getSkillLevelsForSports', () => {
  test('returns empty array for no sports', () => {
    expect(getSkillLevelsForSports([])).toEqual([]);
    expect(getSkillLevelsForSports(null)).toEqual([]);
    expect(getSkillLevelsForSports(undefined)).toEqual([]);
  });

  test('returns BV levels for Beach Volleyball only', () => {
    const levels = getSkillLevelsForSports(['Beach Volleyball']);
    expect(levels).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  test('returns Footvolley levels for Footvolley only', () => {
    const levels = getSkillLevelsForSports(['Footvolley']);
    expect(levels).toEqual(['E', 'D', 'C', 'B', 'A', 'League']);
  });

  test('deduplicates when both sports share level labels', () => {
    // BV and Teqball both have '1'-'7', so combined should have no duplicates
    const levels = getSkillLevelsForSports(['Beach Volleyball', 'Teqball']);
    const unique = new Set(levels);
    expect(unique.size).toBe(levels.length);
    expect(levels).toHaveLength(7); // same 7 levels
  });

  test('returns combined unique levels for BV + Footvolley', () => {
    const levels = getSkillLevelsForSports(['Beach Volleyball', 'Footvolley']);
    // BV: 1-7, FV: E,D,C,B,A,League — no overlap, 13 total
    expect(levels).toHaveLength(13);
  });

  test('ignores unknown sport', () => {
    const levels = getSkillLevelsForSports(['Unknown Sport']);
    expect(levels).toEqual([]);
  });
});
