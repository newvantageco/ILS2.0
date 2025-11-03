import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/StatCard";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  Activity,
  BarChart3,
  Calendar,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AnalyticsOverview {
  totalRevenue: string;
  totalOrders: number;
  averageOrderValue: string;
  transactionCount: number;
  revenueTrend: number;
  ordersTrend: number;
  topProducts: Array<{
    productName: string;
    totalQuantity: number;
    totalRevenue: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function BusinessAnalyticsPage() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Overview metrics query
  const { data: overview, isLoading: overviewLoading } = useQuery<AnalyticsOverview>({
    queryKey: ['/api/analytics/overview', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/analytics/overview?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  // Revenue trends query
  const { data: revenueTrends } = useQuery({
    queryKey: ['/api/analytics/revenue-trends', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('interval', 'day');
      
      const response = await fetch(`/api/analytics/revenue-trends?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch revenue trends');
      return response.json();
    },
  });

  // Product performance query
  const { data: productPerformance } = useQuery({
    queryKey: ['/api/analytics/product-performance', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/analytics/product-performance?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch product performance');
      return response.json();
    },
  });

  // Customer analytics query
  const { data: customerAnalytics } = useQuery({
    queryKey: ['/api/analytics/customers', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/analytics/customers?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch customer analytics');
      return response.json();
    },
  });

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/analytics/export?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${startDate}-to-${endDate}.csv`;
      a.click();
      
      toast({
        title: "Export successful",
        description: "Analytics data has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export analytics data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Business Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive business intelligence and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range
          </CardTitle>
          <CardDescription>Select date range for analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                  const today = new Date().toISOString().split('T')[0];
                  setStartDate(thirtyDaysAgo);
                  setEndDate(today);
                }}
                variant="outline"
              >
                Last 30 Days
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${parseFloat(overview.totalRevenue).toLocaleString()}</div>
              <div className={`text-xs flex items-center gap-1 mt-1 ${overview.revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {overview.revenueTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(overview.revenueTrend).toFixed(1)}% vs previous period
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalOrders.toLocaleString()}</div>
              <div className={`text-xs flex items-center gap-1 mt-1 ${overview.ordersTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {overview.ordersTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(overview.ordersTrend).toFixed(1)}% vs previous period
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-600" />
                Avg Order Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${parseFloat(overview.averageOrderValue).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-600" />
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.transactionCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total completed</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
          <TabsTrigger value="top-products">Top Products</TabsTrigger>
        </TabsList>

        {/* Revenue Trends Tab */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Daily revenue over selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueTrends && revenueTrends.length > 0 ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4 }}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No revenue data available for selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Performance Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Sales by product category</CardDescription>
            </CardHeader>
            <CardContent>
              {productPerformance && productPerformance.length > 0 ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalSales" fill="#3b82f6" name="Total Sales" />
                      <Bar dataKey="quantity" fill="#10b981" name="Quantity Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No product performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Analytics Tab */}
        <TabsContent value="customers">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Distribution</CardTitle>
                <CardDescription>Active customers by segment</CardDescription>
              </CardHeader>
              <CardContent>
                {customerAnalytics && customerAnalytics.bySegment ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={customerAnalytics.bySegment}
                          dataKey="count"
                          nameKey="segment"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {customerAnalytics.bySegment.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No customer data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Metrics</CardTitle>
                <CardDescription>Key customer statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {customerAnalytics ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded">
                      <span className="font-medium">Total Customers</span>
                      <Badge className="text-lg px-3 py-1">{customerAnalytics.totalCustomers || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded">
                      <span className="font-medium">New Customers</span>
                      <Badge className="text-lg px-3 py-1 bg-green-500">{customerAnalytics.newCustomers || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded">
                      <span className="font-medium">Repeat Purchase Rate</span>
                      <Badge className="text-lg px-3 py-1 bg-blue-500">
                        {customerAnalytics.repeatPurchaseRate ? `${(customerAnalytics.repeatPurchaseRate * 100).toFixed(1)}%` : '0%'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded">
                      <span className="font-medium">Avg Customer Lifetime Value</span>
                      <Badge className="text-lg px-3 py-1 bg-purple-500">
                        ${customerAnalytics.avgLifetimeValue?.toFixed(2) || '0.00'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">No metrics available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Products Tab */}
        <TabsContent value="top-products">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Best performing products in selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {overview?.topProducts && overview.topProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Units Sold</TableHead>
                      <TableHead>Total Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.topProducts.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant={index === 0 ? 'default' : 'secondary'}>
                            #{index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell>{product.totalQuantity.toLocaleString()}</TableCell>
                        <TableCell className="font-mono">
                          ${parseFloat(product.totalRevenue).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No top products data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
