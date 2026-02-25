import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { createCaptcha } from "../../utils/validators";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", phone: "", name: "", captchaAnswer: "" });
  const [status, setStatus] = useState("");
  const captcha = useMemo(() => createCaptcha(), []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.captchaAnswer !== captcha.answer) return setStatus("Captcha is incorrect.");

    try {
      await login({ email: form.email, password: form.password, role: "admin" });
      navigate("/admin/dashboard");
    } catch (error) {
      setStatus(error.message);
    }
  }
 
  return (
    <form className="space-y-4 rounded-xl bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold text-brand-900">Admin Login</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Display only" />
        <Input label="Phone Number" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Display only" />
      </div>
      <Input label="Admin Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
      <Input label="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
      <Input label={`Captcha: ${captcha.question}`} value={form.captchaAnswer} onChange={(e) => setForm((p) => ({ ...p, captchaAnswer: e.target.value }))} required />
      <p className="text-xs text-slate-500">Default seeded admin: admin@visionastra.edu / Admin@123</p>
      {status && <p className="text-sm text-rose-700">{status}</p>}
      <Button type="submit">Admin Login</Button>
    </form>
  );
}
