/**
 * Extended Practice Management System Dashboard
 * 
 * Features:
 * - Staff scheduling with AI optimization
 * - Inventory management with alerts
 * - Resource utilization tracking
 * - Performance metrics and analytics
 * - Facility management
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Calendar, 
  Package, 
  Building2, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Settings,
  Target,
  Award,
  Activity,
  DollarSign,
  ShoppingCart,
  Truck,
  Bell,
  Lightbulb,
  Zap,
  Eye,
  Edit,
  Trash2,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const staffSchedule = [
  {
    id: 1,
    day: "Monday",
    staff: [
      { name: "Dr. Smith", role: "Ophthalmologist", shift: "9:00-17:00", room: "Room 1" },
      { name: "Dr. Johnson", role: "Optometrist", shift: "9:00-17:00", room: "Room 2" },
      { name: "Dr. Wilson", role: "Ophthalmologist", shift: "9:00-17:00", room: "Room 3" }
    ]
  },
  {
    id: 2,
    day: "Tuesday",
    staff: [
      { name: "Dr. Chen", role: "Ophthalmologist", shift: "9:00-17:00", room: "Room 1" },
      { name: "Dr. Smith", role: "Ophthalmologist", shift: "9:00-17:00", room: "Room 2" },
      { name: "Dr. Johnson", role: "Optometrist", shift: "9:00-17:00", room: "Room 3" }
    ]
  }
];

const inventoryItems = [
  {
    id: 1,
    name: "Acuvue Oasys",
    category: "Contact Lenses",
    stock: 12,
    minStock: 50,
    maxStock: 200,
    unitCost: 45.00,
    lastReorder: "2024-03-01",
    supplier: "Johnson & Johnson"
  },
  {
    id: 2,
    name: "Opti-Free Solution",
    category: "Solutions",
    stock: 5,
    minStock: 25,
    maxStock: 100,
    unitCost: 12.50,
    lastReorder: "2024-02-28",
    supplier: "Alcon"
  },
  {
    id: 3,
    name: "Diagnostic Lenses",
    category: "Diagnostic",
    stock: 8,
    minStock: 20,
    maxStock: 50,
    unitCost: 125.00,
    lastReorder: "2024-03-05",
    supplier: "Various"
  }
];

const performanceMetrics = {
  clinical: {
    patientsPerDay: 24.3,
    trend: 12,
    avgVisitDuration: 45,
    trendDuration: -5,
    patientSatisfaction: 94.5,
    trendSatisfaction: 2.1
  },
  financial: {
    dailyRevenue: 4250,
    trendRevenue: 8,
    costPerPatient: 125,
    trendCost: -3,
    profitMargin: 68.5,
    trendMargin: 2.5
  },
  operational: {
    staffUtilization: 85,
    trendUtilization: 5,
    roomUtilization: 78,
    trendRoom: 3,
    inventoryTurnover: 4.2,
    trendTurnover: 0.8
  }
};

const aiSuggestions = [
  {
    id: 1,
    type: "scheduling",
    title: "Optimize Dr. Wilson's Schedule",
    description: "Dr. Wilson has a 2-hour gap on Tuesday afternoon. Consider scheduling 3 more patients.",
    impact: "High",
    savings: "$450/week"
  },
  {
    id: 2,
    type: "inventory",
    title: "Reorder Contact Lenses",
    description: "Acuvue Oasys stock is below minimum threshold. Bulk ordering could save 15%.",
    impact: "Medium",
    savings: "$200/month"
  },
  {
    id: 3,
    type: "resource",
    title: "Room 2 Underutilized",
    description: "Room 2 is only used 60% of the time. Consider moving contact lens fittings here.",
    impact: "Medium",
    savings: "Improve efficiency"
  }
];

interface MetricCardProps {
  title: string;
  value: string | number;
  trend: number;
  icon: React.ReactNode;
  description: string;
  color: string;
  unit?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, icon, description, color, unit }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
  >
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full -mr-16 -mt-16`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${color} bg-opacity-10`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {unit && <span className="text-lg font-normal text-gray-600 ml-1">{unit}</span>}
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {trend > 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={trend > 0 ? "text-green-500" : "text-red-500"}>
            {Math.abs(trend)}%
          </span>
          <span>{description}</span>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

interface ScheduleCardProps {
  day: string;
  staff: Array<{
    name: string;
    role: string;
    shift: string;
    room: string;
  }>;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ day, staff }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{day}</CardTitle>
      <CardDescription>Staff assignments and room utilization</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {staff.map((person, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">{person.name}</p>
                <p className="text-xs text-gray-600">{person.role}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{person.shift}</p>
              <p className="text-xs text-gray-600">{person.room}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex space-x-2">
        <Button size="sm" variant="outline" className="flex-1">
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          <Plus className="h-3 w-3 mr-1" />
          Add Staff
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default function PracticeManagementPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock API queries
  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ["/api/practice-management/schedule"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return staffSchedule;
    }
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/practice-management/inventory"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return inventoryItems;
    }
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/practice-management/metrics"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return performanceMetrics;
    }
  });

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["/api/practice-management/suggestions"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return aiSuggestions;
    }
  });

  const handleApplySuggestion = (suggestionId: number) => {
    toast({
      title: "Optimization Applied",
      description: "AI suggestion has been implemented successfully",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/practice-management/suggestions"] });
  };

  const handleReorderItem = (itemId: number) => {
    toast({
      title: "Reorder Created",
      description: "Purchase order has been created successfully",
    });
  };

  const filteredInventory = inventory?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const lowStockItems = filteredInventory.filter(item => item.stock <= item.minStock);
  const totalInventoryValue = filteredInventory.reduce((sum, item) => sum + (item.stock * item.unitCost), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Building2 className="h-8 w-8 mr-3 text-blue-600" />
              Practice Management
            </h1>
            <p className="text-gray-600">Optimize your practice operations and resources</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowOptimizationDialog(true)}>
              <Lightbulb className="h-4 w-4 mr-2" />
              AI Optimizations
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Staff Utilization"
            value={metrics?.clinical?.patientsPerDay || 0}
            trend={metrics?.operational?.staffUtilization || 0}
            icon={<Users className="h-4 w-4 text-blue-600" />}
            description="efficiency rate"
            color="bg-blue-600"
            unit="patients/day"
          />
          <MetricCard
            title="Daily Revenue"
            value={`$${metrics?.financial?.dailyRevenue || 0}`}
            trend={metrics?.financial?.trendRevenue || 0}
            icon={<DollarSign className="h-4 w-4 text-green-600" />}
            description="growth rate"
            color="bg-green-600"
          />
          <MetricCard
            title="Room Utilization"
            value={metrics?.operational?.roomUtilization || 0}
            trend={metrics?.operational?.trendRoom || 0}
            icon={<Building2 className="h-4 w-4 text-purple-600" />}
            description="occupancy rate"
            color="bg-purple-600"
            unit="%"
          />
          <MetricCard
            title="Inventory Alerts"
            value={lowStockItems.length}
            trend={-15}
            icon={<AlertTriangle className="h-4 w-4 text-orange-600" />}
            description="items to reorder"
            color="bg-orange-600"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staff">Staff & Scheduling</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="facility">Facility</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Optimization Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                    AI Optimization Suggestions
                  </CardTitle>
                  <CardDescription>Smart recommendations to improve efficiency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {suggestions?.map(suggestion => (
                      <div key={suggestion.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                          <Badge variant={suggestion.impact === 'High' ? 'destructive' : 'secondary'}>
                            {suggestion.impact} Impact
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {suggestion.savings}
                          </span>
                          <Button 
                            size="sm" 
                            onClick={() => handleApplySuggestion(suggestion.id)}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-500" />
                    Today&apos;s Overview
                  </CardTitle>
                  <CardDescription>Real-time practice status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">24</div>
                      <div className="text-sm text-gray-600">Patients Scheduled</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">18</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">85%</div>
                      <div className="text-sm text-gray-600">Staff Utilization</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">3</div>
                      <div className="text-sm text-gray-600">Open Rooms</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Wait Time</span>
                      <Badge variant="secondary">12 min</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Patient Satisfaction</span>
                      <Badge variant="secondary">4.8/5.0</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Revenue Today</span>
                      <Badge variant="secondary">$3,240</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Staff & Scheduling Tab */}
          <TabsContent value="staff" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Weekly Schedule</h3>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Week View
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Shift
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {schedule?.map(day => (
                <ScheduleCard
                  key={day.id}
                  day={day.day}
                  staff={day.staff}
                />
              ))}
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Bulk Reorder
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            {/* Inventory Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <Package className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredInventory.length}</div>
                  <p className="text-xs text-gray-600">Value: ${totalInventoryValue.toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
                  <p className="text-xs text-gray-600">Reorder required</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-gray-600">Product categories</p>
                </CardContent>
              </Card>
            </div>

            {/* Inventory Table */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Items</CardTitle>
                <CardDescription>Manage your practice inventory and stock levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Item Name</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-left p-2">Stock</th>
                        <th className="text-left p-2">Min/Max</th>
                        <th className="text-left p-2">Unit Cost</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map(item => (
                        <tr key={item.id} className="border-b">
                          <td className="p-2 font-medium">{item.name}</td>
                          <td className="p-2">{item.category}</td>
                          <td className="p-2">
                            <span className={item.stock <= item.minStock ? "text-red-600 font-semibold" : ""}>
                              {item.stock}
                            </span>
                          </td>
                          <td className="p-2 text-xs text-gray-600">{item.minStock}/{item.maxStock}</td>
                          <td className="p-2">${item.unitCost.toFixed(2)}</td>
                          <td className="p-2">
                            {item.stock <= item.minStock ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : (
                              <Badge variant="secondary">In Stock</Badge>
                            )}
                          </td>
                          <td className="p-2">
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3" />
                              </Button>
                              {item.stock <= item.minStock && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleReorderItem(item.id)}
                                >
                                  <ShoppingCart className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Clinical Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-500" />
                    Clinical Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Patients per Day</span>
                        <span className="text-sm font-semibold">{metrics?.clinical?.patientsPerDay}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Avg Visit Duration</span>
                        <span className="text-sm font-semibold">{metrics?.clinical?.avgVisitDuration} min</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Patient Satisfaction</span>
                        <span className="text-sm font-semibold">{metrics?.clinical?.patientSatisfaction}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '94.5%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                    Financial Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Daily Revenue</span>
                        <span className="text-sm font-semibold">${metrics?.financial?.dailyRevenue}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Cost per Patient</span>
                        <span className="text-sm font-semibold">${metrics?.financial?.costPerPatient}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '62%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Profit Margin</span>
                        <span className="text-sm font-semibold">{metrics?.financial?.profitMargin}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68.5%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Operational Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-purple-500" />
                    Operational Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Staff Utilization</span>
                        <span className="text-sm font-semibold">{metrics?.operational?.staffUtilization}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Room Utilization</span>
                        <span className="text-sm font-semibold">{metrics?.operational?.roomUtilization}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Inventory Turnover</span>
                        <span className="text-sm font-semibold">{metrics?.operational?.inventoryTurnover}x</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '84%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Facility Tab */}
          <TabsContent value="facility" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-blue-500" />
                    Room Utilization
                  </CardTitle>
                  <CardDescription>Real-time room status and scheduling</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["Room 1", "Room 2", "Room 3"].map((room, index) => (
                      <div key={room} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${index < 2 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="font-medium">{room}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{index < 2 ? 'In Use' : 'Available'}</p>
                          <p className="text-xs text-gray-600">{index < 2 ? 'Until 3:00 PM' : 'All Day'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Equipment Status</CardTitle>
                  <CardDescription>Medical equipment monitoring and maintenance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="font-medium">Phoropter 1</span>
                      </div>
                      <Badge variant="secondary">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="font-medium">Autorefractor</span>
                      </div>
                      <Badge variant="secondary">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="font-medium">Slit Lamp 2</span>
                      </div>
                      <Badge variant="outline">Maintenance Due</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Optimization Dialog */}
      <Dialog open={showOptimizationDialog} onOpenChange={setShowOptimizationDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-500" />
              AI-Powered Practice Optimization
            </DialogTitle>
            <DialogDescription>
              Smart recommendations to improve your practice efficiency and profitability
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {suggestions?.map(suggestion => (
              <div key={suggestion.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{suggestion.title}</h4>
                  <Badge variant={suggestion.impact === 'High' ? 'destructive' : 'secondary'}>
                    {suggestion.impact} Impact
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {suggestion.savings}
                  </span>
                  <Button onClick={() => handleApplySuggestion(suggestion.id)}>
                    Apply Suggestion
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOptimizationDialog(false)}>
              Close
            </Button>
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate New Suggestions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
