import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import SectionCard from "../../components/common/SectionCard";
import { useAuth } from "../../context/AuthContext";
import { mockDb } from "../../services/mockDb";
import { ROUNDS } from "../../utils/constants";
import { normalizeTeamId } from "../../utils/validators";

function downloadCsv(rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => `"${String(row[h]).replaceAll('"', '""')}"`).join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "marks_verification.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState({
    metrics: {},
    users: [],
    teams: [],
    submissions: [],
    marks: [],
    verificationRows: [],
    roundSettings: {},
    problems: [],
  });

  const [problemForm, setProblemForm] = useState({ id: "", description: "", pdfUrl: "" });
  const [assignForm, setAssignForm] = useState({ teamId: "", problemId: "" });
  const [notification, setNotification] = useState({ target: "all-teams", message: "" });
  const [marksForm, setMarksForm] = useState({ teamDbId: "", roundId: "R1", marks: 0 });
  const [roundForm, setRoundForm] = useState({ roundId: "R1", active: true, deadline: "" });
  const [message, setMessage] = useState("");

  function reload() {
    const users = mockDb.getUsers();
    const teams = users.length ? mockDb.listOpenTeams().concat([]) : [];

    const allTeams = (() => {
      const dbUsers = mockDb.getUsers();
      const teamMap = new Map();
      dbUsers.forEach((u) => {
        const t = mockDb.getTeamByUser(u.id);
        if (t) teamMap.set(t.id, t);
      });
      return Array.from(teamMap.values());
    })();

    setState({
      metrics: mockDb.getAdminMetrics(),
      users,
      teams: allTeams,
      submissions: mockDb.getSubmissions(),
      marks: mockDb.getMarks(),
      verificationRows: mockDb.getVerificationRows(),
      roundSettings: mockDb.getRoundSettings(),
      problems: mockDb.getProblemStatements(),
    });
  }

  useEffect(() => {
    reload();
  }, []);

  const studentsWithoutTeam = useMemo(
    () => state.users.filter((u) => u.role === "student" && !u.teamId),
    [state.users],
  );

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  function saveProblemStatement(e) {
    e.preventDefault();
    mockDb.upsertProblemStatement(problemForm);
    setMessage("Problem statement saved.");
    setProblemForm({ id: "", description: "", pdfUrl: "" });
    reload();
  }

  function assignProblem(e) {
    e.preventDefault();
    const normalizedTeamId = normalizeTeamId(assignForm.teamId);
    const team = state.teams.find((t) => normalizeTeamId(t.teamId) === normalizedTeamId);
    if (!team) return setMessage("Team ID not found.");
    mockDb.assignProblemToTeam(team.id, assignForm.problemId, "Assigned");
    mockDb.createNotification({
      type: "problem-assignment",
      target: `team:${team.teamId}`,
      message: `You have been allotted Problem Statement ID: ${assignForm.problemId}`,
    });
    setMessage("Problem assigned and notification stored.");
    setAssignForm({ teamId: "", problemId: "" });
    reload();
  }

  function updateRound(e) {
    e.preventDefault();
    mockDb.setRoundSettings(roundForm.roundId, {
      active: roundForm.active,
      deadline: roundForm.deadline,
    });
    setMessage("Round settings updated.");
    reload();
  }

  function giveMarks(e) {
    e.preventDefault();
    mockDb.setMarks(marksForm.teamDbId, marksForm.roundId, marksForm.marks);
    setMessage("Marks updated.");
    reload();
  }

  function sendNotification(e) {
    e.preventDefault();
    mockDb.createNotification({
      type: "manual",
      target: notification.target,
      message: notification.message,
    });
    setMessage("Notification queued.");
    setNotification({ target: "all-teams", message: "" });
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-600">Signed in as {user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" className="bg-emerald-700 hover:bg-emerald-900" onClick={() => { mockDb.generateCertificates(); setMessage("Certificates generated."); reload(); }}>Generate Certificates</Button>
            <Button onClick={handleLogout}>Logout</Button>
          </div>
        </header>

        {message && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}

        <SectionCard title="Dashboard Metrics">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Metric title="Total Students" value={state.metrics.totalStudents || 0} />
            <Metric title="Total Teams" value={state.metrics.totalTeams || 0} />
            <Metric title="Without Team" value={state.metrics.studentsWithoutTeam || 0} />
            <Metric title="Completed Teams" value={state.metrics.completedTeams || 0} />
            <Metric title="R1 Submissions" value={state.metrics.submissionsR1 || 0} />
            <Metric title="R2 Submissions" value={state.metrics.submissionsR2 || 0} />
          </div>
        </SectionCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Problem Statement Distribution">
            <form className="space-y-3" onSubmit={saveProblemStatement}>
              <Input label="Problem Statement ID" value={problemForm.id} onChange={(e) => setProblemForm((p) => ({ ...p, id: e.target.value }))} required />
              <Input label="Description" value={problemForm.description} onChange={(e) => setProblemForm((p) => ({ ...p, description: e.target.value }))} required />
              <Input label="PDF URL" value={problemForm.pdfUrl} onChange={(e) => setProblemForm((p) => ({ ...p, pdfUrl: e.target.value }))} />
              <Button type="submit">Upload Problem Statement</Button>
            </form>
            <ul className="mt-3 space-y-2 text-sm">
              {state.problems.map((p) => (
                <li key={p.id} className="rounded border p-2">{p.id}: {p.description}</li>
              ))}
            </ul>
            <form className="mt-4 space-y-3 rounded border p-3" onSubmit={assignProblem}>
              <Input label="Team ID" value={assignForm.teamId} onChange={(e) => setAssignForm((p) => ({ ...p, teamId: e.target.value }))} required />
              <Input label="Problem ID" value={assignForm.problemId} onChange={(e) => setAssignForm((p) => ({ ...p, problemId: e.target.value }))} required />
              <Button type="submit">Assign to Team + Email Notification</Button>
            </form>
          </SectionCard>

          <SectionCard title="Round Management">
            <form className="grid gap-3" onSubmit={updateRound}>
              <label className="text-sm font-medium">Round
                <select className="mt-1 w-full rounded border px-3 py-2" value={roundForm.roundId} onChange={(e) => setRoundForm((p) => ({ ...p, roundId: e.target.value }))}>
                  {ROUNDS.map((r) => <option key={r.id} value={r.id}>{r.id}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={roundForm.active} onChange={(e) => setRoundForm((p) => ({ ...p, active: e.target.checked }))} />
                Round Active
              </label>
              <Input label="Deadline" type="datetime-local" value={roundForm.deadline} onChange={(e) => setRoundForm((p) => ({ ...p, deadline: e.target.value }))} />
              <Button type="submit">Save Round Settings</Button>
            </form>
            <div className="mt-3 grid gap-2 text-sm">
              {Object.entries(state.roundSettings).map(([id, cfg]) => (
                <div key={id} className="rounded border p-2">
                  <div className="flex items-center justify-between">
                    <strong>{id}</strong>
                    <Badge tone={cfg.active ? "success" : "danger"}>{cfg.active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p>Deadline: {cfg.deadline || "Not set"}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Evaluation and Marks">
            <form className="space-y-2 rounded border p-3" onSubmit={giveMarks}>
              <label className="text-sm font-medium">Team
                <select className="mt-1 w-full rounded border px-3 py-2" value={marksForm.teamDbId} onChange={(e) => setMarksForm((p) => ({ ...p, teamDbId: e.target.value }))} required>
                  <option value="">Select team</option>
                  {state.teams.map((t) => <option key={t.id} value={t.id}>{t.teamName} ({t.teamId})</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Round
                <select className="mt-1 w-full rounded border px-3 py-2" value={marksForm.roundId} onChange={(e) => setMarksForm((p) => ({ ...p, roundId: e.target.value }))}>
                  {ROUNDS.map((r) => <option key={r.id} value={r.id}>{r.id}</option>)}
                </select>
              </label>
              <Input label="Marks" type="number" min="0" max="50" value={marksForm.marks} onChange={(e) => setMarksForm((p) => ({ ...p, marks: Number(e.target.value) }))} required />
              <Button type="submit">Save Marks</Button>
            </form>
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Team</th>
                    <th className="p-2">R1</th>
                    <th className="p-2">R2</th>
                    <th className="p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {state.marks.map((m) => {
                    const team = state.teams.find((t) => t.id === m.teamDbId);
                    return (
                      <tr key={m.id} className="border-b">
                        <td className="p-2">{team?.teamName || "Unknown"}</td>
                        <td className="p-2">{m.R1}</td>
                        <td className="p-2">{m.R2}</td>
                        <td className="p-2 font-semibold">{m.total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Email Notifications">
            <form className="space-y-3" onSubmit={sendNotification}>
              <label className="text-sm font-medium">Target Group
                <select className="mt-1 w-full rounded border px-3 py-2" value={notification.target} onChange={(e) => setNotification((p) => ({ ...p, target: e.target.value }))}>
                  <option value="students-without-team">Students without team</option>
                  <option value="all-teams">All teams</option>
                  <option value="specific-team">Specific team</option>
                  <option value="selected-students">Selected students</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">Message
                <textarea className="rounded border px-3 py-2" rows="4" value={notification.message} onChange={(e) => setNotification((p) => ({ ...p, message: e.target.value }))} required />
              </label>
              <Button type="submit">Queue Email</Button>
            </form>
            <div className="mt-3 rounded border p-3 text-sm">
              <p className="font-semibold">Students without team ({studentsWithoutTeam.length})</p>
              <ul className="mt-2 space-y-1">
                {studentsWithoutTeam.map((s) => <li key={s.id}>{s.fullName} - {s.email}</li>)}
                {!studentsWithoutTeam.length && <li className="text-slate-500">None</li>}
              </ul>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Marks Verification List"
          right={<Button type="button" onClick={() => downloadCsv(state.verificationRows)}>Export CSV</Button>}
        >
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Student Name</th>
                  <th className="p-2">Student ID</th>
                  <th className="p-2">Team Name</th>
                  <th className="p-2">Round 1</th>
                  <th className="p-2">Round 2</th>
                  <th className="p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {state.verificationRows.map((row) => (
                  <tr key={row.studentId} className="border-b">
                    <td className="p-2">{row.studentName}</td>
                    <td className="p-2">{row.studentId.slice(0, 8)}</td>
                    <td className="p-2">{row.teamName}</td>
                    <td className="p-2">{row.R1}</td>
                    <td className="p-2">{row.R2}</td>
                    <td className="p-2 font-semibold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Submissions">
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Team</th>
                  <th className="p-2">Round</th>
                  <th className="p-2">Payload</th>
                </tr>
              </thead>
              <tbody>
                {state.submissions.map((s) => {
                  const team = state.teams.find((t) => t.id === s.teamDbId);
                  return (
                    <tr key={s.id} className="border-b align-top">
                      <td className="p-2">{team?.teamName || "Unknown"}</td>
                      <td className="p-2">{s.roundId}</td>
                      <td className="p-2 text-xs whitespace-pre-wrap">{JSON.stringify(s, null, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}

function Metric({ title, value }) {
  return (
    <div className="rounded border bg-slate-50 p-3 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-brand-900">{value}</p>
    </div>
  );
}
