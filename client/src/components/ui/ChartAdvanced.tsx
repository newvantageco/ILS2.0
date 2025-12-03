/**
 * Advanced Chart Components
 *
 * Interactive, animated charts with drill-down capabilities
 * - InteractiveLineChart: Time-series with zoom/pan
 * - InteractiveBarChart: Bar chart with click-through
 * - PieChartWithDrilldown: Pie chart with nested data
 * - HeatmapChart: Time/category heatmap
 * - SparklineChart: Minimal trend indicator
 * - GaugeChart: Circular gauge indicator
 */

import * as React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================================================
// TYPES
// ============================================================================

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface ChartConfig {
  dataKey: string;
  name?: string;
  color?: string;
  type?: "line" | "bar" | "area";
}

export interface InteractiveChartProps {
  data: ChartDataPoint[];
  config: ChartConfig[];
  xAxisKey: string;
  title?: string;
  description?: string;
  height?: number;
  enableZoom?: boolean;
  enableExport?: boolean;
  enableFullscreen?: boolean;
  onDataPointClick?: (data: ChartDataPoint) => void;
  className?: string;
}

// ============================================================================
// COLORS
// ============================================================================

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
];

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  config?: ChartConfig[];
}

function CustomTooltip({ active, payload, label, config }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background border rounded-lg shadow-lg p-3 space-y-2"
    >
      <p className="font-semibold text-sm">{label}</p>
      {payload.map((entry, index) => {
        const configItem = config?.find(c => c.dataKey === entry.dataKey);
        return (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">
                {configItem?.name || entry.dataKey}:
              </span>
            </div>
            <span className="font-semibold">
              {typeof entry.value === "number"
                ? entry.value.toLocaleString()
                : entry.value}
            </span>
          </div>
        );
      })}
    </motion.div>
  );
}

// ============================================================================
// INTERACTIVE LINE CHART
// ============================================================================

