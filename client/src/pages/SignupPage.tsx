import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    role: "" as "ecp" | "lab_tech" | "engineer" | "supplier" | "admin" | "",
    organizationName: "",
    adminSetupKey: "",
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { role: string; organizationName: string; adminSetupKey?: string }) => {
      const response = await apiRequest("POST", "/api/auth/complete-signup", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account created successfully",
        description: "Your account is pending approval. You'll be notified once it's activated.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role) {
      toast({
        title: "Role required",
        description: "Please select your role",
        variant: "destructive",
      });
      return;
    }
    if (formData.role === "admin" && !formData.adminSetupKey) {
      toast({
        title: "Admin setup key required",
        description: "Please enter the admin setup key to create an admin account",
        variant: "destructive",
      });
      return;
    }
    
    const submitData: any = {
      role: formData.role,
      organizationName: formData.organizationName,
    };
    
    if (formData.role === "admin") {
      submitData.adminSetupKey = formData.adminSetupKey;
    }
    
    signupMutation.mutate(submitData);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in with Replit to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full" data-testid="button-go-home">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Complete Your Account Setup</CardTitle>
          <CardDescription>
            Welcome! Please provide some additional information to complete your registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={user.firstName || ""}
                  disabled
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={user.lastName || ""}
                  disabled
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={user.email || ""}
                disabled
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as typeof formData.role })
                }
              >
                <SelectTrigger id="role" data-testid="select-role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecp">Eye Care Professional (ECP)</SelectItem>
                  <SelectItem value="lab_tech">Lab Technician</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose the role that best describes your position
              </p>
            </div>

            {formData.role === "admin" && (
              <div className="space-y-2">
                <Label htmlFor="adminKey">Admin Setup Key *</Label>
                <Input
                  id="adminKey"
                  type="password"
                  value={formData.adminSetupKey}
                  onChange={(e) =>
                    setFormData({ ...formData, adminSetupKey: e.target.value })
                  }
                  placeholder="Enter admin setup key"
                  data-testid="input-admin-key"
                />
                <p className="text-sm text-muted-foreground">
                  Required: Contact your system administrator for the admin setup key
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={formData.organizationName}
                onChange={(e) =>
                  setFormData({ ...formData, organizationName: e.target.value })
                }
                placeholder="Enter your organization name"
                data-testid="input-organization-name"
              />
              <p className="text-sm text-muted-foreground">
                Optional: The company or practice you work for
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                disabled={signupMutation.isPending || !formData.role}
                className="w-full"
                data-testid="button-submit-signup"
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
              {formData.role !== "admin" && (
                <p className="text-xs text-muted-foreground text-center">
                  Your account will be reviewed by an administrator before activation
                </p>
              )}
              {formData.role === "admin" && (
                <p className="text-xs text-muted-foreground text-center">
                  Admin accounts are activated immediately upon verification
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
