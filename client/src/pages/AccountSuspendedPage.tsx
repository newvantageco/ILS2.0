import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, LogOut, ArrowLeft, Mail, Phone } from "lucide-react";
import { useLocation } from "wouter";

export default function AccountSuspendedPage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const reason = searchParams.get('reason');

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const handleGoBack = () => {
    // Navigate to home page
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold">Account Suspended</CardTitle>
            <CardDescription className="text-base">
              Your account access has been temporarily suspended
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {reason && (
            <div className="p-4 bg-muted rounded-lg border">
              <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">
                Reason for Suspension
              </h3>
              <p className="text-foreground leading-relaxed">{reason}</p>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-muted-foreground text-center">
              If you believe this is a mistake or would like to appeal this decision, 
              please contact our support team.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email Support</p>
                  <a 
                    href="mailto:support@integratedlenssystem.com" 
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    support@ils.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone Support</p>
                  <a 
                    href="tel:+1234567890" 
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    +1 (234) 567-890
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="w-full"
                data-testid="button-go-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground pt-2">
              Suspended accounts cannot access system features until reactivated by an administrator
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