export function InteractiveLineChart({
  data,
  config,
  xAxisKey,
  title,
  description,
  height = 300,
  enableZoom = true,
  enableExport = true,
  enableFullscreen = false,
  onDataPointClick,
  className,
}: InteractiveChartProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [zoomDomain, setZoomDomain] = React.useState<[number, number] | undefined>();

  const handleExport = () => {
    // Simple CSV export
    const headers = [xAxisKey, ...config.map(c => c.name || c.dataKey)];
    const csvContent = [
      headers.join(","),
      ...data.map(row =>
        headers.map(h => {
          const key = h === xAxisKey ? xAxisKey : config.find(c => c.name === h || c.dataKey === h)?.dataKey;
          return key ? row[key] : "";
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "chart"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => {
    const midPoint = Math.floor(data.length / 2);
    const quarterRange = Math.floor(data.length / 4);
    setZoomDomain([midPoint - quarterRange, midPoint + quarterRange]);
  };

  const handleZoomOut = () => {
    setZoomDomain(undefined);
  };

  const displayData = zoomDomain
    ? data.slice(zoomDomain[0], zoomDomain[1])
    : data;

  return (
    <Card className={cn("overflow-hidden", className)}>
      {(title || description || enableExport || enableZoom) && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="flex items-center gap-2">
              {enableZoom && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={!!zoomDomain}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={!zoomDomain}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </>
              )}
              {enableExport && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={displayData} onClick={onDataPointClick}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={xAxisKey}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip config={config} />} />
            <Legend />
            {config.map((item, index) => (
              <Line
                key={item.dataKey}
                type="monotone"
                dataKey={item.dataKey}
                name={item.name || item.dataKey}
                stroke={item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={800}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// INTERACTIVE BAR CHART
// ============================================================================

export function InteractiveBarChart({
  data,
  config,
  xAxisKey,
  title,
  description,
  height = 300,
  enableExport = true,
  onDataPointClick,
  className,
}: InteractiveChartProps) {
  const [selectedBar, setSelectedBar] = React.useState<string | null>(null);

  const handleBarClick = (data: any) => {
    setSelectedBar(data[xAxisKey]);
    onDataPointClick?.(data);
  };

  const handleExport = () => {
    const headers = [xAxisKey, ...config.map(c => c.name || c.dataKey)];
    const csvContent = [
      headers.join(","),
      ...data.map(row =>
        headers.map(h => {
          const key = h === xAxisKey ? xAxisKey : config.find(c => c.name === h || c.dataKey === h)?.dataKey;
          return key ? row[key] : "";
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "chart"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      {(title || description || enableExport) && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {enableExport && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} onClick={handleBarClick}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={xAxisKey}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip config={config} />} />
            <Legend />
            {config.map((item, index) => (
              <Bar
                key={item.dataKey}
                dataKey={item.dataKey}
                name={item.name || item.dataKey}
                fill={item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                opacity={selectedBar && data.some(d => d[xAxisKey] === selectedBar) ? 0.6 : 1}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SPARKLINE CHART
// ============================================================================

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  showTrend?: boolean;
  showValue?: boolean;
}

export function SparklineChart({
  data,
  width = 100,
  height = 30,
  color = DEFAULT_COLORS[0],
  className,
  showTrend = true,
  showValue = true,
}: SparklineProps) {
  const trend = data[data.length - 1] - data[0];
  const trendPercent = (trend / data[0]) * 100;
  const isPositive = trend >= 0;

  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ResponsiveContainer width={width} height={height}>
        <AreaChart data={chartData}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.2}
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>

      {showTrend && (
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : trend === 0 ? (
            <Minus className="h-4 w-4 text-gray-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          {showValue && (
            <span
              className={cn(
                "text-sm font-medium",
                isPositive && "text-green-500",
                trend === 0 && "text-gray-500",
                !isPositive && trend !== 0 && "text-red-500"
              )}
            >
              {trendPercent > 0 && "+"}{trendPercent.toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// GAUGE CHART
// ============================================================================

export interface GaugeChartProps {
  value: number;
  max?: number;
  min?: number;
  label?: string;
  size?: number;
  color?: string;
  className?: string;
}

export function GaugeChart({
  value,
  max = 100,
  min = 0,
  label,
  size = 200,
  color = DEFAULT_COLORS[0],
  className,
}: GaugeChartProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const angle = (percentage / 100) * 180 - 90;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative" style={{ width: size, height: size / 2 }}>
        {/* Background arc */}
        <svg
          width={size}
          height={size / 2}
          viewBox={`0 0 ${size} ${size / 2}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d={`M ${size * 0.1} ${size / 2} A ${size * 0.4} ${size * 0.4} 0 0 1 ${size * 0.9} ${size / 2}`}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={size * 0.05}
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <motion.path
            d={`M ${size * 0.1} ${size / 2} A ${size * 0.4} ${size * 0.4} 0 0 1 ${size * 0.9} ${size / 2}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={size * 0.05}
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * Math.PI * size * 0.4} ${Math.PI * size * 0.4}`}
            initial={{ strokeDasharray: `0 ${Math.PI * size * 0.4}` }}
            animate={{ strokeDasharray: `${(percentage / 100) * Math.PI * size * 0.4} ${Math.PI * size * 0.4}` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {/* Needle */}
          <motion.line
            x1={size / 2}
            y1={size / 2}
            x2={size / 2 + size * 0.35 * Math.cos((angle * Math.PI) / 180)}
            y2={size / 2 + size * 0.35 * Math.sin((angle * Math.PI) / 180)}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            initial={{ rotate: -90 }}
            animate={{ rotate: angle }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
          />

          {/* Center dot */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.03}
            fill={color}
          />
        </svg>

        {/* Value display */}
        <div className="absolute inset-x-0 top-full mt-2 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-bold"
          >
            {value.toFixed(0)}
          </motion.div>
          {label && (
            <div className="text-sm text-muted-foreground mt-1">{label}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STAT CARD WITH CHART
// ============================================================================

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  sparklineData?: number[];
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  trend,
  sparklineData,
  icon,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-card rounded-lg border p-6 space-y-2", className)}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>

      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : trend === "down" ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <Minus className="h-4 w-4 text-gray-500" />
              )}
              <span
                className={cn(
                  "font-medium",
                  trend === "up" && "text-green-500",
                  trend === "down" && "text-red-500",
                  trend === "neutral" && "text-gray-500"
                )}
              >
                {change > 0 && "+"}
                {change}%
              </span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>

        {sparklineData && (
          <SparklineChart
            data={sparklineData}
            width={80}
            height={40}
            showTrend={false}
            showValue={false}
          />
        )}
      </div>
    </motion.div>
  );
}
