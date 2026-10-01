import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password · AURIQ Gold Insights" },
      { name: "description", content: "Set a new password for your AURIQ account." },
      { property: "og:title", content: "Reset password · AURIQ Gold Insights" },
      { property: "og:description", content: "Set a new password for your AURIQ account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { configured, session, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // The recovery link carries #type=recovery; the auth client consumes it and
  // restores a temporary session. Without a session the link is invalid/expired.
  const recoverySession = Boolean(session);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => void navigate({ to: "/", replace: true }), 1500);
    return () => clearTimeout(timer);
  }, [navigate, success]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร / Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน / Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const message = await updatePassword(password);
    setSubmitting(false);
    if (message) {
      setError(message);
    } else {
      setSuccess(true);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <section className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-2xl">
        <p className="text-sm font-semibold tracking-[0.2em] text-primary">AURIQ</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">
          ตั้งรหัสผ่านใหม่ / Set a new password
        </h1>

        {!configured ? (
          <p className="mt-6 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            Supabase ยังไม่ได้ตั้งค่า ระบบจึงอยู่ใน Demo Mode
          </p>
        ) : !recoverySession ? (
          <p className="mt-6 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            ลิงก์นี้ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่จากหน้าเข้าสู่ระบบ
            <br />
            This link is invalid or expired. Request a new one from the sign-in page.
          </p>
        ) : success ? (
          <p className="mt-6 rounded-md border border-positive/40 bg-positive/10 p-3 text-sm text-positive">
            ตั้งรหัสผ่านใหม่สำเร็จ กำลังนำคุณกลับเข้าระบบ…
            <br />
            Password updated. Taking you back to the app…
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="new-password">รหัสผ่านใหม่ / New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่ / Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-negative">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
