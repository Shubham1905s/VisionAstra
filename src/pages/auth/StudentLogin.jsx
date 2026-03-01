import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Captcha from "../../components/common/Captcha";
import { useAuth } from "../../context/AuthContext";

export default function StudentLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", captchaAnswer: "" });
  const [captchaText, setCaptchaText] = useState("");
  const [status, setStatus] = useState("");

  const handleCaptchaChange = useCallback((text) => setCaptchaText(text), []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    if (form.captchaAnswer !== captchaText) return setStatus("Captcha is incorrect.");

    try {
      await login({ email: form.email, password: form.password, role: "student" });
      navigate("/student/dashboard");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <form className="space-y-4 rounded-xl bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold text-brand-900">Student Login</h2>
      <Input label="College Email ID" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
      <Input label="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
      <Captcha
        value={form.captchaAnswer}
        onChange={(e) => setForm((p) => ({ ...p, captchaAnswer: e.target.value }))}
        onCaptchaChange={handleCaptchaChange}
      />
      {status && <p className="text-sm text-rose-700">{status}</p>}
      <Button type="submit">Login</Button>
    </form>
  );
}
