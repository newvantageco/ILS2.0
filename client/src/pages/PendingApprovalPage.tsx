import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, LogOut } from "lucide-react";

const activationSteps = [
  {
    title: "Administrator review",
    description:
      "Our onboarding team verifies your organization, subscription plan, and any compliance documentation provided during signup.",
  },
  {
    title: "Role configuration",
    description:
      "We align your account with the correct role-based dashboard and ensure the appropriate feature set is provisioned for your team.",
  },
  {
    title: "Confirmation email",
    description:
      "You will receive an approval email with next steps, support resources, and a direct link to launch your personalized workspace.",
  },
];

const roleCapabilities = [
  {
    role: "Eye Care Professionals (ECP)",
    summary: "Clinical-side workspace for submitting and managing prescription orders.",
    capabilities: [
      "Create multi-step lens orders with complete patient and prescription data entry.",
      "Attach and preview OMA files with automated parsing for tracing and Rx validation.",
      "Track order production milestones, shipping updates, and delivery confirmations.",
      "Maintain patient histories, consult logs, and lab communication threads.",
    ],
  },
  {
    role: "Lab Technicians",
    summary: "Production operations hub focused on fulfillment and workflow visibility.",
    capabilities: [
      "Prioritize and advance orders through each production stage using the lab dashboard.",
      "Generate purchase orders for materials and coordinate supplier acknowledgements.",
      "Respond to consultation requests with documented resolutions and follow-up notes.",
      "Manage shipment details, tracking numbers, and completion notifications for ECPs.",
    ],
  },
  {
    role: "Engineers",
    summary: "Engineering insights for equipment readiness and advanced troubleshooting.",
    capabilities: [
      "Access data aggregation views that surface equipment diagnostics and maintenance alerts.",
      "Collaborate on corrective action plans tied to specific orders or production lines.",
      "Review technical documentation and compliance artifacts linked to critical components.",
      "Provide engineering feedback directly within order and consultation workflows.",
    ],
  },
  {
    role: "Suppliers",
    summary: "Vendor portal for material fulfillment and documentation control.",
    capabilities: [
      "Receive purchase orders with line-item detail and acknowledge fulfillment timelines.",
      "Upload certificates, SDS, and compliance documentation to keep lab records current.",
      "Maintain organization profiles, contacts, and delivery preferences across locations.",
      "Monitor shipment status updates shared by the lab once materials are in transit.",
    ],
  },
  {
    role: "Administrators",
    summary: "Governance console for user lifecycle, security, and cross-team visibility.",
    capabilities: [
      "Approve pending registrations, activate suspended accounts, and manage role assignments.",
      "Review organization-wide metrics covering orders, users, and operational throughput.",
      "Configure organization settings, notification policies, and integration preferences.",
      "Impersonate or switch roles when assisting users with support escalations.",
    ],
  },
];

export default function PendingApprovalPage() {
  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account registration is being reviewed by our administrators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Thank you for signing up! Your account is currently pending approval. 
              You'll receive an email notification once an administrator reviews and 
              activates your account.
            </p>
          </div>
          <section aria-labelledby="activation-steps" className="space-y-3">
            <h3 id="activation-steps" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What happens next
            </h3>
            <ol className="space-y-3">
              {activationSteps.map((step, index) => (
                <li key={step.title} className="flex gap-3 rounded-lg border border-border bg-card/60 p-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="role-capabilities" className="space-y-3">
            <h3 id="role-capabilities" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Platform capabilities by role
            </h3>
            <div className="space-y-3">
              {roleCapabilities.map((role) => (
                <div key={role.role} className="rounded-lg border border-border bg-card/60 p-3">
                  <p className="text-sm font-semibold text-foreground">{role.role}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{role.summary}</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {role.capabilities.map((capability) => (
                      <li key={capability} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span>{capability}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full"
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
