import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · AURIQ Gold Insights" },
      { name: "description", content: "Sign in to access the AURIQ gold intelligence workspace." },
      { property: "og:title", content: "Sign in · AURIQ Gold Insights" },
      { property: "og:description", content: "Access the AURIQ gold intelligence workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { configured, loading, session, signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<"signIn" | "signUp" | "forgot">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) void navigate({ to: "/", replace: true });
  }, [navigate, session]);

  function switchMode(next: "signIn" | "signUp" | "forgot") {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const message = await signIn(email.trim(), password);
    setSubmitting(false);
    if (message) setError(message);
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร / Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("รหัสผ่านไม่ตรงกัน / Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const result = await signUp(email.trim(), password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else if (!result.confirmed) {
      setNotice("สมัครสำเร็จ! กรุณายืนยันอีเมลจากลิงก์ที่ส่งไป แล้วกลับมาเข้าสู่ระบบ / Check your email to confirm your account.");
    }
  }

  async function handleForgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    const message = await resetPassword(email.trim());
    setSubmitting(false);
    if (message) {
      setError(message);
    } else {
      setNotice("ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว กรุณาตรวจสอบอีเมลของคุณ / Reset link sent — check your email.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <section className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-2xl">
        <p className="text-sm font-semibold tracking-[0.2em] text-primary">AURIQ</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">
          {mode === "signIn"
            ? "เข้าสู่ระบบ / Sign in"
            : mode === "signUp"
              ? "สมัครสมาชิก / Create account"
              : "ลืมรหัสผ่าน / Forgot password"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Paper Trading · Read-only portfolio access
        </p>

        {!configured ? (
          <p className="mt-6 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            Supabase ยังไม่ได้ตั้งค่า ระบบจึงอยู่ใน Demo Mode
          </p>
        ) : mode === "signIn" ? (
          <form className="mt-6 space-y-4" onSubmit={handleSignIn}>
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล / Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">รหัสผ่าน / Password</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => switchMode("forgot")}
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-negative">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={loading || submitting}>
              {submitting ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ยังไม่มีบัญชี?{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => switchMode("signUp")}
              >
                สมัครสมาชิก / Sign up
              </button>
            </p>
          </form>
        ) : mode === "signUp" ? (
          <form className="mt-6 space-y-4" onSubmit={handleSignUp}>
            <div className="space-y-2">
              <Label htmlFor="signup-email">อีเมล / Email</Label>
              <Input id="signup-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">รหัสผ่าน / Password</Label>
              <Input id="signup-password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm">ยืนยันรหัสผ่าน / Confirm password</Label>
              <Input id="signup-confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
            </div>
            {error ? <p className="text-sm text-negative">{error}</p> : null}
            {notice ? <p className="text-sm text-positive">{notice}</p> : null}
            <Button className="w-full" type="submit" disabled={loading || submitting}>
              {submitting ? "กำลังสมัคร…" : "สมัครสมาชิก"}
            </Button>
            <Button className="w-full" type="button" variant="ghost" onClick={() => switchMode("signIn")}>
              มีบัญชีแล้ว? เข้าสู่ระบบ / Back to sign in
            </Button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleForgot}>
            <p className="text-sm text-muted-foreground">
              กรอกอีเมลที่ใช้สมัคร ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่
              <br />
              Enter your account email and we will send a password reset link.
            </p>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">อีเมล / Email</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-negative">{error}</p> : null}
            {notice ? <p className="text-sm text-positive">{notice}</p> : null}
            <Button className="w-full" type="submit" disabled={loading || submitting}>
              {submitting ? "กำลังส่งลิงก์…" : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
            </Button>
            <Button
              className="w-full"
              type="button"
              variant="ghost"
              onClick={() => switchMode("signIn")}
            >
              กลับไปเข้าสู่ระบบ / Back to sign in
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
