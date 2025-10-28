import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface UpgradeBannerProps {
  feature: string;
}

export function UpgradeBanner({ feature }: UpgradeBannerProps) {
  return (
    <Card className="border-primary/40 border-dashed bg-primary/5">
      <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center justify-center rounded-full bg-primary/10 p-3 text-primary">
          <Crown className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
              Full Experience
            </Badge>
            <span>£199/month</span>
          </div>
          <h3 className="text-lg font-semibold">Upgrade required</h3>
          <p className="text-sm text-muted-foreground">
            Upgrade to the Full Experience plan to access {feature}. Eye care professionals on the free plan can
            continue to create orders and download purchase order records.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
