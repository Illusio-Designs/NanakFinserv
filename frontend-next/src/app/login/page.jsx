"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { ShieldCheck, Car, HeartPulse, HandCoins } from "lucide-react";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import OtpInput from "@/components/ui/OtpInput";
import Button from "@/components/ui/Button";
import api, { showError } from "@/lib/api";
import { firstError, field, checks } from "@/utils/validators";

const WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || "3467446d494d363636363630";
const TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || "426738TclvGmDmM66a8ec44P1";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current || typeof window === "undefined" || !window.initSendOTP) return;
    try {
      window.initSendOTP({ widgetId: WIDGET_ID, tokenAuth: TOKEN_AUTH, exposeMethods: true });
      inited.current = true;
    } catch (e) {
      /* retried on send */
    }
  });

  const sendOtp = () => {
    const err = firstError([field("mobile", { label: "Mobile number", required: true, checks: [checks.mobile10] })], { mobile });
    if (err) return toast.error(err);
    const identifier = `91${mobile}`;
    // Open the OTP field immediately so it's always usable (the MSG91 widget can
    // be domain-restricted on localhost and its success callback may not fire).
    setOtpSent(true);
    const success = () => toast.success("OTP sent");
    const failure = (e) => toast.error(`Could not send OTP: ${e?.message || "check MSG91 widget / domain"}`);
    if (window.sendOtp) window.sendOtp(identifier, success, failure);
    else if (window.initSendOTP)
      window.initSendOTP({ widgetId: WIDGET_ID, tokenAuth: TOKEN_AUTH, exposeMethods: true, identifier, success, failure });
    else toast("Enter the OTP you received.", { icon: "✉️" });
  };

  const verifyAndLogin = () => {
    if (!/^\d{4,6}$/.test(otp)) return toast.error("Enter the OTP");
    setLoading(true);
    window.verifyOtp(
      otp,
      async (data) => {
        try {
          const accessToken = data?.message || data?.["access-token"] || data?.accessToken || "";
          const res = await api.post("/user/login", { mobileNumber: mobile, accessToken });
          if (res.data?.token) {
            Cookies.set("token", res.data.token, { expires: 7, sameSite: "lax" });
            Cookies.set("user", JSON.stringify(res.data.user || {}), { expires: 7, sameSite: "lax" });
            toast.success("Welcome back!");
            router.push("/dashboard");
          } else {
            toast.error("User not found. Contact your administrator.");
          }
        } catch (e) {
          showError(e, "Login failed");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        toast.error("OTP verification failed");
      }
    );
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <Script src="https://control.msg91.com/app/assets/otp-provider/otp-provider.js" strategy="afterInteractive" />

      {/* Left — dark indigo brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-white lg:flex">
        {/* glow accents */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Assets/cropped-logo.png" alt="NanakFinserv" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="text-[16px] font-semibold">NanakFinserv</div>
            <div className="text-[11px] uppercase tracking-widest text-sidebar-text/60">Production CRM</div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-[30px] font-semibold leading-tight">
            One place for loans, mediclaim, vehicle & life insurance.
          </h2>
          <p className="mt-3 text-[14px] text-sidebar-text/70">
            Onboard consumers, manage households and policies, and track renewals — fast.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              [HandCoins, "Loans"],
              [HeartPulse, "Mediclaim"],
              [Car, "Vehicle"],
              [ShieldCheck, "Life"],
            ].map(([Icon, label], i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <Icon size={18} className="text-brand-100" />
                <span className="text-[13px] font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[12px] text-sidebar-text/50">© {new Date().getFullYear()} NanakFinserv</div>
      </div>

      {/* Right — light form */}
      <div className="flex items-center justify-center bg-subtle p-6">
        <div className="w-full max-w-sm animate-scale-in">
          {/* mobile brand */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Assets/logo.png" alt="NanakFinserv" className="h-10 object-contain" />
          </div>

          <h1 className="text-[24px] font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-[13px] text-muted">Secure OTP login to your dashboard.</p>

          <div className="mt-7 space-y-4">
            <PhoneInput label="Mobile Number" value={mobile} onChange={setMobile} placeholder="10-digit mobile" />
            {otpSent && (
              <div>
                <label className="ui-label">Enter OTP</label>
                <OtpInput value={otp} onChange={setOtp} />
              </div>
            )}
            {!otpSent ? (
              <Button className="w-full" onClick={sendOtp}>Send OTP</Button>
            ) : (
              <div className="space-y-2">
                <Button className="w-full" onClick={verifyAndLogin} loading={loading}>Verify & Login</Button>
                <button onClick={sendOtp} className="w-full text-[13px] font-medium text-brand-600 hover:underline">
                  Resend OTP
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
