import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { currencyService } from "@/services/currencyService";
import { useToast } from "@/hooks/use-toast";

interface CurrencyDisplayProps {
  gbpAmount?: number;
  showCard?: boolean;
  className?: string;
}

export function CurrencyDisplay({ gbpAmount, showCard = true, className = "" }: CurrencyDisplayProps) {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchRate = async () => {
    setLoading(true);
    try {
      const newRate = await currencyService.getGBPtoUSD();
      setRate(newRate);
      setLastUpdated(new Date());
      setCacheAge(currencyService.getCacheAge());
    } catch (error) {
      console.error("Failed to fetch exchange rate:", error);
      toast({
        title: "Currency Rate Error",
        description: "Failed to fetch live exchange rate. Using approximate rate.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchRate, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    currencyService.clearCache();
    fetchRate();
    toast({
      title: "Rate Refreshed",
      description: "Exchange rate has been updated.",
    });
  };

  const usdAmount = gbpAmount && rate ? gbpAmount * rate : null;
  const rateChange = rate ? ((rate - 1.25) / 1.25 * 100).toFixed(2) : null; // Compare to approximate baseline
  const isPositive = rateChange ? parseFloat(rateChange) > 0 : false;

  const content = (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Exchange Rate:</span>
            <span className="text-lg font-bold">
              1 GBP = {loading ? "..." : rate ? `${rate.toFixed(4)} USD` : "N/A"}
            </span>
            {rateChange && (
              <Badge variant={isPositive ? "default" : "secondary"} className="gap-1">
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {rateChange}%
              </Badge>
            )}
          </div>
          
          {gbpAmount && usdAmount && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {currencyService.formatCurrency(gbpAmount, 'GBP')}
                </span>
                <span className="text-muted-foreground">=</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {currencyService.formatCurrency(usdAmount, 'USD')}
                </span>
              </div>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            {lastUpdated && (
              <span>
                Last updated: {lastUpdated.toLocaleTimeString()}
                {cacheAge !== null && cacheAge > 0 && ` (${cacheAge}m ago)`}
              </span>
            )}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Live Currency Rates</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

export default CurrencyDisplay;
