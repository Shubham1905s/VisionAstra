import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const highlights = [
  {
    title: "Create Team",
    text: "Leaders can create teams instantly and share team IDs.",
  },
  {
    title: "Join by ID",
    text: "Any participant can open a shared team link and request access.",
  },
  {
    title: "Track Rounds",
    text: "Submission windows, marks, and certificates are managed in one place.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_40%,_#e2e8f0_100%)] px-6 py-10">

      {/* floating background blobs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl animate-pulse"></div>
      <div className="absolute top-40 -right-32 h-96 w-96 rounded-full bg-purple-300/30 blur-3xl animate-pulse"></div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-6xl space-y-10"
      >

        {/* HERO */}
        <motion.header
          variants={item}
          className="rounded-3xl border border-white/70 bg-white/80 p-10 shadow-xl shadow-slate-300/40 backdrop-blur"
        >
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold tracking-wide text-brand-900"
          >
            VisionAstra 2026
          </motion.p>

          <h1 className="mt-4 text-4xl font-black leading-tight text-slate-900 md:text-5xl">
            A centralized platform for team formation, submissions, and result
            management.
          </h1>

          <p className="mt-4 max-w-2xl text-sm text-slate-700 md:text-base">
            Create leader accounts, generate shareable team IDs, and manage the
            full hackathon flow across students and admins.
          </p>

          <div className="mt-7 flex flex-wrap gap-4">

            <Link
              to="/student/register"
              className="transform rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-brand-900 hover:shadow-xl"
            >
              Create Leader Account
            </Link>

            <Link
              to="/student/login"
              className="transform rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-100 hover:shadow-md"
            >
              Student Login
            </Link>

            <Link
              to="/admin/login"
              className="transform rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-100 hover:shadow-md"
            >
              Admin Login
            </Link>

          </div>
        </motion.header>

        {/* FEATURE CARDS */}
        <motion.section
          variants={container}
          className="grid gap-6 md:grid-cols-3"
        >
          {highlights.map((itemData) => (
            <motion.article
              key={itemData.title}
              variants={item}
              whileHover={{ y: -8, scale: 1.03 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition"
            >
              <h2 className="text-lg font-bold text-slate-900">
                {itemData.title}
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                {itemData.text}
              </p>
            </motion.article>
          ))}
        </motion.section>

      </motion.div>
    </main>
  );
}