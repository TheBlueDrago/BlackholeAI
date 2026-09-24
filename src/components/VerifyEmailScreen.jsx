import React, { useState } from "react";
import { Loader2, LogOut, MailCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { signOut } from "@/lib/signOut";

// Shown instead of the app to an account that signed up but never entered the code emailed to
// it. The server refuses such accounts everything (cloudflare-lib/bans.js), so this is the
// only way in: send a code, type it, and the app opens.
export default function VerifyEmailScreen({ email }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const send = async () => {
    setBusy("send");
    setErr("");
    setNote("");
    try {
      await base44.auth.resendOtp(email);
      setNote(`We sent a 6-digit code to ${email}.`);
    } catch (e) {
      setErr(e?.message || "Couldn't send the code. Try again in a minute.");
    } finally {
      setBusy("");
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setBusy("verify");
    setErr("");
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode: code });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      window.location.reload();
    } catch (e2) {
      setErr(e2?.message || "That code didn't work. Check it, or send a new one.");
      setBusy("");
    }
  };

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <form onSubmit={verify} className="w-full max-w-sm rounded-2xl bg-slate-900/80 border border-slate-700/60 p-6 text-center">
        <MailCheck className="w-10 h-10 text-sky-300 mx-auto" />
        <h1 className="mt-3 text-xl font-bold text-white">Confirm your email</h1>
        <p className="mt-2 text-sm text-slate-400">
          To keep Blackhole AI safe, every account confirms its email before using the app. Send a code to <span className="text-slate-200 break-all">{email}</span>{" "}
          and type it below.
        </p>
        <button
          type="button"
          onClick={send}
          disabled={!!busy || !email}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-slate-100 text-sm font-medium hover:bg-slate-700 disabled:opacity-60"
        >
          {busy === "send" && <Loader2 className="w-4 h-4 animate-spin" />} Send me a code
        </button>
        <div className="mt-4 flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode} autoComplete="one-time-code">
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        {note && <p className="mt-3 text-xs text-emerald-300" aria-live="polite">{note}</p>}
        {err && <p className="mt-3 text-xs text-red-300" aria-live="polite">{err}</p>}
        <button
          type="submit"
          disabled={!!busy || code.length < 6}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-[#fff] text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy === "verify" && <Loader2 className="w-4 h-4 animate-spin" />} Confirm
        </button>
        <button type="button" onClick={() => signOut()} className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </form>
    </div>
  );
}
