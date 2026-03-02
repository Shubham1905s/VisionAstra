import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mockDb } from './mockDb';
import { TEAM_ID_PREFIX } from '../utils/constants';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Team ID Core Functionality', () => {
  beforeEach(() => {
    localStorage.clear();
    mockDb.seedAdminIfMissing();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should generate a valid team ID with correct format', () => {
    // Register a test student
    mockDb.registerStudent({
      fullName: 'Test User',
      email: 'test@college.edu',
      phone: '1234567890',
      password: 'Test@1234'
    });

    const user = mockDb.getUsers().find(u => u.email === 'test@college.edu');
    const team = mockDb.createTeam(user.id, 'Test Team');

    expect(team.teamId).toBeDefined();
    expect(team.teamId).toMatch(/^VA2026\d{4}$/);
  });

  it('should retrieve team by ID with case-insensitive matching', () => {
    mockDb.registerStudent({
      fullName: 'Test User',
      email: 'test2@college.edu',
      phone: '1234567890',
      password: 'Test@1234'
    });

    const user = mockDb.getUsers().find(u => u.email === 'test2@college.edu');
    const team = mockDb.createTeam(user.id, 'Test Team');

    // Test case-insensitive retrieval
    const found1 = mockDb.getTeamById(team.teamId);
    const found2 = mockDb.getTeamById(team.teamId.toLowerCase());
    const found3 = mockDb.getTeamById(team.teamId.toUpperCase());

    expect(found1.teamId).toBe(team.teamId);
    expect(found2.teamId).toBe(team.teamId);
    expect(found3.teamId).toBe(team.teamId);
  });

  it('should prevent student from joining team if already in one', () => {
    // Create leader 1
    mockDb.registerStudent({
      fullName: 'Leader 1',
      email: 'leader1@college.edu',
      phone: '1111111111',
      password: 'Leader@1234'
    });

    // Create leader 2
    mockDb.registerStudent({
      fullName: 'Leader 2',
      email: 'leader2@college.edu',
      phone: '2222222222',
      password: 'Leader@1234'
    });

    // Create student
    mockDb.registerStudent({
      fullName: 'Student',
      email: 'student@college.edu',
      phone: '3333333333',
      password: 'Student@1234'
    });

    const leader1 = mockDb.getUsers().find(u => u.email === 'leader1@college.edu');
    const leader2 = mockDb.getUsers().find(u => u.email === 'leader2@college.edu');
    const student = mockDb.getUsers().find(u => u.email === 'student@college.edu');

    const team1 = mockDb.createTeam(leader1.id, 'Team 1');
    const team2 = mockDb.createTeam(leader2.id, 'Team 2');

    // Student joins team 1
    mockDb.requestToJoin(team1.teamId, student.id);
    const request = mockDb.getJoinRequestsByLeader(leader1.id)[0];
    mockDb.decideJoinRequest(request.id, true);

    // Try to join team 2 - should fail
    expect(() => {
      mockDb.requestToJoin(team2.teamId, student.id);
    }).toThrow('You are already in a team.');
  });

  it('should create unique team IDs', () => {
    mockDb.registerStudent({
      fullName: 'User 1',
      email: 'user1@college.edu',
      phone: '1111111111',
      password: 'User@1234'
    });

    mockDb.registerStudent({
      fullName: 'User 2',
      email: 'user2@college.edu',
      phone: '2222222222',
      password: 'User@1234'
    });

    const user1 = mockDb.getUsers().find(u => u.email === 'user1@college.edu');
    const user2 = mockDb.getUsers().find(u => u.email === 'user2@college.edu');

    const team1 = mockDb.createTeam(user1.id, 'Team 1');
    const team2 = mockDb.createTeam(user2.id, 'Team 2');

    expect(team1.teamId).not.toBe(team2.teamId);
  });

  it('should list only open teams (not locked and not full)', () => {
    mockDb.registerStudent({
      fullName: 'Leader 1',
      email: 'leader1a@college.edu',
      phone: '1111111111',
      password: 'Leader@1234'
    });

    mockDb.registerStudent({
      fullName: 'Leader 2',
      email: 'leader2a@college.edu',
      phone: '2222222222',
      password: 'Leader@1234'
    });

    const leader1 = mockDb.getUsers().find(u => u.email === 'leader1a@college.edu');
    const leader2 = mockDb.getUsers().find(u => u.email === 'leader2a@college.edu');

    const team1 = mockDb.createTeam(leader1.id, 'Team 1');
    const team2 = mockDb.createTeam(leader2.id, 'Team 2');

    // Lock team 1
    mockDb.setTeamLock(team1.id, true);

    const openTeams = mockDb.listOpenTeams();
    const openTeamIds = openTeams.map(t => t.teamId);

    expect(openTeamIds).not.toContain(team1.teamId);
    expect(openTeamIds).toContain(team2.teamId);
  });
});
