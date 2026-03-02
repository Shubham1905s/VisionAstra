import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mockDb } from './mockDb';
import { TEAM_ID_PREFIX, MAX_TEAM_SIZE, MIN_TEAM_SIZE } from '../utils/constants';

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

describe('Team ID Database Operations', () => {
  beforeEach(() => {
    localStorage.clear();
    mockDb.seedAdminIfMissing();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('createTeam', () => {
    let testUserId;

    beforeEach(() => {
      // Create a test student user
      try {
        mockDb.registerStudent({
          fullName: 'Test Student',
          email: 'test@college.edu',
          phone: '1234567890',
          password: 'Test@1234'
        });
      } catch (e) {
        // User might already exist
      }
      const user = mockDb.getUsers().find(u => u.email === 'test@college.edu');
      testUserId = user?.id;
    });

    it('should generate a valid team ID with correct prefix', () => {
      const team = mockDb.createTeam(testUserId, 'Test Team');
      expect(team.teamId).toMatch(/^VA2026\d{4}$/);
      expect(team.teamId).toContain(TEAM_ID_PREFIX);
    });

    it('should create team with unique team ID', () => {
      const team1 = mockDb.createTeam(testUserId, 'Team 1');
      
      // Create another user for second team
      try {
        mockDb.registerStudent({
          fullName: 'Another Student',
          email: 'another@college.edu',
          phone: '0987654321',
          password: 'Another@1234'
        });
      } catch (e) {}
      const user2 = mockDb.getUsers().find(u => u.email === 'another@college.edu');
      
      const team2 = mockDb.createTeam(user2.id, 'Team 2');
      expect(team1.teamId).not.toBe(team2.teamId);
    });

    it('should prevent duplicate team creation for same leader', () => {
      mockDb.createTeam(testUserId, 'First Team');
      expect(() => {
        mockDb.createTeam(testUserId, 'Second Team');
      }).toThrow('You are already in a team.');
    });

    it('should set leader as first member', () => {
      const team = mockDb.createTeam(testUserId, 'Test Team');
      expect(team.memberIds).toContain(testUserId);
      expect(team.leaderId).toBe(testUserId);
    });

    it('should initialize team with locked=false', () => {
      const team = mockDb.createTeam(testUserId, 'Test Team');
      expect(team.locked).toBe(false);
    });
  });

  describe('getTeamById', () => {
    let team;
    let testUserId;

    beforeEach(() => {
      try {
        mockDb.registerStudent({
          fullName: 'Test Student',
          email: 'test2@college.edu',
          phone: '1234567890',
          password: 'Test@1234'
        });
      } catch (e) {}
      const user = mockDb.getUsers().find(u => u.email === 'test2@college.edu');
      testUserId = user?.id;
      team = mockDb.createTeam(testUserId, 'Test Team');
    });

    it('should find team by exact team ID', () => {
      const found = mockDb.getTeamById(team.teamId);
      expect(found).not.toBeNull();
      expect(found.teamId).toBe(team.teamId);
    });

    it('should find team by normalized team ID (lowercase)', () => {
      const found = mockDb.getTeamById(team.teamId.toLowerCase());
      expect(found).not.toBeNull();
      expect(found.teamId).toBe(team.teamId);
    });

    it('should find team by normalized team ID (with spaces)', () => {
      const found = mockDb.getTeamById(`  ${team.teamId}  `);
      expect(found).not.toBeNull();
      expect(found.teamId).toBe(team.teamId);
    });

    it('should return null for non-existent team ID', () => {
      const found = mockDb.getTeamById('VA2026XXXX');
      expect(found).toBeNull();
    });

    it('should handle empty team ID', () => {
      const found = mockDb.getTeamById('');
      expect(found).toBeNull();
    });
  });

  describe('requestToJoin', () => {
    let leaderUserId;
    let studentUserId;
    let team;

    beforeEach(() => {
      // Create leader
      try {
        mockDb.registerStudent({
          fullName: 'Leader',
          email: 'leader@college.edu',
          phone: '1111111111',
          password: 'Leader@1234'
        });
      } catch (e) {}
      const leader = mockDb.getUsers().find(u => u.email === 'leader@college.edu');
      leaderUserId = leader?.id;
      team = mockDb.createTeam(leaderUserId, 'Test Team');

      // Create student
      try {
        mockDb.registerStudent({
          fullName: 'Student',
          email: 'student@college.edu',
          phone: '2222222222',
          password: 'Student@1234'
        });
      } catch (e) {}
      const student = mockDb.getUsers().find(u => u.email === 'student@college.edu');
      studentUserId = student?.id;
    });

    it('should accept join request with valid team ID', () => {
      expect(() => {
        mockDb.requestToJoin(team.teamId, studentUserId);
      }).not.toThrow();
    });

    it('should accept normalized team ID', () => {
      expect(() => {
        mockDb.requestToJoin(team.teamId.toLowerCase(), studentUserId);
      }).not.toThrow();
    });

    it('should throw error for non-existent team ID', () => {
      expect(() => {
        mockDb.requestToJoin('VA2026XXXX', studentUserId);
      }).toThrow('Team or student not found.');
    });

    it('should prevent student already in team from joining another', () => {
      // Add student to a team first
      mockDb.requestToJoin(team.teamId, studentUserId);
      const requests = mockDb.getJoinRequestsByLeader(leaderUserId);
      mockDb.decideJoinRequest(requests[0].id, true);

      // Try to create another team
      try {
        mockDb.registerStudent({
          fullName: 'Another Leader',
          email: 'leader2@college.edu',
          phone: '3333333333',
          password: 'Leader2@1234'
        });
      } catch (e) {}
      const leader2 = mockDb.getUsers().find(u => u.email === 'leader2@college.edu');
      const team2 = mockDb.createTeam(leader2.id, 'Team 2');

      expect(() => {
        mockDb.requestToJoin(team2.teamId, studentUserId);
      }).toThrow('You are already in a team.');
    });

    it('should prevent duplicate join requests', () => {
      mockDb.requestToJoin(team.teamId, studentUserId);
      expect(() => {
        mockDb.requestToJoin(team.teamId, studentUserId);
      }).toThrow('Join request already pending.');
    });

    it('should prevent joining full teams', () => {
      // Fill team to MAX_TEAM_SIZE
      for (let i = 1; i < MAX_TEAM_SIZE; i++) {
        try {
          mockDb.registerStudent({
            fullName: `Member ${i}`,
            email: `member${i}@college.edu`,
            phone: `${9000000000 + i}`,
            password: 'Member@1234'
          });
        } catch (e) {}
        const member = mockDb.getUsers().find(u => u.email === `member${i}@college.edu`);
        mockDb.requestToJoin(team.teamId, member.id);
        const req = mockDb.getJoinRequestsByLeader(leaderUserId)[0];
        mockDb.decideJoinRequest(req.id, true);
      }

      // Try to join full team
      try {
        mockDb.registerStudent({
          fullName: 'Extra Member',
          email: 'extra@college.edu',
          phone: '4444444444',
          password: 'Extra@1234'
        });
      } catch (e) {}
      const extra = mockDb.getUsers().find(u => u.email === 'extra@college.edu');

      expect(() => {
        mockDb.requestToJoin(team.teamId, extra.id);
      }).toThrow('Team is full.');
    });
  });

  describe('listOpenTeams', () => {
    let leaderUserId;
    let team1, team2, team3;

    beforeEach(() => {
      // Create leader 1
      try {
        mockDb.registerStudent({
          fullName: 'Leader1',
          email: 'leader1@college.edu',
          phone: '5555555555',
          password: 'Leader1@1234'
        });
      } catch (e) {}
      const leader1 = mockDb.getUsers().find(u => u.email === 'leader1@college.edu');
      team1 = mockDb.createTeam(leader1.id, 'Team 1');

      // Create leader 2
      try {
        mockDb.registerStudent({
          fullName: 'Leader2',
          email: 'leader2@college.edu',
          phone: '6666666666',
          password: 'Leader2@1234'
        });
      } catch (e) {}
      const leader2 = mockDb.getUsers().find(u => u.email === 'leader2@college.edu');
      team2 = mockDb.createTeam(leader2.id, 'Team 2');

      // Create leader 3
      try {
        mockDb.registerStudent({
          fullName: 'Leader3',
          email: 'leader3@college.edu',
          phone: '7777777777',
          password: 'Leader3@1234'
        });
      } catch (e) {}
      const leader3 = mockDb.getUsers().find(u => u.email === 'leader3@college.edu');
      team3 = mockDb.createTeam(leader3.id, 'Team 3');
      leaderUserId = leader1.id;
    });

    it('should list only open teams (unlocked and with space)', () => {
      // Lock team1
      mockDb.setTeamLock(team1.id, true);
      const openTeams = mockDb.listOpenTeams();
      
      const teamIds = openTeams.map(t => t.teamId);
      expect(teamIds).not.toContain(team1.teamId);
      expect(teamIds).toContain(team2.teamId);
      expect(teamIds).toContain(team3.teamId);
    });

    it('should exclude full teams from open list', () => {
      // Fill team1 to capacity
      for (let i = 1; i < MAX_TEAM_SIZE; i++) {
        try {
          mockDb.registerStudent({
            fullName: `Filler ${i}`,
            email: `filler${i}@college.edu`,
            phone: `${8000000000 + i}`,
            password: 'Filler@1234'
          });
        } catch (e) {}
        const filler = mockDb.getUsers().find(u => u.email === `filler${i}@college.edu`);
        mockDb.requestToJoin(team1.teamId, filler.id);
        const reqs = mockDb.getJoinRequestsByLeader(mockDb.getTeamById(team1.teamId).leaderId);
        mockDb.decideJoinRequest(reqs[reqs.length - 1].id, true);
      }

      const openTeams = mockDb.listOpenTeams();
      const teamIds = openTeams.map(t => t.teamId);
      expect(teamIds).not.toContain(team1.teamId);
    });
  });

  describe('Team ID in URL Scenarios', () => {
    let team;
    let testUserId;

    beforeEach(() => {
      try {
        mockDb.registerStudent({
          fullName: 'UrlTest',
          email: 'urltest@college.edu',
          phone: '9999999999',
          password: 'UrlTest@1234'
        });
      } catch (e) {}
      const user = mockDb.getUsers().find(u => u.email === 'urltest@college.edu');
      testUserId = user?.id;
      team = mockDb.createTeam(testUserId, 'URL Test Team');
    });

    it('should handle team ID passed via URL query parameter', () => {
      // Simulate URL parsing
      const searchParams = new URLSearchParams();
      searchParams.set('teamId', team.teamId);
      const teamIdFromUrl = searchParams.get('teamId');
      
      const foundTeam = mockDb.getTeamById(teamIdFromUrl);
      expect(foundTeam).not.toBeNull();
      expect(foundTeam.teamId).toBe(team.teamId);
    });

    it('should handle team ID with case variations in URL', () => {
      const searchParams = new URLSearchParams();
      searchParams.set('teamId', team.teamId.toLowerCase());
      const teamIdFromUrl = searchParams.get('teamId');
      
      const foundTeam = mockDb.getTeamById(teamIdFromUrl);
      expect(foundTeam).not.toBeNull();
      expect(foundTeam.teamId).toBe(team.teamId);
    });

    it('should handle encoded team ID in URL', () => {
      const searchParams = new URLSearchParams();
      searchParams.set('teamId', team.teamId);
      const encoded = searchParams.toString();
      const decoded = decodeURIComponent(encoded.split('=')[1]);
      
      const foundTeam = mockDb.getTeamById(decoded);
      expect(foundTeam).not.toBeNull();
    });
  });

  describe('Team ID Consistency Checks', () => {
    it('should maintain team ID consistency across operations', () => {
      try {
        mockDb.registerStudent({
          fullName: 'Consistency Test',
          email: 'consistency@college.edu',
          phone: '1010101010',
          password: 'Consistency@1234'
        });
      } catch (e) {}
      const user = mockDb.getUsers().find(u => u.email === 'consistency@college.edu');
      const team = mockDb.createTeam(user.id, 'Consistency Team');
      
      // Store original teamId
      const originalTeamId = team.teamId;
      
      // Retrieve team multiple times
      const team1 = mockDb.getTeamById(originalTeamId);
      const team2 = mockDb.getTeamById(originalTeamId.toLowerCase());
      const team3 = mockDb.getTeamById(`  ${originalTeamId}  `);
      
      expect(team1.teamId).toBe(originalTeamId);
      expect(team2.teamId).toBe(originalTeamId);
      expect(team3.teamId).toBe(originalTeamId);
    });
  });
});
