import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  ArrowLeft,
  Mail,
  Calendar,
  MessageSquare
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface Connection {
  id: string;
  relationshipType: string;
  status: string;
  approvedAt?: string;
  connectedCompany: {
    id: string;
    name: string;
    type: string;
    email: string;
  };
}

interface ConnectionRequest {
  id: string;
  status: string;
  message?: string;
  proposedTerms?: string;
  createdAt: string;
  expiresAt?: string;
  direction: 'incoming' | 'outgoing';
  fromCompany: {
    id: string;
    name: string;
    type: string;
    email: string;
  };
  toCompany: {
    id: string;
    name: string;
    type: string;
    email: string;
  };
}

const companyTypeLabels: Record<string, string> = {
  ecp: 'Eye Care Practice',
  lab: 'Optical Lab',
  supplier: 'Supplier',
  hybrid: 'Hybrid'
};

const companyTypeColors: Record<string, string> = {
  ecp: 'bg-blue-100 text-blue-800',
  lab: 'bg-purple-100 text-purple-800',
  supplier: 'bg-green-100 text-green-800',
  hybrid: 'bg-orange-100 text-orange-800'
};

export default function MyConnectionsPage() {
  const [activeTab, setActiveTab] = useState('connections');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ConnectionRequest | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadConnections(),
        loadRequests()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      const response = await fetch('/api/marketplace/connections?status=active');
      if (!response.ok) throw new Error('Failed to load connections');
      
      const data = await response.json();
      setConnections(data);
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const loadRequests = async () => {
    try {
      const response = await fetch('/api/marketplace/connections/requests?type=all');
      if (!response.ok) throw new Error('Failed to load requests');
      
      const data = await response.json();
      setIncomingRequests(data.filter((r: ConnectionRequest) => r.direction === 'incoming'));
      setOutgoingRequests(data.filter((r: ConnectionRequest) => r.direction === 'outgoing'));
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/marketplace/connections/requests/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve request');
      }

      toast({
        title: "Success",
        description: "Connection request approved"
      });

      setShowRequestDialog(false);
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/marketplace/connections/requests/${requestId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject request');
      }

      toast({
        title: "Success",
        description: "Connection request rejected"
      });

      setShowRequestDialog(false);
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/marketplace/connections/requests/${requestId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel request');
      }

      toast({
        title: "Success",
        description: "Connection request cancelled"
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel request",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/marketplace/connections/${connectionId}/disconnect`, {
        method: 'PUT'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to disconnect');
      }

      toast({
        title: "Success",
        description: "Successfully disconnected"
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect",
        variant: "destructive"
      });
    }
  };

  const ConnectionCard = ({ connection }: { connection: Connection }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-lg">{connection.connectedCompany.name}</h3>
              <Badge className={companyTypeColors[connection.connectedCompany.type]}>
                {companyTypeLabels[connection.connectedCompany.type]}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span>{connection.connectedCompany.email}</span>
              </div>
              {connection.approvedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Connected {format(new Date(connection.approvedAt), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation(`/marketplace/companies/${connection.connectedCompany.id}`)}
            >
              View Profile
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDisconnect(connection.id)}
              className="text-red-600 hover:text-red-700"
            >
              Disconnect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const RequestCard = ({ request, type }: { request: ConnectionRequest; type: 'incoming' | 'outgoing' }) => {
    const otherCompany = type === 'incoming' ? request.fromCompany : request.toCompany;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-lg">{otherCompany.name}</h3>
                <Badge className={companyTypeColors[otherCompany.type]}>
                  {companyTypeLabels[otherCompany.type]}
                </Badge>
                <Badge variant="outline" className="text-yellow-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Requested {format(new Date(request.createdAt), 'MMM d, yyyy')}</span>
                </div>
                {request.expiresAt && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <Clock className="w-4 h-4" />
                    <span>Expires {format(new Date(request.expiresAt), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>

              {request.message && (
                <div className="ml-8 mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  {request.message}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {type === 'incoming' ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowRequestDialog(true);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectRequest(request.id)}
                    disabled={actionLoading}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancelRequest(request.id)}
                  disabled={actionLoading}
                >
                  Cancel Request
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" onClick={() => setLocation('/marketplace')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8" />
            My Connections
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your business relationships and connection requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{connections.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Incoming Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{incomingRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{outgoingRequests.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections">
            Connections ({connections.length})
          </TabsTrigger>
          <TabsTrigger value="incoming">
            Incoming ({incomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            Outgoing ({outgoingRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : connections.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">No connections yet</h3>
                <p className="text-gray-600 mb-4">
                  Start building your network by connecting with companies
                </p>
                <Button onClick={() => setLocation('/marketplace')}>
                  Browse Marketplace
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => (
                <ConnectionCard key={connection.id} connection={connection} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="incoming" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : incomingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">No incoming requests</h3>
                <p className="text-gray-600">
                  You&apos;ll see connection requests from other companies here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map((request) => (
                <RequestCard key={request.id} request={request} type="incoming" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : outgoingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">No pending requests</h3>
                <p className="text-gray-600">
                  Your outgoing connection requests will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {outgoingRequests.map((request) => (
                <RequestCard key={request.id} request={request} type="outgoing" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Connection Request</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>Approve connection request from {selectedRequest.fromCompany.name}?</>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest?.message && (
            <div className="py-4">
              <p className="text-sm font-medium mb-2">Their message:</p>
              <div className="p-3 bg-gray-50 rounded text-sm">
                {selectedRequest.message}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRequestDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedRequest && handleApproveRequest(selectedRequest.id)}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Connection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
