// src/components/reset-password-modal.tsx
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      await axios.post("/api/auth/verify-otp", data);

      setSuccessMessage("✅ Password reset successfully!");
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-[#FFD700]">
            Reset Password
          </DialogTitle>
        </DialogHeader>

        {successMessage ? (
          <div className="text-green-500 text-center font-medium">
            {successMessage}
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              {...register("email")}
              placeholder="Email"
              className="w-full bg-gray-900 text-white border border-gray-700 focus:border-[#FFD700]"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}

            <Input
              {...register("otp")}
              placeholder="OTP"
              className="w-full bg-gray-900 text-white border border-gray-700 focus:border-[#FFD700]"
            />
            {errors.otp && (
              <p className="text-sm text-red-500">{errors.otp.message}</p>
            )}

            <Input
              {...register("newPassword")}
              type="password"
              placeholder="New Password"
              className="w-full bg-gray-900 text-white border border-gray-700 focus:border-[#FFD700]"
            />
            {errors.newPassword && (
              <p className="text-sm text-red-500">{errors.newPassword.message}</p>
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

        {errorMessage && (
          <p className="text-sm text-red-600 text-center mt-2">{errorMessage}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}


