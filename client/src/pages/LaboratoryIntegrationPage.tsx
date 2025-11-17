/**
 * Laboratory Integration System Dashboard
 * 
 * Features:
 * - Lab order management with Kanban board
 * - Results viewer with trend analysis
 * - Critical value alerts
 * - Quality control tracking
 * - HL7 integration interface
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Beaker, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Activity,
  TrendingUp,
  FileText,
  Bell,
  Eye,
  Calendar,
  User,
  TestTube,
  BarChart3,
  Settings,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const labOrders = [
  {
    id: "LAB-001",
    patientName: "John Smith",
    patientId: "P-001",
    tests: ["CBC", "CMP", "Lipid Panel"],
    status: "pending",
    urgency: "routine",
    orderDate: "2024-03-15",
    collectionDate: "2024-03-15",
    provider: "Dr. Johnson"
  },
  {
    id: "LAB-002",
    patientName: "Sarah Williams",
    patientId: "P-002",
    tests: ["HBA1C", "TSH"],
    status: "in_progress",
    urgency: "urgent",
    orderDate: "2024-03-15",
    collectionDate: "2024-03-15",
    provider: "Dr. Chen"
  },
  {
    id: "LAB-003",
    patientName: "Michael Davis",
    patientId: "P-003",
    tests: ["Urinalysis", "Culture"],
    status: "completed",
    urgency: "stat",
    orderDate: "2024-03-14",
    collectionDate: "2024-03-14",
    provider: "Dr. Wilson"
  }
];

const labResults = [
  {
    id: "RES-001",
    orderId: "LAB-003",
    patientName: "Michael Davis",
    testName: "Complete Blood Count",
    resultValue: "Normal",
    status: "final",
    resultDate: "2024-03-15",
    performingLab: "Central Lab",
    criticalValues: []
  },
  {
    id: "RES-002",
    orderId: "LAB-003",
    patientName: "Michael Davis",
    testName: "Potassium",
    resultValue: "2.8 mmol/L",
    status: "final",
    resultDate: "2024-03-15",
    performingLab: "Central Lab",
    criticalValues: ["Low potassium detected"]
  }
];

const criticalValues = [
  {
    id: "CV-001",
    patientName: "Michael Davis",
    testName: "Potassium",
    value: "2.8 mmol/L",
    normalRange: "3.5-5.0 mmol/L",
    provider: "Dr. Wilson",
    time: "2024-03-15 10:45 AM",
    acknowledged: false
  }
];

interface LabOrderCardProps {
  order: typeof labOrders[0];
  onStatusChange: (orderId: string, newStatus: string) => void;
}

const LabOrderCard: React.FC<LabOrderCardProps> = ({ order, onStatusChange }) => {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800"
  };

  const urgencyColors = {
    routine: "bg-gray-100 text-gray-800",
    urgent: "bg-orange-100 text-orange-800",
    stat: "bg-red-100 text-red-800"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white p-4 rounded-lg shadow border border-gray-200 cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{order.patientName}</h4>
          <p className="text-sm text-gray-600">ID: {order.patientId}</p>
        </div>
        <div className="flex space-x-2">
          <Badge className={statusColors[order.status as keyof typeof statusColors]}>
            {order.status.replace('_', ' ')}
          </Badge>
          <Badge className={urgencyColors[order.urgency as keyof typeof urgencyColors]}>
            {order.urgency.toUpperCase()}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-gray-700">Tests:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {order.tests.map((test, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {test}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Provider: {order.provider}</span>
          <span>{order.orderDate}</span>
        </div>
      </div>

      <div className="mt-3 flex space-x-2">
        <Button size="sm" variant="outline" className="flex-1">
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
        <Select onValueChange={(value) => onStatusChange(order.id, value)}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
};

export default function LaboratoryIntegrationPage() {
  const [selectedTab, setSelectedTab] = useState("orders");
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock API queries
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/laboratory/orders"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return labOrders;
    }
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ["/api/laboratory/results"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return labResults;
    }
  });

  const { data: criticalAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/laboratory/critical-values"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return criticalValues;
    }
  });

  const statusUpdateMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { orderId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/laboratory/orders"] });
      toast({
        title: "Status Updated",
        description: "Lab order status has been updated successfully",
      });
    }
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    statusUpdateMutation.mutate({ orderId, status: newStatus });
  };

  const handleCreateOrder = (orderData: any) => {
    toast({
      title: "Order Created",
      description: "Lab order has been created successfully",
    });
    setShowNewOrderDialog(false);
    queryClient.invalidateQueries({ queryKey: ["/api/laboratory/orders"] });
  };

  const handleAcknowledgeCritical = (alertId: string) => {
    toast({
      title: "Critical Value Acknowledged",
      description: "Provider has been notified of the critical value",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/laboratory/critical-values"] });
  };

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const ordersByStatus = {
    pending: filteredOrders.filter(order => order.status === "pending"),
    in_progress: filteredOrders.filter(order => order.status === "in_progress"),
    completed: filteredOrders.filter(order => order.status === "completed")
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Beaker className="h-8 w-8 mr-3 text-blue-600" />
              Laboratory Integration
            </h1>
            <p className="text-gray-600">Comprehensive lab order and results management</p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={showNewOrderDialog} onOpenChange={setShowNewOrderDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Lab Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Lab Order</DialogTitle>
                  <DialogDescription>
                    Enter patient information and select required tests
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="patient-search">Patient Search</Label>
                      <Input id="patient-search" placeholder="Search patient..." />
                    </div>
                    <div>
                      <Label htmlFor="provider">Ordering Provider</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dr-johnson">Dr. Johnson</SelectItem>
                          <SelectItem value="dr-chen">Dr. Chen</SelectItem>
                          <SelectItem value="dr-wilson">Dr. Wilson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Test Selection</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {["CBC", "CMP", "Lipid Panel", "HBA1C", "TSH", "Urinalysis"].map(test => (
                        <label key={test} className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">{test}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="urgency">Urgency</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="routine">Routine</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="stat">Stat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="collection-date">Collection Date</Label>
                      <Input id="collection-date" type="date" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="clinical-notes">Clinical Notes</Label>
                    <Textarea id="clinical-notes" placeholder="Enter clinical information..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewOrderDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleCreateOrder({})}>
                    Create Order
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              HL7 Import
            </Button>
            
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{ordersByStatus.pending.length}</div>
              <p className="text-xs text-gray-600">Awaiting collection</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{ordersByStatus.in_progress.length}</div>
              <p className="text-xs text-gray-600">Being processed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{ordersByStatus.completed.length}</div>
              <p className="text-xs text-gray-600">Results ready</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Values</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalAlerts?.length || 0}</div>
              <p className="text-xs text-gray-600">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Lab Orders</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="critical">Critical Values</TabsTrigger>
            <TabsTrigger value="quality">Quality Control</TabsTrigger>
          </TabsList>

          {/* Lab Orders Tab - Kanban Board */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pending Column */}
              <div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <h3 className="font-semibold text-yellow-800">Pending Collection</h3>
                  <p className="text-sm text-yellow-600">{ordersByStatus.pending.length} orders</p>
                </div>
                <div className="space-y-3">
                  {ordersByStatus.pending.map(order => (
                    <LabOrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <h3 className="font-semibold text-blue-800">In Lab</h3>
                  <p className="text-sm text-blue-600">{ordersByStatus.in_progress.length} orders</p>
                </div>
                <div className="space-y-3">
                  {ordersByStatus.in_progress.map(order => (
                    <LabOrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>

              {/* Completed Column */}
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <h3 className="font-semibold text-green-800">Completed</h3>
                  <p className="text-sm text-green-600">{ordersByStatus.completed.length} orders</p>
                </div>
                <div className="space-y-3">
                  {ordersByStatus.completed.map(order => (
                    <LabOrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {results?.map(result => (
                <Card key={result.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{result.testName}</CardTitle>
                        <CardDescription>Patient: {result.patientName}</CardDescription>
                      </div>
                      <Badge variant={result.status === 'final' ? 'default' : 'secondary'}>
                        {result.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Result Value</Label>
                          <p className="text-lg font-semibold">{result.resultValue}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Performing Lab</Label>
                          <p className="text-sm">{result.performingLab}</p>
                        </div>
                      </div>
                      
                      {result.criticalValues.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-red-800">Critical Values:</p>
                          <ul className="text-sm text-red-700 mt-1">
                            {result.criticalValues.map((cv, index) => (
                              <li key={index}>• {cv}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <FileText className="h-3 w-3 mr-1" />
                          Full Report
                        </Button>
                        <Button size="sm" variant="outline">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Trends
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Critical Values Tab */}
          <TabsContent value="critical" className="space-y-6">
            <div className="space-y-4">
              {criticalAlerts?.map(alert => (
                <Card key={alert.id} className="border-red-200 bg-red-50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-red-800 flex items-center">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          CRITICAL VALUE ALERT
                        </CardTitle>
                        <CardDescription>
                          Patient: {alert.patientName} | Test: {alert.testName}
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">
                        {alert.acknowledged ? 'Acknowledged' : 'Pending'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Value</Label>
                          <p className="text-lg font-semibold text-red-700">{alert.value}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Normal Range</Label>
                          <p className="text-sm">{alert.normalRange}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-sm font-medium">Provider</Label>
                          <p>{alert.provider}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Time</Label>
                          <p>{alert.time}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" variant="destructive">
                          <Bell className="h-3 w-3 mr-1" />
                          Notify Provider
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAcknowledgeCritical(alert.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Acknowledge
                        </Button>
                        <Button size="sm" variant="outline">
                          <FileText className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Quality Control Tab */}
          <TabsContent value="quality" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                    Quality Control Metrics
                  </CardTitle>
                  <CardDescription>Lab performance and compliance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>QC Pass Rate</span>
                      <Badge variant="secondary">98.5%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Turnaround Time Compliance</span>
                      <Badge variant="secondary">94.2%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>HL7 Integration</CardTitle>
                  <CardDescription>External lab system connectivity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Central Lab Interface</span>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Reference Lab Interface</span>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Sync</span>
                      <span className="text-sm text-gray-600">2 minutes ago</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure HL7
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
