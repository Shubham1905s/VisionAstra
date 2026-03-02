import {
  DEFAULT_ROUND_SETTINGS,
  MAX_TEAM_SIZE,
  MIN_TEAM_SIZE,
  TEAM_ID_PREFIX,
} from "../utils/constants";
import { calculateTotalMarks, generateTeamId, normalizeTeamId } from "../utils/validators";

const DB_KEY = "visionastra_db_v1";
const SESSION_KEY = "visionastra_session";
const OTP_KEY = "visionastra_otp";

const defaultDb = {
  users: [],
  teams: [],
  joinRequests: [],
  problemStatements: [],
  roundSettings: DEFAULT_ROUND_SETTINGS,
  submissions: [],
  marks: [],
  certificates: [],
  notifications: [],
};

function nowIso() {
  return new Date().toISOString();
}

function readDb() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultDb));
    return structuredClone(defaultDb);
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultDb),
      ...parsed,
      roundSettings: {
        ...DEFAULT_ROUND_SETTINGS,
        ...(parsed.roundSettings || {}),
      },
    };
  } catch {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultDb));
    return structuredClone(defaultDb);
  }
}

function writeDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

export const mockDb = {
  seedAdminIfMissing() {
    const db = readDb();
    const existingAdmin = db.users.find((u) => u.role === "admin");
    if (!existingAdmin) {
      db.users.push({
        id: crypto.randomUUID(),
        fullName: "System Admin",
        email: "admin@visionastra.edu",
        phone: "9999999999",
        password: "Admin@123",
        verified: true,
        role: "admin",
        teamId: null,
        createdAt: nowIso(),
      });
      writeDb(db);
    }
  },

  storeOtp(email, otp) {
    const raw = localStorage.getItem(OTP_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[email.toLowerCase()] = otp;
    localStorage.setItem(OTP_KEY, JSON.stringify(map));
    return otp;
  },

  verifyOtp(email, otp) {
    const raw = localStorage.getItem(OTP_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw);
    return map[email.toLowerCase()] === otp;
  },

  registerStudent(payload) {
    const db = readDb();
    const email = payload.email.toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      throw new Error("Account already exists for this email.");
    }

    const user = {
      id: crypto.randomUUID(),
      fullName: payload.fullName,
      email,
      phone: payload.phone,
      password: payload.password,
      verified: true,
      role: "student",
      teamId: null,
      createdAt: nowIso(),
    };
    db.users.push(user);
    writeDb(db);
    return sanitizeUser(user);
  },

  login({ email, password, role }) {
    const db = readDb();
    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password &&
        u.role === role,
    );

    if (!user) {
      throw new Error("Invalid credentials.");
    }

    if (!user.verified) {
      throw new Error("Email is not verified.");
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
    return sanitizeUser(user);
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser() {
    const sessionRaw = localStorage.getItem(SESSION_KEY);
    if (!sessionRaw) return null;
    const db = readDb();
    const session = JSON.parse(sessionRaw);
    const user = db.users.find((u) => u.id === session.userId);
    return user ? sanitizeUser(user) : null;
  },

  getUsers() {
    const db = readDb();
    return db.users.map(sanitizeUser);
  },

  createTeam(leaderId, teamName) {
    const db = readDb();
    const leader = db.users.find((u) => u.id === leaderId);
    if (!leader || leader.role !== "student") {
      throw new Error("Leader is invalid.");
    }
    if (leader.teamId) {
      throw new Error("You are already in a team.");
    }

    let teamId = generateTeamId(TEAM_ID_PREFIX);
    while (db.teams.some((t) => t.teamId === teamId)) {
      teamId = generateTeamId(TEAM_ID_PREFIX);
    }

    const team = {
      id: crypto.randomUUID(),
      teamId,
      teamName,
      leaderId,
      memberIds: [leaderId],
      locked: false,
      problemStatementId: "",
      problemType: "",
      createdAt: nowIso(),
    };
    db.teams.push(team);
    leader.teamId = team.id;
    writeDb(db);
    return team;
  },

  getTeamByUser(userId) {
    const db = readDb();
    const user = db.users.find((u) => u.id === userId);
    if (!user || !user.teamId) return null;
    return db.teams.find((t) => t.id === user.teamId) || null;
  },

  getTeamById(teamIdCode) {
    const db = readDb();
    const normalizedCode = normalizeTeamId(teamIdCode);
    return db.teams.find((t) => normalizeTeamId(t.teamId) === normalizedCode) || null;
  },

  listOpenTeams() {
    const db = readDb();
    return db.teams.filter((t) => t.memberIds.length < MAX_TEAM_SIZE && !t.locked);
  },

  requestToJoin(teamIdCode, studentId) {
    const db = readDb();
    const normalizedCode = normalizeTeamId(teamIdCode);
    const team = db.teams.find((t) => normalizeTeamId(t.teamId) === normalizedCode);
    const student = db.users.find((u) => u.id === studentId);
    if (!team || !student) throw new Error("Team or student not found.");
    if (student.teamId) throw new Error("You are already in a team.");
    if (team.memberIds.length >= MAX_TEAM_SIZE) throw new Error("Team is full.");

    const existing = db.joinRequests.find(
      (r) => r.teamId === team.id && r.studentId === studentId && r.status === "pending",
    );
    if (existing) {
      throw new Error("Join request already pending.");
    }

    db.joinRequests.push({
      id: crypto.randomUUID(),
      teamId: team.id,
      studentId,
      status: "pending",
      createdAt: nowIso(),
    });
    writeDb(db);
  },

  getJoinRequestsByLeader(leaderId) {
    const db = readDb();
    const leaderTeams = db.teams.filter((t) => t.leaderId === leaderId).map((t) => t.id);
    return db.joinRequests.filter((r) => leaderTeams.includes(r.teamId) && r.status === "pending");
  },

  decideJoinRequest(requestId, accept) {
    const db = readDb();
    const req = db.joinRequests.find((r) => r.id === requestId);
    if (!req || req.status !== "pending") throw new Error("Request not found.");

    const team = db.teams.find((t) => t.id === req.teamId);
    const student = db.users.find((u) => u.id === req.studentId);
    if (!team || !student) throw new Error("Team or student not found.");

    if (accept) {
      if (team.memberIds.length >= MAX_TEAM_SIZE) {
        throw new Error("Team already full.");
      }
      team.memberIds.push(student.id);
      student.teamId = team.id;
      req.status = "accepted";
    } else {
      req.status = "rejected";
    }
    writeDb(db);
  },

  setTeamLock(teamDbId, lockState) {
    const db = readDb();
    const team = db.teams.find((t) => t.id === teamDbId);
    if (!team) throw new Error("Team not found.");
    if (team.memberIds.length < MIN_TEAM_SIZE) {
      throw new Error(`Team must have at least ${MIN_TEAM_SIZE} members before lock.`);
    }
    team.locked = lockState;
    writeDb(db);
  },

  upsertProblemStatement(item) {
    const db = readDb();
    const existing = db.problemStatements.find((p) => p.id === item.id);
    if (existing) {
      Object.assign(existing, item);
    } else {
      db.problemStatements.push(item);
    }
    writeDb(db);
  },

  getProblemStatements() {
    const db = readDb();
    return db.problemStatements;
  },

  assignProblemToTeam(teamDbId, problemStatementId, type) {
    const db = readDb();
    const team = db.teams.find((t) => t.id === teamDbId);
    if (!team) throw new Error("Team not found.");
    team.problemStatementId = problemStatementId;
    team.problemType = type;
    writeDb(db);
  },

  getRoundSettings() {
    const db = readDb();
    return db.roundSettings;
  },

  setRoundSettings(roundId, payload) {
    const db = readDb();
    db.roundSettings[roundId] = {
      ...db.roundSettings[roundId],
      ...payload,
    };
    writeDb(db);
  },

  submitRound(teamDbId, roundId, payload) {
    const db = readDb();
    const existing = db.submissions.find((s) => s.teamDbId === teamDbId && s.roundId === roundId);
    if (existing) {
      Object.assign(existing, payload, { updatedAt: nowIso() });
    } else {
      db.submissions.push({
        id: crypto.randomUUID(),
        teamDbId,
        roundId,
        ...payload,
        createdAt: nowIso(),
      });
    }
    writeDb(db);
  },

  getSubmissions() {
    const db = readDb();
    return db.submissions;
  },

  setMarks(teamDbId, roundId, marks) {
    const db = readDb();
    const team = db.teams.find((t) => t.id === teamDbId);
    if (!team) throw new Error("Team not found.");

    let record = db.marks.find((m) => m.teamDbId === teamDbId);
    if (!record) {
      record = { id: crypto.randomUUID(), teamDbId, R1: 0, R2: 0, total: 0 };
      db.marks.push(record);
    }

    record[roundId] = Number(marks || 0);
    record.total = calculateTotalMarks(record.R1, record.R2);
    writeDb(db);
  },

  getMarks() {
    const db = readDb();
    return db.marks;
  },

  generateCertificates() {
    const db = readDb();
    const hackathonName = import.meta.env.VITE_HACKATHON_NAME || "VisionAstra Hackathon";

    db.teams.forEach((team) => {
      const mark = db.marks.find((m) => m.teamDbId === team.id);
      team.memberIds.forEach((memberId) => {
        const user = db.users.find((u) => u.id === memberId);
        if (!user) return;
 
        const existing = db.certificates.find((c) => c.userId === user.id);
        const payload = {
          id: existing?.id || crypto.randomUUID(),
          certificateId: `CERT-${Math.floor(100000 + Math.random() * 900000)}`,
          userId: user.id,
          teamName: team.teamName,
          studentName: user.fullName,
          hackathonName,
          totalMarks: mark?.total || 0,
          issuedAt: nowIso(),
        };

        if (existing) {
          Object.assign(existing, payload);
        } else {
          db.certificates.push(payload);
        }
      });
    });

    writeDb(db);
  },

  getCertificateByUser(userId) {
    const db = readDb();
    return db.certificates.find((c) => c.userId === userId) || null;
  },

  createNotification(payload) {
    const db = readDb();
    db.notifications.push({
      id: crypto.randomUUID(),
      ...payload,
      createdAt: nowIso(),
    });
    writeDb(db);
  },

  getNotifications() {
    const db = readDb();
    return db.notifications;
  },

  getAdminMetrics() {
    const db = readDb();
    const students = db.users.filter((u) => u.role === "student");
    const withoutTeam = students.filter((s) => !s.teamId);
    const completedTeams = db.teams.filter((t) => t.memberIds.length >= MIN_TEAM_SIZE);

    return {
      totalStudents: students.length,
      totalTeams: db.teams.length,
      studentsWithoutTeam: withoutTeam.length,
      completedTeams: completedTeams.length,
      submissionsR1: db.submissions.filter((s) => s.roundId === "R1").length,
      submissionsR2: db.submissions.filter((s) => s.roundId === "R2").length,
    };
  },

  getVerificationRows() {
    const db = readDb();
    const studentUsers = db.users.filter((u) => u.role === "student");

    return studentUsers.map((student) => {
      const team = db.teams.find((t) => t.id === student.teamId);
      const mark = db.marks.find((m) => m.teamDbId === team?.id);
      return {
        studentName: student.fullName,
        studentId: student.id,
        teamName: team?.teamName || "-",
        R1: mark?.R1 ?? 0,
        R2: mark?.R2 ?? 0,
        total: mark?.total ?? 0,
      };
    });
  },
};
