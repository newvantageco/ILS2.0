import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Users, 
  CheckCircle,
  Clock,
  Link as LinkIcon,
  ArrowLeft,
  Star,
  Award,
  Package,
  Briefcase
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

interface CompanyProfile {
  id: string;
  name: string;
  type: 'ecp' | 'lab' | 'supplier' | 'hybrid';
  email: string;
  phone?: string;
  website?: string;
  status: string;
  profile?: {
    profileHeadline?: string;
    profileDescription?: string;
    tagline?: string;
    specialties?: string[];
    certifications?: string[];
    equipment?: string[];
    serviceArea?: string;
    connectionsCount?: number;
    isMarketplaceVisible?: boolean;
    marketplaceVerified?: boolean;
  };
  connectionStatus: 'active' | 'pending' | 'rejected' | 'disconnected' | 'pending_request' | 'not_connected';
  canConnect: boolean;
  isOwnCompany: boolean;
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

export default function CompanyProfilePage() {
  const [, params] = useRoute("/marketplace/companies/:id");
  const [, setLocation] = useLocation();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (params?.id) {
      loadCompanyProfile(params.id);
    }
  }, [params?.id]);

  const loadCompanyProfile = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marketplace/companies/${id}`);
      
      if (!response.ok) throw new Error('Failed to load company profile');
      
      const data = await response.json();
      setCompany(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load company profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestConnection = async () => {
    if (!company) return;
    
    try {
      setSubmitting(true);
      const response = await fetch('/api/marketplace/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCompanyId: company.id,
          message: connectionMessage || 'I would like to connect with your company.'
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

      setShowConnectionDialog(false);
      setConnectionMessage('');
      
      // Reload profile to update status
      loadCompanyProfile(company.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">Company not found</h3>
            <Button onClick={() => setLocation('/marketplace')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getConnectionButton = () => {
    if (company.isOwnCompany) {
      return (
        <Button onClick={() => setLocation('/marketplace/my-profile')}>
          Edit Profile
        </Button>
      );
    }

    if (company.connectionStatus === 'active') {
      return (
        <Badge className="bg-green-100 text-green-800 px-4 py-2">
          <CheckCircle className="w-4 h-4 mr-2" />
          Connected
        </Badge>
      );
    }

    if (company.connectionStatus === 'pending_request') {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          Request Pending
        </Badge>
      );
    }

    if (company.canConnect && company.connectionStatus === 'not_connected') {
      return (
        <Button onClick={() => setShowConnectionDialog(true)}>
          <LinkIcon className="w-4 h-4 mr-2" />
          Request Connection
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => setLocation('/marketplace')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Marketplace
      </Button>

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={companyTypeColors[company.type]}>
                  {companyTypeLabels[company.type]}
                </Badge>
                {company.profile?.marketplaceVerified && (
                  <Badge variant="outline" className="text-blue-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verified
                  </Badge>
                )}
                <Badge variant="outline">
                  {company.status}
                </Badge>
              </div>

              <CardTitle className="text-3xl mb-2 flex items-center gap-3">
                <Building2 className="w-8 h-8" />
                {company.name}
              </CardTitle>

              {company.profile?.tagline && (
                <CardDescription className="text-lg italic">
                  &ldquo;{company.profile.tagline}&rdquo;
                </CardDescription>
              )}
            </div>

            <div className="flex flex-col items-end gap-3">
              {getConnectionButton()}
              
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-5 h-5" />
                <span className="font-semibold">{company.profile?.connectionsCount || 0}</span>
                <span>connections</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {company.profile?.profileHeadline && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-lg mb-2">
                  {company.profile.profileHeadline}
                </h3>
                {company.profile.profileDescription && (
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {company.profile.profileDescription}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Specialties */}
          {company.profile?.specialties && company.profile.specialties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Specialties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {company.profile.specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          {company.profile?.certifications && company.profile.certifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Certifications & Accreditations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {company.profile.certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Equipment */}
          {company.profile?.equipment && company.profile.equipment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Equipment & Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {company.profile.equipment.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Contact Info */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">
                      {company.email}
                    </a>
                  </div>
                </div>
              )}

              {company.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <a href={`tel:${company.phone}`} className="text-blue-600 hover:underline">
                      {company.phone}
                    </a>
                  </div>
                </div>
              )}

              {company.website && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Website</p>
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                </div>
              )}

              {company.profile?.serviceArea && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Service Area</p>
                    <p className="font-medium">{company.profile.serviceArea}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connection Request Dialog */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Connection</DialogTitle>
            <DialogDescription>
              Send a connection request to {company.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Message (Optional)
              </label>
              <Textarea
                placeholder="Introduce yourself and explain why you'd like to connect..."
                value={connectionMessage}
                onChange={(e) => setConnectionMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConnectionDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestConnection}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
