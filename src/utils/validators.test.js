import { describe, it, expect, beforeEach } from 'vitest';
import { generateTeamId, normalizeTeamId } from './validators';
import { TEAM_ID_PREFIX } from './constants';

describe('Team ID Validators', () => {
  describe('generateTeamId', () => {
    it('should generate a team ID with the correct prefix', () => {
      const teamId = generateTeamId(TEAM_ID_PREFIX);
      expect(teamId).toMatch(/^VA2026\d{4}$/);
    });

    it('should add a 4-digit random number to the prefix', () => {
      const teamId = generateTeamId(TEAM_ID_PREFIX);
      const numberPart = teamId.replace(TEAM_ID_PREFIX, '');
      expect(numberPart).toMatch(/^\d{4}$/);
      expect(Number(numberPart)).toBeGreaterThanOrEqual(1000);
      expect(Number(numberPart)).toBeLessThanOrEqual(9999);
    });

    it('should generate unique team IDs on sequential calls', () => {
      const teamIds = new Set();
      for (let i = 0; i < 100; i++) {
        teamIds.add(generateTeamId(TEAM_ID_PREFIX));
      }
      // With 100 calls, we should get mostly unique IDs (very rare collisions)
      expect(teamIds.size).toBeGreaterThan(95);
    });

    it('should work with custom prefixes', () => {
      const customPrefix = 'TEST';
      const teamId = generateTeamId(customPrefix);
      expect(teamId).toMatch(/^TEST\d{4}$/);
    });
  });

  describe('normalizeTeamId', () => {
    it('should trim whitespace', () => {
      expect(normalizeTeamId('  VA20261234  ')).toBe('VA20261234');
      expect(normalizeTeamId('\tVA20261234\n')).toBe('VA20261234');
    });

    it('should convert to uppercase', () => {
      expect(normalizeTeamId('va20261234')).toBe('VA20261234');
      expect(normalizeTeamId('Va2026AbCd')).toBe('VA2026ABCD');
    });

    it('should handle empty strings', () => {
      expect(normalizeTeamId('')).toBe('');
      expect(normalizeTeamId('   ')).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(normalizeTeamId(null)).toBe('');
      expect(normalizeTeamId(undefined)).toBe('');
    });

    it('should combine trim and uppercase', () => {
      expect(normalizeTeamId('  va20261234  ')).toBe('VA20261234');
      expect(normalizeTeamId('\t VA2026abc \n')).toBe('VA2026ABC');
    });

    it('should handle team IDs with mixed case and spaces', () => {
      expect(normalizeTeamId('  vA 2026 1234  ')).toBe('VA 2026 1234');
    });

    it('should return empty string for whitespace only', () => {
      expect(normalizeTeamId('   \t\n   ')).toBe('');
    });
  });
});
