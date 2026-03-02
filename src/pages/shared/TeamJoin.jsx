import { Link, useParams } from "react-router-dom";
import { mockDb } from "../../services/mockDb";
import { normalizeTeamId } from "../../utils/validators";

export default function TeamJoinPage() {
  const { teamId = "" } = useParams();
  const normalizedTeamId = normalizeTeamId(teamId);
  const team = mockDb.getTeamById(normalizedTeamId);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-6">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">Join Team</h1>
        <p className="mt-2 text-sm text-slate-600">Shared Team ID: <strong>{normalizedTeamId || "-"}</strong></p>

        {team ? (
          <div className="mt-5 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p><strong>Team Name:</strong> {team.teamName}</p>
            <p><strong>Current Members:</strong> {team.memberIds.length}</p>
            <p><strong>Status:</strong> {team.locked ? "Locked" : "Open"}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                to={`/student/login?teamId=${encodeURIComponent(normalizedTeamId)}`}
                className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-900"
              >
                Login to Join
              </Link>
              <Link
                to="/student/register"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-100"
              >
                Create Account
              </Link>
            </div>
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            Team ID not found. Verify the shared ID and try again.
          </p>
        )}
      </div>
    </main>
  );
}
