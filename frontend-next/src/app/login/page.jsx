"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import Input from "@/components/ui/Input";
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
      /* widget loads via <Script>; init retried on send */
    }
  });

  const sendOtp = () => {
    const err = firstError([field("mobile", { label: "Mobile number", required: true, checks: [checks.mobile10] })], { mobile });
    if (err) return toast.error(err);
    const identifier = `91${mobile}`;
    const success = () => {
      setOtpSent(true);
      toast.success("OTP sent");
    };
    const failure = (e) => toast.error(`Failed to send OTP: ${e?.message || "try again"}`);
    if (window.sendOtp) window.sendOtp(identifier, success, failure);
    else if (window.initSendOTP)
      window.initSendOTP({ widgetId: WIDGET_ID, tokenAuth: TOKEN_AUTH, exposeMethods: true, identifier, success, failure });
    else toast.error("OTP service not loaded. Refresh and try again.");
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
      (e) => {
        setLoading(false);
        toast.error("OTP verification failed");
      }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-subtle p-4">
      <Script src="https://control.msg91.com/app/assets/otp-provider/otp-provider.js" strategy="afterInteractive" />
      <div className="w-full max-w-md animate-scale-in rounded-2xl border border-line bg-surface p-7 shadow-pop">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-[20px] font-semibold">Sign in to NanakFinserv</h1>
          <p className="mt-1 text-[13px] text-muted">OTP-based secure login</p>
        </div>

        <div className="space-y-4">
          <Input
            label="Mobile Number"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
            disabled={otpSent}
          />
          {otpSent && (
            <Input
              label="OTP"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
          )}
          {!otpSent ? (
            <Button className="w-full" onClick={sendOtp}>
              Send OTP
            </Button>
          ) : (
            <div className="space-y-2">
              <Button className="w-full" onClick={verifyAndLogin} loading={loading}>
                Verify & Login
              </Button>
              <button onClick={sendOtp} className="w-full text-[13px] text-brand-600 hover:underline">
                Resend OTP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
