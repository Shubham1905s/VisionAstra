import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import SectionCard from "../../components/common/SectionCard";
import { useAuth } from "../../context/AuthContext";
import { mockDb } from "../../services/mockDb";
import { MIN_TEAM_SIZE, ROUNDS } from "../../utils/constants";
import { normalizeTeamId } from "../../utils/validators";

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [teamName, setTeamName] = useState("");
  const [joinTeamId, setJoinTeamId] = useState(() => {
    const queryId = new URLSearchParams(window.location.search).get("teamId") || "";
    return normalizeTeamId(queryId);
  });
  const [openProblemChoice, setOpenProblemChoice] = useState("");
  const [r1Payload, setR1Payload] = useState({ fileName: "", fileUrl: "" });
  const [r2Payload, setR2Payload] = useState({ github: "", description: "" });
  const [message, setMessage] = useState("");
  const [state, setState] = useState({
    team: null,
    users: [], 
    joinRequests: [],
    openTeams: [],
    problems: [],
    roundSettings: {},
    submissions: [],
    marks: null,
    certificate: null,
  });
 
  function reload() {
    const team = mockDb.getTeamByUser(user.id);
    const users = mockDb.getUsers();
    const submissions = mockDb.getSubmissions().filter((s) => s.teamDbId === team?.id);
    const marks = mockDb.getMarks().find((m) => m.teamDbId === team?.id) || null;
    setState({
      team,
      users,
      joinRequests: mockDb.getJoinRequestsByLeader(user.id),
      openTeams: mockDb.listOpenTeams(),
      problems: mockDb.getProblemStatements(),
      roundSettings: mockDb.getRoundSettings(),
      submissions,
      marks,
      certificate: mockDb.getCertificateByUser(user.id),
    });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const queryId = new URLSearchParams(location.search).get("teamId") || "";
    const normalizedId = normalizeTeamId(queryId);
    if (normalizedId && !state.team) {
      setJoinTeamId(normalizedId);
    }
  }, [location.search, state.team]);

  const teamMembers = useMemo(() => {
    if (!state.team) return [];
    return state.team.memberIds
      .map((id) => state.users.find((u) => u.id === id))
      .filter(Boolean);
  }, [state.team, state.users]);

  const isLeader = state.team?.leaderId === user.id;
  const hasMinTeam = (state.team?.memberIds.length || 0) >= MIN_TEAM_SIZE;

  const r1Submission = state.submissions.find((s) => s.roundId === "R1");
  const r2Submission = state.submissions.find((s) => s.roundId === "R2");

  const canViewR1 = state.roundSettings?.R1?.active;
  const canViewR2 = state.roundSettings?.R2?.active && !!r1Submission;

  async function handleCreateTeam(e) {
    e.preventDefault();
    try {
      const team = mockDb.createTeam(user.id, teamName.trim());
      setMessage(`Team created. Share Team ID: ${team.teamId}`);
      setTeamName("");
      reload();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleJoinRequest(teamIdInput) {
    try {
      const teamId = normalizeTeamId(teamIdInput);
      if (!teamId) {
        setMessage("Enter a valid Team ID.");
        return;
      }
      mockDb.requestToJoin(teamId, user.id);
      setMessage("Join request sent.");
      setJoinTeamId("");
      reload();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleRequestDecision(requestId, accept) {
    try {
      mockDb.decideJoinRequest(requestId, accept);
      setMessage(accept ? "Request accepted." : "Request rejected.");
      reload();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleLockTeam(lockState) {
    try {
      mockDb.setTeamLock(state.team.id, lockState);
      setMessage(lockState ? "Team locked." : "Team unlocked.");
      reload();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleSelectProblem(type, id) {
    try {
      mockDb.assignProblemToTeam(state.team.id, id, type);
      setMessage("Problem statement updated.");
      reload();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function submitR1(e) {
    e.preventDefault();
    if (!isLeader) return setMessage("Only team leader can submit.");
    if (!hasMinTeam) return setMessage("Team must have at least 2 members.");

    mockDb.submitRound(state.team.id, "R1", {
      fileName: r1Payload.fileName,
      fileUrl: r1Payload.fileUrl,
      submittedBy: user.id,
    });
    setMessage("Round 1 submission uploaded.");
    reload();
  }

  function submitR2(e) {
    e.preventDefault();
    if (!isLeader) return setMessage("Only team leader can submit.");
    if (!hasMinTeam) return setMessage("Team must have at least 2 members.");

    mockDb.submitRound(state.team.id, "R2", {
      github: r2Payload.github,
      description: r2Payload.description,
      submittedBy: user.id,
    });
    setMessage("Round 2 submission uploaded.");
    reload();
  }

  function handleLogout() {
    logout();
    navigate("/student/login");
  }

  async function copyToClipboard(value, successMessage) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(successMessage);
    } catch {
      setMessage("Copy failed. Please copy manually.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Student Dashboard</h1>
            <p className="text-sm text-slate-600">Welcome, {user.fullName} ({user.email})</p>
          </div>
          <Button onClick={handleLogout}>Logout</Button>
        </header>

        {message && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}

        {!state.team && (
          <SectionCard title="Team Status">
            <p className="mb-3 text-sm text-slate-600">Not part of any team yet.</p>
            <form className="grid gap-3 md:grid-cols-3" onSubmit={handleCreateTeam}>
              <Input label="New Team Name" value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
              <div className="md:col-span-2 flex items-end">
                <Button type="submit">Create Team</Button>
              </div>
            </form>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-semibold">Join using Team ID</h4>
                <div className="flex gap-2">
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={joinTeamId}
                    onChange={(e) => setJoinTeamId(normalizeTeamId(e.target.value))}
                    placeholder="VA2026XXXX"
                  />
                  <Button type="button" onClick={() => handleJoinRequest(joinTeamId)}>Send Request</Button>
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Available Teams</h4>
                <ul className="space-y-2 text-sm">
                  {state.openTeams.map((t) => (
                    <li key={t.id} className="flex items-center justify-between rounded border p-2">
                      <span>{t.teamName} ({t.teamId})</span>
                      <Button type="button" onClick={() => handleJoinRequest(t.teamId)}>Request</Button>
                    </li>
                  ))}
                  {!state.openTeams.length && <li className="text-slate-500">No open teams currently.</li>}
                </ul>
              </div>
            </div>
          </SectionCard>
        )}

        {state.team && (
          <>
            <SectionCard
              title="Team Management"
              right={<Badge tone={state.team.locked ? "success" : "info"}>{state.team.locked ? "Locked" : "Unlocked"}</Badge>}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <p><strong>Team Name:</strong> {state.team.teamName}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p><strong>Team ID:</strong> {state.team.teamId}</p>
                    <Button
                      type="button"
                      className="px-3 py-1 text-xs"
                      onClick={() => copyToClipboard(state.team.teamId, "Team ID copied.")}
                    >
                      Copy ID
                    </Button>
                    <Button
                      type="button"
                      className="bg-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/join/${state.team.teamId}`,
                          "Join link copied.",
                        )
                      }
                    >
                      Copy Join Link
                    </Button>
                  </div>
                  <p><strong>Members:</strong> {teamMembers.length} (min 2, max 4)</p>
                  <p><strong>Leader:</strong> {teamMembers.find((m) => m.id === state.team.leaderId)?.fullName}</p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">Members</h4>
                  <ul className="space-y-1 text-sm">
                    {teamMembers.map((member) => (
                      <li key={member.id} className="rounded border p-2">{member.fullName} ({member.email})</li>
                    ))}
                  </ul>
                </div>
              </div>
              {isLeader && (
                <div className="mt-4 flex gap-2">
                  <Button type="button" onClick={() => handleLockTeam(true)}>Lock Team</Button>
                  <Button type="button" className="bg-slate-700 hover:bg-slate-900" onClick={() => handleLockTeam(false)}>Unlock Team</Button>
                </div>
              )}
            </SectionCard>

            {isLeader && (
              <SectionCard title="Join Requests">
                <ul className="space-y-2 text-sm">
                  {state.joinRequests.map((req) => {
                    const candidate = state.users.find((u) => u.id === req.studentId);
                    return (
                      <li key={req.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2">
                        <span>{candidate?.fullName} ({candidate?.email})</span>
                        <div className="flex gap-2">
                          <Button type="button" onClick={() => handleRequestDecision(req.id, true)}>Accept</Button>
                          <Button type="button" className="bg-rose-700 hover:bg-rose-900" onClick={() => handleRequestDecision(req.id, false)}>Reject</Button>
                        </div>
                      </li>
                    );
                  })}
                  {!state.joinRequests.length && <li className="text-slate-500">No pending requests.</li>}
                </ul>
              </SectionCard>
            )}

            <SectionCard title="Problem Statement Module">
              {!hasMinTeam && <p className="mb-3 text-sm text-rose-700">Team needs at least 2 members to choose problem statement.</p>}
              {hasMinTeam && (
                <>
                  <p className="mb-2 text-sm">Current: {state.team.problemType ? `${state.team.problemType} - ${state.team.problemStatementId}` : "Not selected"}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 font-semibold">Assigned/Open Problem Statements</h4>
                      <ul className="space-y-2 text-sm">
                        {state.problems.map((p) => (
                          <li key={p.id} className="flex items-center justify-between rounded border p-2">
                            <span>{p.id}: {p.description}</span>
                            <Button type="button" onClick={() => handleSelectProblem("Assigned", p.id)}>Select</Button>
                          </li>
                        ))}
                        {!state.problems.length && <li className="text-slate-500">No admin-assigned statements yet.</li>}
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold">Open Innovation</h4>
                      <div className="flex gap-2">
                        <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={openProblemChoice} onChange={(e) => setOpenProblemChoice(e.target.value)} placeholder="Your custom idea title" />
                        <Button type="button" onClick={() => handleSelectProblem("Open Innovation", openProblemChoice || "OPEN-INNOVATION")}>Choose</Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </SectionCard>

            <SectionCard title="Round Submissions">
              <div className="mb-4 grid gap-2 md:grid-cols-2">
                {ROUNDS.map((r) => {
                  const setting = state.roundSettings[r.id] || {};
                  return (
                    <div key={r.id} className="rounded border p-2 text-sm">
                      <p className="font-semibold">{r.title}</p>
                      <p>Status: {setting.active ? "Active" : "Inactive"}</p>
                      <p>Deadline: {setting.deadline || "Not set"}</p>
                    </div>
                  );
                })}
              </div>

              {canViewR1 ? (
                <form className="mb-4 grid gap-2 rounded border p-3" onSubmit={submitR1}>
                  <h4 className="font-semibold">Round 1 (PDF/report upload metadata)</h4>
                  <Input label="PDF File Name" value={r1Payload.fileName} onChange={(e) => setR1Payload((p) => ({ ...p, fileName: e.target.value }))} required={isLeader} />
                  <Input label="PDF URL / Drive Link" value={r1Payload.fileUrl} onChange={(e) => setR1Payload((p) => ({ ...p, fileUrl: e.target.value }))} required={isLeader} />
                  <Button type="submit">Submit R1</Button>
                  {r1Submission && <p className="text-sm text-emerald-700">Submitted: {r1Submission.fileName}</p>}
                </form>
              ) : (
                <p className="mb-3 text-sm text-slate-600">Round 1 will appear when admin activates it.</p>
              )}

              {canViewR2 ? (
                <form className="grid gap-2 rounded border p-3" onSubmit={submitR2}>
                  <h4 className="font-semibold">Round 2 (GitHub repository)</h4>
                  <Input label="GitHub Repository Link" value={r2Payload.github} onChange={(e) => setR2Payload((p) => ({ ...p, github: e.target.value }))} required={isLeader} />
                  <Input label="Optional Description" value={r2Payload.description} onChange={(e) => setR2Payload((p) => ({ ...p, description: e.target.value }))} />
                  <Button type="submit">Submit R2</Button>
                  {r2Submission && <p className="text-sm text-emerald-700">Submitted: {r2Submission.github}</p>}
                </form>
              ) : (
                <p className="text-sm text-slate-600">Round 2 opens only after Round 1 submission and admin activation.</p>
              )}
            </SectionCard>

            <SectionCard title="Marks and Certificate">
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div className="space-y-1 rounded border p-3">
                  <p><strong>Team:</strong> {state.team.teamName}</p>
                  <p><strong>Round 1 Marks:</strong> {state.marks?.R1 ?? 0}/50</p>
                  <p><strong>Round 2 Marks:</strong> {state.marks?.R2 ?? 0}/50</p>
                  <p><strong>Total Marks:</strong> {state.marks?.total ?? 0}/100</p>
                </div>
                <div className="space-y-1 rounded border p-3">
                  {state.certificate ? (
                    <>
                      <p><strong>Certificate ID:</strong> {state.certificate.certificateId}</p>
                      <p><strong>Hackathon:</strong> {state.certificate.hackathonName}</p>
                      <p><strong>Issued At:</strong> {new Date(state.certificate.issuedAt).toLocaleString()}</p>
                      <Button type="button" onClick={() => window.print()}>Download / Print Certificate</Button>
                    </>
                  ) : (
                    <p>Certificate will appear after admin generates certificates.</p>
                  )}
                </div>
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </main>
  );
}
