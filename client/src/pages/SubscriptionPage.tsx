import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Crown, Zap, Building2, CreditCard, ExternalLink } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  limits: {
    locations: number;
    users: number;
    patients: number;
    aiCredits: number;
  };
  popular?: boolean;
}

interface SubscriptionStatus {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  isExempt: boolean;
  customerId: string | null;
  subscriptionId: string | null;
}

const plans: SubscriptionPlan[] = [
  {
    id: "free_ecp",
    name: "Free",
    description: "Perfect for getting started",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "1 location",
      "2 team members",
      "100 patients",
      "Basic AI assistant",
      "Email support",
    ],
    limits: {
      locations: 1,
      users: 2,
      patients: 100,
      aiCredits: 50,
    },
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing practices",
    priceMonthly: 149,
    priceYearly: 1490,
    features: [
      "3 locations",
      "10 team members",
      "Unlimited patients",
      "Advanced AI insights",
      "Clinical decision support",
      "Priority support",
      "Custom reports",
    ],
    limits: {
      locations: 3,
      users: 10,
      patients: -1,
      aiCredits: 500,
    },
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    priceMonthly: 349,
    priceYearly: 3490,
    features: [
      "Unlimited locations",
      "Unlimited team members",
      "Unlimited patients",
      "Full AI suite",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option",
    ],
    limits: {
      locations: -1,
      users: -1,
      patients: -1,
      aiCredits: -1,
    },
  },
];

export default function SubscriptionPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: subscriptionStatus, isLoading: isLoadingStatus } = useQuery<{ subscription: SubscriptionStatus }>({
    queryKey: ["/api/payments/subscription-status"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ planId, interval }: { planId: string; interval: "monthly" | "yearly" }) => {
      const response = await apiRequest("POST", "/api/payments/create-checkout-session", {
        planId,
        billingInterval: interval,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "Failed to create checkout session",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/payments/create-portal-session");
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive",
      });
    },
  });

  const currentPlan = subscriptionStatus?.subscription?.plan || user?.subscriptionPlan || "free_ecp";
  const hasActiveSubscription = subscriptionStatus?.subscription?.status === "active" || 
                                subscriptionStatus?.subscription?.status === "trialing";

  const handleUpgrade = (planId: string) => {
    if (planId === "free_ecp") return;
    setSelectedPlan(planId);
    checkoutMutation.mutate({ planId, interval: billingInterval });
  };

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Subscription & Billing</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and billing preferences
        </p>
      </div>

      {/* Current Plan Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold capitalize">
                  {currentPlan === "free_ecp" ? "Free" : currentPlan}
                </span>
                {hasActiveSubscription && (
                  <Badge variant="default" className="bg-green-600">Active</Badge>
                )}
                {subscriptionStatus?.subscription?.isExempt && (
                  <Badge variant="secondary">Exempt</Badge>
                )}
              </div>
              {subscriptionStatus?.subscription?.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground mt-1">
                  Renews on {new Date(subscriptionStatus.subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            {subscriptionStatus?.subscription?.customerId && (
              <Button
                variant="outline"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
              >
                {portalMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Manage Billing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Interval Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-muted p-1 rounded-lg inline-flex">
          <Button
            variant={billingInterval === "monthly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingInterval("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={billingInterval === "yearly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingInterval("yearly")}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
              Save 17%
            </Badge>
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const price = billingInterval === "yearly" ? plan.priceYearly : plan.priceMonthly;
          const monthlyPrice = billingInterval === "yearly" ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;

          return (
            <Card
              key={plan.id}
              className={`relative ${plan.popular ? "border-primary shadow-lg" : ""} ${
                isCurrentPlan ? "ring-2 ring-primary" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">
                    <Crown className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.id === "free_ecp" && <Zap className="h-5 w-5 text-blue-500" />}
                  {plan.id === "professional" && <Building2 className="h-5 w-5 text-purple-500" />}
                  {plan.id === "enterprise" && <Crown className="h-5 w-5 text-yellow-500" />}
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">£{monthlyPrice}</span>
                  <span className="text-muted-foreground">/month</span>
                  {billingInterval === "yearly" && price > 0 && (
                    <p className="text-sm text-muted-foreground">
                      £{price} billed annually
                    </p>
                  )}
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? "outline" : plan.popular ? "default" : "secondary"}
                  disabled={isCurrentPlan || checkoutMutation.isPending}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {checkoutMutation.isPending && selectedPlan === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isCurrentPlan ? "Current Plan" : plan.id === "free_ecp" ? "Downgrade" : "Upgrade"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ or Additional Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Can I change plans anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">What payment methods do you accept?</h4>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards including Visa, Mastercard, and American Express.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Is there a free trial?</h4>
            <p className="text-sm text-muted-foreground">
              The Free plan is available indefinitely. Professional and Enterprise plans include all features from day one.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
