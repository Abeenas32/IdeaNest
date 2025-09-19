"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import { useAuth } from "@/hooks/useAuth"; // ✅ import hook

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginModal = ({ open, onOpenChange }: LoginModalProps) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { register, login } = useAuth(); // ✅ use hook

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
  }, [open]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (isSignup) {
        if (password !== confirmPassword) {
          toast.error("❌ Passwords do not match");
          setPassword("");
          setConfirmPassword("");
          return;
        }
        if (password.length < 8 || password.length > 128) {
          toast.error("❌ Password must be between 8 and 128 characters");
          setPassword("");
          setConfirmPassword("");
          return;
        }

        await register(email, password, confirmPassword);
        toast.success("✅ Account created successfully!");
        setIsSignup(false); // switch to login page
      } else {
        await login(email, password);
        toast.success("✅ Logged in successfully!");
        onOpenChange(false); // close modal
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(`❌ ${err.message || "Something went wrong"}`);
      } else {
        toast.error("❌ An unexpected error occurred");
      }
    } // ✅ properly closed catch
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all" />
        <DialogContent
          className="sm:max-w-md w-[90%] mx-auto bg-gray-900/95 
                     backdrop-blur-xl border border-gray-700 
                     text-white rounded-2xl shadow-2xl 
                     p-6 sm:p-8 flex flex-col items-center justify-center"
        >
          <DialogHeader className="text-center space-y-3 w-full">
            <DialogTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isSignup ? "Create an Account ✨" : "Welcome Back 👋"}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
              {isSignup
                ? "Join Ideanest and start sharing your ideas today."
                : "Sign in to continue exploring and sharing ideas."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5 w-full">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-gray-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="8 char,1 upper and lowercase , number , special char"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-sm text-gray-300">
                  Confirm Password
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
            >
              {isSignup ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <div className="text-sm text-gray-400 text-center mt-6">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setIsSignup(false)}
                  className="text-blue-400 underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don’t have an account?{" "}
                <button
                  onClick={() => setIsSignup(true)}
                  className="text-blue-400 underline"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-left" richColors />
    </>
  );
};

export default LoginModal;
