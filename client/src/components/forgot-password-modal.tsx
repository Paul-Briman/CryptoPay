import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email(),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type EmailForm = z.infer<typeof emailSchema>;
type OtpForm = z.infer<typeof otpSchema>;

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordModal({
  open,
  onOpenChange,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const otpInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    reset: resetEmailForm,
    formState: { errors: emailErrors },
  } = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    reset: resetOtpForm,
    formState: { errors: otpErrors },
  } = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  useEffect(() => {
    if (step === "otp" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  useEffect(() => {
    if (!open) {
      resetEmailForm();
      resetOtpForm();
      setStep("email");
      setEmail("");
      setMessage("");
      setError("");
    }
  }, [open, resetEmailForm, resetOtpForm]);

  const sendOtp = async ({ email }: EmailForm) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEmail(email);
      setMessage("OTP sent to your email.");
      resetEmailForm(); // Clear email input
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndReset = async ({ otp, newPassword }: OtpForm) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage("✅ Password reset successfully!");
      setStep("email");
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-[#FFD700]">
            {step === "email" ? "Forgot Password" : "Reset Password"}
          </DialogTitle>
        </DialogHeader>

        {step === "email" ? (
          <form
            onSubmit={handleEmailSubmit(sendOtp)}
            autoComplete="new-password"
            className="space-y-4"
          >
            <Input
              placeholder="Enter your email"
              {...registerEmail("email")}
              className="w-full bg-gray-900 text-white border border-gray-700 focus:border-[#FFD700]"
            />
            {emailErrors.email && (
              <p className="text-sm text-red-500">
                {emailErrors.email.message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#FFD700] text-black hover:bg-[#e6c200]"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Send OTP"
              )}
            </Button>
          </form>
        ) : (
          <form
            autoComplete="new-password"
            onSubmit={handleOtpSubmit(verifyOtpAndReset)}
            className="space-y-4"
          >
            <Input
              placeholder="Enter OTP"
              {...registerOtp("otp")}
              ref={(el) => {
                otpInputRef.current = el;
                // @ts-ignore
                registerOtp("otp").ref?.(el);
              }}
              className="w-full bg-gray-900 text-white border border-gray-700 focus:border-[#FFD700]"
            />
            {otpErrors.otp && (
              <p className="text-sm text-red-500">{otpErrors.otp.message}</p>
            )}

            <Input
              type="password"
              placeholder="New password"
              autoComplete="off"
              {...registerOtp("newPassword")}
              className="w-full bg-gray-900 text-white border border-gray-700 focus:border-[#FFD700]"
            />
            {otpErrors.newPassword && (
              <p className="text-sm text-red-500">
                {otpErrors.newPassword.message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#FFD700] text-black hover:bg-[#e6c200]"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        )}

        {message && (
          <p className="text-sm text-green-500 text-center mt-2">{message}</p>
        )}
        {error && (
          <p className="text-sm text-red-600 text-center mt-2">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

