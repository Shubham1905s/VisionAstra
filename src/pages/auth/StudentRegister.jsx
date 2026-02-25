import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { mockDb } from "../../services/mockDb";
import { createCaptcha, isCollegeEmail, validatePassword } from "../../utils/validators";

export default function StudentRegisterPage() {
  const { sendOtp, registerStudent } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    otp: "",
    captchaAnswer: "",
  });
  const [status, setStatus] = useState("");
  const [otpPreview, setOtpPreview] = useState("");

  const captcha = useMemo(() => createCaptcha(), []);

  function onChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSendOtp() {
    if (!isCollegeEmail(form.email)) {
      setStatus("Enter a valid college email ID (.edu expected).");
      return;
    }
    const otp = await sendOtp(form.email);
    setOtpPreview(otp);
    setStatus("OTP sent to your email. (Dev preview is shown below)");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");

    if (!isCollegeEmail(form.email)) return setStatus("Use a valid college email ID.");
    if (!validatePassword(form.password)) return setStatus("Password must be at least 8 characters.");
    if (form.password !== form.confirmPassword) return setStatus("Passwords do not match.");
    if (form.captchaAnswer !== captcha.answer) return setStatus("Captcha answer is incorrect.");
    if (!mockDb.verifyOtp(form.email, form.otp)) return setStatus("OTP is invalid.");

    try {
      await registerStudent({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      setStatus("Registration successful. Please login.");
      navigate("/student/login");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <form className="space-y-4 rounded-xl bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold text-brand-900">Student Account Creation</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Full Name" value={form.fullName} onChange={(e) => onChange("fullName", e.target.value)} required />
        <Input label="College Email ID" type="email" value={form.email} onChange={(e) => onChange("email", e.target.value)} required />
        <Input label="Mobile Number" value={form.phone} onChange={(e) => onChange("phone", e.target.value)} required />
        <Input label="New Password" type="password" value={form.password} onChange={(e) => onChange("password", e.target.value)} required />
        <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => onChange("confirmPassword", e.target.value)} required />
        <div className="flex items-end">
          <Button type="button" className="w-full" onClick={handleSendOtp}>Send OTP</Button>
        </div>
        <Input label="OTP" value={form.otp} onChange={(e) => onChange("otp", e.target.value)} required />
        <Input label={`Captcha: ${captcha.question}`} value={form.captchaAnswer} onChange={(e) => onChange("captchaAnswer", e.target.value)} required />
      </div>
      {otpPreview && <p className="text-sm text-blue-700">Dev OTP Preview: {otpPreview}</p>}
      {status && <p className="text-sm text-rose-700">{status}</p>}
      <Button type="submit">Create Account</Button>
    </form>
  );
}
 