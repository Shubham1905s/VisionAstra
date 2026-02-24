export const TEAM_ID_PREFIX = "VA2026";
export const MIN_TEAM_SIZE = 2;
export const MAX_TEAM_SIZE = 4;

export const ROUNDS = [
  { id: "R1", title: "Round 1", maxMarks: 50, submissionType: "PDF" },
  { id: "R2", title: "Round 2", maxMarks: 50, submissionType: "GITHUB_LINK" },
];

export const DEFAULT_ROUND_SETTINGS = {
  R1: { active: false, deadline: "", requiresPreviousRound: false },
  R2: { active: false, deadline: "", requiresPreviousRound: true },
};
