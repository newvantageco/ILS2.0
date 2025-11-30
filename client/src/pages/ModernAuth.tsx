/**
 * Modern Authentication Page
 *
 * Design Principles:
 * - Clean, minimal aesthetic inspired by Linear/Notion
 * - Unified login/signup experience
 * - Subtle animations and micro-interactions
 * - Progressive disclosure for complexity
 * - Focus on clarity and trust
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { setAuthTokens } from "@/lib/api";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Zap,
  Check,
  Loader2,
  User,
  Building2,
} from "lucide-react";
import { SiGoogle } from "react-icons/si";

type AuthMode = "login" | "signup" | "forgot-password";

interface AuthFormProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

// Trust indicators
const trustPoints = [
  { icon: Shield, text: "HIPAA Compliant" },
  { icon: Zap, text: "Enterprise Security" },
  { icon: Sparkles, text: "AI-Powered Platform" },
];

function AuthForm({ mode, onModeChange }: AuthFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const response = await apiRequest("POST", "/api/auth/login-email", {
          email,
          password,
        });
        const data = (await response.json()) as {
          message: string;
          user: any;
          accessToken?: string;
          refreshToken?: string;
          expiresIn?: number;
        };

        // Store JWT tokens if returned
        if (data.accessToken && data.refreshToken && data.expiresIn) {
          setAuthTokens(data.accessToken, data.refreshToken, data.expiresIn);
        }

        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

        toast({
          title: "Welcome back",
          description: "You've been signed in successfully",
        });

        // Redirect based on account status and role
        const user = data.user;

        if (user.accountStatus === "pending") {
          setLocation("/pending-approval");
        } else if (user.accountStatus === "suspended") {
          setLocation("/account-suspended");
        } else {
          setLocation("/welcome");
        }
      } else if (mode === "signup") {
        if (password !== confirmPassword) {
          toast({
            title: "Passwords don't match",
            description: "Please make sure your passwords match",
            variant: "destructive",
          });
          return;
        }

        const response = await apiRequest("POST", "/api/auth/signup-email", {
          email,
          password,
          name,
        });
        const data = await response.json();

        toast({
          title: "Account created",
          description: "Please check your email to verify your account",
        });

        onModeChange("login");
      } else if (mode === "forgot-password") {
        await apiRequest("POST", "/api/auth/forgot-password", { email });

        toast({
          title: "Reset email sent",
          description: "Check your email for password reset instructions",
        });

        onModeChange("login");
      }
    } catch (error: any) {
      toast({
        title: mode === "login" ? "Sign in failed" : "Request failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          {mode === "login" && "Welcome back"}
          {mode === "signup" && "Create your account"}
          {mode === "forgot-password" && "Reset password"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {mode === "login" && "Sign in to continue to your workspace"}
          {mode === "signup" && "Start your free trial today"}
          {mode === "forgot-password" &&
            "We'll send you a link to reset your password"}
        </p>
      </div>

      {/* OAuth Buttons */}
      {mode !== "forgot-password" && (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 mb-4 relative overflow-hidden group"
            onClick={handleGoogleLogin}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <SiGoogle className="w-4 h-4 mr-2" />
            Continue with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or continue with email
              </span>
            </div>
          </div>
        </>
      )}

      {/* Email Form */}
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="pl-10 h-11"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 h-11"
              disabled={isLoading}
              data-testid="input-email"
            />
          </div>
        </div>

        {mode !== "forgot-password" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => onModeChange("forgot-password")}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="pl-10 pr-10 h-11"
                disabled={isLoading}
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="pl-10 h-11"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11"
          disabled={isLoading}
          data-testid="button-submit"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {mode === "login" && "Signing in..."}
              {mode === "signup" && "Creating account..."}
              {mode === "forgot-password" && "Sending..."}
            </>
          ) : (
            <>
              {mode === "login" && "Sign in"}
              {mode === "signup" && "Create account"}
              {mode === "forgot-password" && "Send reset link"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Mode Switch */}
      <div className="mt-6 text-center text-sm">
        {mode === "login" && (
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={() => onModeChange("signup")}
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
        )}
        {mode === "signup" && (
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => onModeChange("login")}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        )}
        {mode === "forgot-password" && (
          <button
            onClick={() => onModeChange("login")}
            className="text-primary hover:underline font-medium inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}

export default function ModernAuth() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <button
            onClick={() => setLocation("/modern")}
            className="flex items-center gap-2 mb-12 group"
          >
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
              <span className="text-primary-foreground font-bold text-sm">
                ILS
              </span>
            </div>
            <span className="font-semibold text-lg">Integrated Lens System</span>
          </button>

          <AuthForm mode={mode} onModeChange={setMode} />

          {/* Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex items-center justify-center gap-6">
              {trustPoints.map((point, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <point.icon className="w-3.5 h-3.5" />
                  <span>{point.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative flex flex-col justify-center px-12 py-12">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Trusted by 500+ practices
            </div>

            <h2 className="text-3xl font-bold tracking-tight mb-4">
              The complete platform for modern optical practices
            </h2>

            <p className="text-muted-foreground mb-8">
              Streamline your operations with AI-powered lens management,
              clinical workflows, and business intelligence—all in one unified
              platform.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {[
                "Complete EHR integration",
                "Real-time inventory tracking",
                "AI-powered demand forecasting",
                "Automated patient communications",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="mt-12 p-6 rounded-xl bg-background/50 backdrop-blur-sm border border-border">
              <p className="text-sm italic mb-4">
                "ILS has transformed how we manage our practice. The AI
                insights alone have helped us reduce waste by 30% and improve
                patient satisfaction scores significantly."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm">Dr. Sarah Mitchell</div>
                  <div className="text-xs text-muted-foreground">
                    Vision Care Associates
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
