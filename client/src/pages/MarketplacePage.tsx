import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  Search, 
  Building2, 
  MapPin, 
  Star, 
  Users, 
  CheckCircle,
  Clock,
  XCircle,
  Link as LinkIcon,
  Filter,
  Grid3x3,
  List
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface Company {
  id: string;
  name: string;
  type: 'ecp' | 'lab' | 'supplier' | 'hybrid';
  email: string;
  phone?: string;
  website?: string;
  status: string;
  profile?: {
    profileHeadline?: string;
    tagline?: string;
    specialties?: string[];
    connectionsCount?: number;
    isMarketplaceVisible?: boolean;
    marketplaceVerified?: boolean;
  };
  connectionStatus: 'active' | 'pending' | 'rejected' | 'disconnected' | 'pending_request' | 'not_connected';
  canConnect: boolean;
}

interface MarketplaceStats {
  totalCompanies: number;
  totalConnections: number;
  companiesByType: Record<string, number>;
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

const connectionStatusLabels: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'Connected', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  pending_request: { label: 'Request Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  not_connected: { label: 'Not Connected', color: 'bg-gray-100 text-gray-800', icon: LinkIcon },
  disconnected: { label: 'Disconnected', color: 'bg-red-100 text-red-800', icon: XCircle }
};

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadMarketplaceData();
    loadStats();
  }, [activeTab, searchQuery]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.append('companyType', activeTab);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      params.append('limit', '50');
      
      const response = await fetch(`/api/marketplace/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load marketplace data');
      
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load marketplace data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/marketplace/stats');
      if (!response.ok) throw new Error('Failed to load stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleRequestConnection = async (companyId: string) => {
    try {
      const response = await fetch('/api/marketplace/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCompanyId: companyId,
          message: 'I would like to connect with your company.'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send connection request');
      }

      toast({
        title: "Success",
        description: "Connection request sent successfully"
      });

      // Reload data to update connection status
      loadMarketplaceData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive"
      });
    }
  };

  const handleViewProfile = (companyId: string) => {
    setLocation(`/marketplace/companies/${companyId}`);
  };

  const getConnectionButton = (company: Company) => {
    const status = connectionStatusLabels[company.connectionStatus];
    
    if (company.connectionStatus === 'active') {
      return (
        <Badge className={status.color}>
          <CheckCircle className="w-3 h-3 mr-1" />
          {status.label}
        </Badge>
      );
    }
    
    if (company.connectionStatus === 'pending_request') {
      return (
        <Badge className={status.color}>
          <Clock className="w-3 h-3 mr-1" />
          {status.label}
        </Badge>
      );
    }
    
    if (company.canConnect && company.connectionStatus === 'not_connected') {
      return (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            handleRequestConnection(company.id);
          }}
        >
          <LinkIcon className="w-4 h-4 mr-1" />
          Connect
        </Button>
      );
    }
    
    return (
      <Badge variant="outline" className="text-gray-500">
        {status?.label || 'Unavailable'}
      </Badge>
    );
  };

  const CompanyCard = ({ company }: { company: Company }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer h-full"
        onClick={() => handleViewProfile(company.id)}
      >
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <Badge className={companyTypeColors[company.type]}>
              {companyTypeLabels[company.type]}
            </Badge>
            {company.profile?.marketplaceVerified && (
              <Badge variant="outline" className="text-blue-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {company.name}
          </CardTitle>
          
          {company.profile?.tagline && (
            <CardDescription className="text-sm italic">
              &ldquo;{company.profile.tagline}&rdquo;
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent>
          {company.profile?.profileHeadline && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {company.profile.profileHeadline}
            </p>
          )}
          
          {company.profile?.specialties && company.profile.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {company.profile.specialties.slice(0, 3).map((specialty, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {company.profile.specialties.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{company.profile.specialties.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex justify-between items-center pt-3 border-t">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{company.profile?.connectionsCount || 0} connections</span>
            </div>
            
            {getConnectionButton(company)}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const CompanyListItem = ({ company }: { company: Company }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer mb-3"
        onClick={() => handleViewProfile(company.id)}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-lg">{company.name}</h3>
                  <Badge className={companyTypeColors[company.type]}>
                    {companyTypeLabels[company.type]}
                  </Badge>
                  {company.profile?.marketplaceVerified && (
                    <Badge variant="outline" className="text-blue-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                {company.profile?.profileHeadline && (
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {company.profile.profileHeadline}
                  </p>
                )}
                
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{company.profile?.connectionsCount || 0} connections</span>
                  </div>
                  
                  {company.profile?.specialties && company.profile.specialties.length > 0 && (
                    <div className="flex gap-1">
                      {company.profile.specialties.slice(0, 2).map((specialty, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {getConnectionButton(company)}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Company Marketplace</h1>
          <p className="text-gray-600">
            Connect with optical labs, suppliers, and eye care practices
          </p>
        </div>
        
        <Button onClick={() => setLocation('/marketplace/my-connections')}>
          <Users className="w-4 h-4 mr-2" />
          My Connections
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCompanies}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalConnections}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Labs Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.companiesByType.lab || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search companies by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs and Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Companies</TabsTrigger>
          <TabsTrigger value="lab">Labs</TabsTrigger>
          <TabsTrigger value="supplier">Suppliers</TabsTrigger>
          <TabsTrigger value="ecp">ECPs</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No companies found"
              description={searchQuery 
                ? "Try adjusting your search or filters"
                : "Start building your network by connecting with labs and suppliers"
              }
              action={searchQuery ? {
                label: "Clear Search",
                onClick: () => setSearchQuery('')
              } : undefined}
            />
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {companies.map((company) => (
                    <CompanyCard key={company.id} company={company} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {companies.map((company) => (
                    <CompanyListItem key={company.id} company={company} />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
