import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Mail, Lock, User, Building2, ArrowLeft, Key, AlertCircle, Crown, Printer } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function EmailSignupPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "",
    organizationName: "",
    adminSetupKey: "",
    subscriptionPlan: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    setFormData(prev => {
      if (!prev.role) {
        return prev.subscriptionPlan === "" ? prev : { ...prev, subscriptionPlan: "" };
      }
      const enforcedPlan = prev.role === "ecp" ? "free_ecp" : "full";
      if (prev.subscriptionPlan === enforcedPlan) {
        return prev;
      }
      return { ...prev, subscriptionPlan: enforcedPlan };
    });
  }, [formData.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (formData.role === 'admin' && !formData.adminSetupKey) {
      toast({
        title: "Admin key required",
        description: "Admin setup key is required for admin accounts",
        variant: "destructive",
      });
      return;
    }

    const allowedPlan = formData.role === 'ecp'
      ? 'free_ecp'
      : formData.role
        ? 'full'
        : '';
    const selectedPlan = formData.subscriptionPlan || allowedPlan;

    if (!selectedPlan) {
      toast({
        title: "Select subscription plan",
        description: "Please choose a subscription option to continue",
        variant: "destructive",
      });
      return;
    }

    if (allowedPlan && selectedPlan !== allowedPlan) {
      toast({
        title: "Plan not available",
        description: "The selected plan is not available for the chosen role",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/signup-email", {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        organizationName: formData.organizationName || null,
        adminSetupKey: formData.role === 'admin' ? formData.adminSetupKey : undefined,
        subscriptionPlan: selectedPlan,
      });

      const data = await response.json() as { message: string; user: any };

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Account created",
        description: data.user.accountStatus === 'active' 
          ? "Your account has been created and activated"
          : "Your account is pending approval",
      });

      // Redirect based on account status
      if (data.user.accountStatus === 'pending') {
        setLocation('/pending-approval');
      } else {
        // Active user (admin) - redirect to dashboard
        setLocation('/admin/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = formData.role.length > 0;
  const isEcp = formData.role === 'ecp';
  const fullPlanDisabled = !hasRole || isEcp;
  const freePlanDisabled = !hasRole || !isEcp;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              data-testid="button-back-to-home"
              className="h-8"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold">Create your ILS account</CardTitle>
          <CardDescription>
            Sign up with your email to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    className="pl-9"
                    data-testid="input-firstname"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    className="pl-9"
                    data-testid="input-lastname"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="pl-9"
                  data-testid="input-email"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  className="pl-9"
                  data-testid="input-password"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  className="pl-9"
                  data-testid="input-confirm-password"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
                required
                disabled={isLoading}
              >
                <SelectTrigger id="role" data-testid="select-role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecp">Eye Care Professional</SelectItem>
                  <SelectItem value="lab_tech">Lab Technician</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Subscription Plan</Label>
              <RadioGroup
                value={formData.subscriptionPlan}
                onValueChange={(value) => handleInputChange('subscriptionPlan', value)}
                className="grid gap-3"
              >
                <Label
                  htmlFor="plan-full"
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4 transition focus-within:ring-2 focus-within:ring-primary/40",
                    formData.subscriptionPlan === 'full' && "border-primary ring-2 ring-primary/40 bg-primary/5",
                    fullPlanDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem
                    id="plan-full"
                    value="full"
                    disabled={fullPlanDisabled || isLoading}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Crown className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Full Experience</span>
                      <span className="text-sm text-muted-foreground">£199/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complete platform access including patient management, examinations, prescriptions, inventory, and retail tools.
                    </p>
                  </div>
                </Label>

                <Label
                  htmlFor="plan-free"
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4 transition focus-within:ring-2 focus-within:ring-primary/40",
                    formData.subscriptionPlan === 'free_ecp' && "border-primary ring-2 ring-primary/40 bg-primary/5",
                    freePlanDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem
                    id="plan-free"
                    value="free_ecp"
                    disabled={freePlanDisabled || isLoading}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Printer className="h-4 w-4 text-primary" />
                      <span className="font-semibold">ECP Records (Free)</span>
                      <span className="text-sm text-muted-foreground">£0/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Submit orders and download purchase order records. Advanced clinical and retail modules require the Full Experience plan.
                    </p>
                  </div>
                </Label>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                {isEcp
                  ? "ECP accounts default to the free plan. Upgrade later to unlock clinical and retail workflows."
                  : "Lab, engineering, supplier, and admin roles require the Full Experience subscription."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name (Optional)</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="organizationName"
                  type="text"
                  placeholder="Your organization"
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange('organizationName', e.target.value)}
                  className="pl-9"
                  data-testid="input-organization"
                  disabled={isLoading}
                />
              </div>
            </div>

            {formData.role === 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="adminSetupKey">Admin Setup Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminSetupKey"
                    type="password"
                    placeholder="Enter admin setup key"
                    value={formData.adminSetupKey}
                    onChange={(e) => handleInputChange('adminSetupKey', e.target.value)}
                    required
                    className="pl-9"
                    data-testid="input-admin-key"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for administrator accounts. Contact your system administrator for the key.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-signup"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Already have an account?
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setLocation('/email-login')}
              data-testid="button-go-to-login"
            >
              Sign in instead
            </Button>
          </form>

          <div className="mt-6 p-3 bg-muted/50 rounded-md">
            <div className="flex gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">Account approval required</p>
                <p>Non-admin accounts require approval before accessing the system. Admins are activated immediately with the correct setup key.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
