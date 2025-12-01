import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mail,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useLocation } from "wouter";
import { SiGoogle } from "react-icons/si";

export default function Login() {
  const [, setLocation] = useLocation();

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleEmailLogin = () => {
    setLocation("/email-login");
  };

  const handleBack = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <header className="border-b border-border/60 backdrop-blur-sm bg-background/85">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-bold text-xl">ILS</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Integrated Lens System</h1>
              <p className="text-xs text-muted-foreground">Enterprise Lens Management</p>
            </div>
          </div>
          <Button onClick={handleBack} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">
          <div className="space-y-8">
            {/* Sign In Header */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Sign In to ILS</h2>
              <p className="text-muted-foreground">
                Choose your authentication method to access your account
              </p>
            </div>

            {/* Authentication Options */}
            <div className="space-y-4">
              {/* Google Sign In - Featured */}
              <Card className="border-2 border-primary/60 shadow-lg shadow-primary/10 hover:border-primary/80 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                      <SiGoogle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Sign In with Google</h3>
                      <p className="text-sm text-muted-foreground">
                        Quick and secure authentication
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleGoogleLogin}
                    className="w-full gap-2 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300"
                    data-testid="button-google-login-page"
                  >
                    <SiGoogle className="h-4 w-4" />
                    Continue with Google
                  </Button>
                </CardContent>
              </Card>

              {/* Email Sign In */}
              <Card className="border-2 hover:border-primary/40 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Sign In with Email</h3>
                      <p className="text-sm text-muted-foreground">
                        Use your email and password
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleEmailLogin}
                    className="w-full gap-2 h-11"
                    data-testid="button-email-login-page"
                  >
                    <Mail className="h-4 w-4" />
                    Continue with Email
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Benefits */}
            <div className="space-y-3 pt-6 border-t border-border">
              <p className="text-sm font-semibold text-muted-foreground">Why ILS?</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Enterprise-grade security with SSO & MFA</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Real-time LIMS integration</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>AI-powered insights and automation</span>
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => setLocation("/#overview")}
                className="text-primary hover:underline font-medium"
              >
                Learn more about ILS
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-8 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">ILS</span>
              </div>
              <span className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Integrated Lens System. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
