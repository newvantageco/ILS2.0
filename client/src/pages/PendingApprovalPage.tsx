/**
 * Pending Approval Page
 *
 * Displayed to users who:
 * - Created a company that's pending platform admin approval
 * - Requested to join a company and await admin approval
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  Clock,
  Building2,
  Mail,
  LogOut,
  RefreshCw,
  CheckCircle,
  CheckCircle2,
  Info,
  MessageSquare,
  Bell,
  Loader2,
  ArrowRight,
} from "lucide-react";

const activationSteps = [
  {
    title: "Administrator review",
    description:
      "Our team verifies your organization, subscription plan, and compliance documentation.",
  },
  {
    title: "Role configuration",
    description:
      "We align your account with the correct role-based dashboard and features.",
  },
  {
    title: "Confirmation email",
    description:
      "You will receive an approval email with next steps and a direct link to your workspace.",
  },
];

const roleCapabilities = [
  {
    role: "Eye Care Professionals (ECP)",
    summary: "Clinical workspace for managing prescription orders and patient care.",
    capabilities: [
      "Create multi-step lens orders with complete patient and prescription data.",
      "Attach and preview OMA files with automated parsing for tracing and Rx validation.",
      "Track order production milestones, shipping updates, and delivery confirmations.",
      "Maintain patient histories, consult logs, and lab communication threads.",
    ],
  },
  {
    role: "Lab Technicians",
    summary: "Production operations hub for fulfillment and workflow visibility.",
    capabilities: [
      "Prioritize and advance orders through each production stage.",
      "Generate purchase orders and coordinate supplier acknowledgements.",
      "Respond to consultation requests with documented resolutions.",
      "Manage shipment details, tracking numbers, and completion notifications.",
    ],
  },
  {
    role: "Administrators",
    summary: "Governance console for user lifecycle, security, and cross-team visibility.",
    capabilities: [
      "Approve pending registrations and manage role assignments.",
      "Review organization-wide metrics covering orders and throughput.",
      "Configure settings, notification policies, and integrations.",
      "Access comprehensive audit logs and compliance reporting.",
    ],
  },
];

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Check if user is still pending - auto refresh every 30 seconds
  const { data: currentUser, refetch, isRefetching } = useQuery({
    queryKey: ["/api/auth/user"],
    refetchInterval: 30000, // Check every 30 seconds
    refetchIntervalInBackground: true,
  });

  // Redirect if approved
  useEffect(() => {
    if (currentUser?.accountStatus === "active" && currentUser?.companyId) {
      setLocation("/welcome");
    }
  }, [currentUser, setLocation]);

  const handleRefresh = async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const handleContactSupport = () => {
    window.location.href = "mailto:support@integratedlenssystem.com";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-sm bg-background/85 sticky top-0 z-50">
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

          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Status Card */}
          <Card className="border-2 shadow-xl overflow-hidden">
            <div className="h-2 bg-yellow-400" />
            <CardHeader className="text-center space-y-4 pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 mx-auto rounded-full bg-yellow-100 flex items-center justify-center"
              >
                <Clock className="w-10 h-10 text-yellow-600 animate-pulse" />
              </motion.div>
              <CardTitle className="text-2xl">Approval Pending</CardTitle>
              <CardDescription className="text-base max-w-md mx-auto">
                Thank you for signing up! Your account is currently pending administrator approval.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pb-8">
              {/* User Info */}
              <div className="p-4 rounded-xl bg-muted/50 max-w-sm mx-auto">
                <div className="flex items-center gap-3">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt=""
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {(user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex-shrink-0">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </div>

              {/* Progress */}
              <div className="max-w-sm mx-auto space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Approval Progress</span>
                  <span className="font-medium">In Review</span>
                </div>
                <Progress value={66} className="h-2" />
              </div>

              {/* Notification Info */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Bell className="w-4 h-4" />
                <span>We'll notify you at <strong>{user?.email}</strong> once approved</span>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button onClick={handleRefresh} disabled={isRefetching} className="gap-2">
                  {isRefetching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Check Status
                </Button>
                <Button variant="outline" onClick={handleContactSupport} className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* What Happens Next */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                What happens next
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {activationSteps.map((step, index) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-3 p-4 rounded-lg border bg-card/60"
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Capabilities */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Platform capabilities by role
              </CardTitle>
              <CardDescription>
                Discover what you can do once your account is approved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {roleCapabilities.map((role, index) => (
                  <motion.div
                    key={role.role}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-lg border bg-card/60 p-4"
                  >
                    <p className="font-semibold text-foreground">{role.role}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{role.summary}</p>
                    <ul className="mt-3 space-y-2 text-sm">
                      {role.capabilities.slice(0, 3).map((capability) => (
                        <li key={capability} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <span>{capability}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground space-y-2">
          <p>
            Need help? Contact us at{" "}
            <a
              href="mailto:support@integratedlenssystem.com"
              className="text-primary hover:underline"
            >
              support@integratedlenssystem.com
            </a>
          </p>
          <p>&copy; {new Date().getFullYear()} Integrated Lens System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
