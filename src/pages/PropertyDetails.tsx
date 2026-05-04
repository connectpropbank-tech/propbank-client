import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, MapPin, Home, Calendar, CheckCircle, ClipboardList, FileText, Scale, Wrench, RefreshCw, FileX, Image as ImageIcon, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { API_BASE_URL } from "../utils/config";

// Raised Request interface for service requests, inspection reports, etc.
interface RaisedRequest {
  id: string;
  type: string;
  title: string;
  message: string;
  propertyId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  serviceType?: string;
  serviceComment?: string;
  serviceImage?: string;
  timestamp: string;
  isRead: boolean;
  resolvedAt?: string; // Timestamp when marked as resolved
  priority?: string;
  adminRemarks?: string;
  adminImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface SpouseInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employmentStatus: string;
  employer: string;
  notes: string;
}

interface TenantInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  isMarried: boolean;
  spouse: SpouseInfo | null;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: string;
  securityDeposit: string;
  paymentDueDate: string;
  escalationPercentage: string;
  escalationAmount: string;
  previousAddress: string;
  employmentStatus: string;
  employer: string;
  monthlyIncome: string;
  notes: string;
  isActive: boolean;
  rentSchedule?: Array<{
    year: string;
    amount: string;
    fromDate: string;
    toDate: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface BuyerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  offerAmount: string;
  financingType: string;
  preApprovalAmount: string;
  closingDate: string;
  currentAddress: string;
  employmentStatus: string;
  employer: string;
  annualIncome: string;
  agentName: string;
  agentPhone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Property {
  id: string;
  title: string;
  propertyType: string;
  configuration: string;
  listingType: string;

  // Unit Details
  unitNumber: string;
  floor: string;
  buildingName: string;
  location: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;

  // Area Details
  carpetArea: string;
  plotArea: string;
  constructedArea: string;
  squareFeet: number;

  // Tenant Information
  personName: string;
  mobileNumber: string;
  primaryNo: string;
  ultNo: string;
  emergencyContact: string;

  // Tenant Employment Details
  employmentStatus: string;
  employer: string;

  // Tenant Spouse Information
  isMarried: boolean;
  spouseFirstName: string;
  spouseLastName: string;
  spouseEmail: string;
  spousePhone: string;
  spouseEmploymentStatus: string;
  spouseEmployer: string;
  spouseNotes: string;

  // Pricing Details
  monthlyRent: string;
  sellingPrice: string;

  // Monthly Rent Details
  monthlyRent1stYear: string;
  monthlyRent2ndYear: string;
  monthlyRent3rdYear: string;
  monthlyRent4thYear: string;
  rentFromDate1: string;
  rentToDate1: string;
  rentFromDate2: string;
  rentToDate2: string;
  rentSchedule?: Array<{
    year: string;
    amount: string;
    fromDate: string;
    toDate: string;
  }>;

  // Payment Details
  paymentDueDate: string;
  escalationPercentage: string;
  escalationAmount: string;

  // Security & Agreement
  securityDeposit: string;
  agreementPeriod: string;
  agreementStartDate: string;
  agreementEndDate: string;
  possessionDate: string;

  // Notice & Lock-in
  noticePeriod: string;
  lockInPeriod: string;

  // Unit Condition & Maintenance
  unitCondition: string;
  maintenanceToBePaidBy: string;
  projectCondition: string;
  rentalStatus: string;
  furnishedChecklist: Array<{
    id: string;
    name: string;
    checked: boolean;
    quantity: number;
    category: string;
  }>;

  // Legacy fields
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;

  // Images & Comments
  images: string[];
  internalImages: string[];
  specificComments: string;

  // Tenants
  tenantName?: string;
  tenantEmail?: string;
  tenants: TenantInfo[];

  // Buyers
  buyers: BuyerInfo[];

  // System Info
  ownerUID: string;
  ownerName: string;
  ownerEmail: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PropertyDetails = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [raisedRequests, setRaisedRequests] = useState<RaisedRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isTerminationDialogOpen, setIsTerminationDialogOpen] = useState(false);
  const [selectedNoticePeriod, setSelectedNoticePeriod] = useState("Immediate");
  const [submittingTermination, setSubmittingTermination] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails(propertyId);
      fetchRaisedRequests(propertyId);
    }
  }, [propertyId]);

  const fetchRaisedRequests = async (id: string) => {
    setLoadingRequests(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications?propertyId=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter for request types: service_request, inspection_report, legal_service_request, 
        // other_service_request, agreement_renewal, agreement_termination
        const requestTypes = [
          'service_request',
          'inspection_report',
          'legal_service_request',
          'other_service_request',
          'agreement_renewal',
          'agreement_termination'
        ];
        const filteredRequests = Array.isArray(data)
          ? data.filter((req: RaisedRequest) => requestTypes.includes(req.type))
          : [];
        setRaisedRequests(filteredRequests);
      }
    } catch (error) {

    } finally {
      setLoadingRequests(false);
    }
  };

  const normalizeFurnishedChecklist = (checklist: any): Array<{
    id: string;
    name: string;
    checked: boolean;
    quantity: number;
    category: string;
  }> => {
    if (!checklist || !Array.isArray(checklist)) return [];

    return checklist.map((item: any) => {
      // If it's already in the new format (object with id, name, etc.)
      if (typeof item === 'object' && item !== null && item.name) {
        return {
          id: item.id || `item-${Date.now()}-${Math.random()}`,
          name: item.name,
          checked: item.checked !== undefined ? item.checked : true,
          quantity: item.quantity || 1,
          category: item.category || 'other'
        };
      }
      // If it's the old string format, convert it
      if (typeof item === 'string') {
        return {
          id: `legacy-${Date.now()}-${Math.random()}`,
          name: item,
          checked: true,
          quantity: 1,
          category: 'other'
        };
      }
      return item;
    });
  };

  const fetchPropertyDetails = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Normalize furnished checklist for backward compatibility
        const normalizedProperty = {
          ...data.property,
          furnishedChecklist: normalizeFurnishedChecklist(data.property.furnishedChecklist)
        };
        setProperty(normalizedProperty);
      } else {

      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (property: Property) => {
    if (property.listingType === 'rent') {
      return property.monthlyRent ? `₹${Number(property.monthlyRent).toLocaleString()}/month` : 'Price not set';
    } else if (property.listingType === 'sell') {
      return property.sellingPrice ? `₹${Number(property.sellingPrice).toLocaleString()}` : 'Price not set';
    }
    return 'Price not set';
  };

  const getListingTypeBadge = (listingType: string) => {
    if (listingType === 'rent') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">For Rent</Badge>;
    } else if (listingType === 'sell') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">For Sale</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const handleRequestTermination = () => {
    setIsTerminationDialogOpen(true);
  };

  const submitTerminationRequest = async () => {
    setSubmittingTermination(true);
    try {
      const response = await fetch(`${API_BASE_URL}/agreements/request-termination`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user?.uid || '',
        },
        body: JSON.stringify({
          propertyId: propertyId,
          noticePeriod: selectedNoticePeriod,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Request Sent",
          description: `Termination request with ${selectedNoticePeriod} notice sent to owner.`,
        });
        setIsTerminationDialogOpen(false);
      } else {
        throw new Error(data.message || "Failed to send request");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send termination request",
        variant: "destructive",
      });
      setSubmittingTermination(false);
    }
  };

  // Check if current user is a tenant
  const isTenant = user && property && (
    (property.tenants && property.tenants.some((t: any) => t.isActive && (t.email === user.email || t.phone === user.phoneNumber))) ||
    (property.tenantEmail === user.email) ||
    (property.mobileNumber === user.phoneNumber)
  );

  const isOwner = user && property && user.uid === property.ownerUID;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Property not found</p>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Helmet>
        <title>{property.title} | PropBank</title>
      </Helmet>

      {/* Hero Section */}
      <div className="relative h-[400px] md:h-[500px] bg-gray-900 group">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900 opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent" />

        <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-8 md:pb-12">
          <div className="max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-0 px-3 py-1 text-sm font-medium capitalize">
                {property.propertyType}
              </Badge>
              <Badge variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm px-3 py-1">
                {property.listingType === 'rent' ? 'For Rent' : 'For Sale'}
              </Badge>
              <Badge variant="outline" className={`border-white/30 bg-white/10 backdrop-blur-sm px-3 py-1 ${property.rentalStatus === 'rented' ? 'text-amber-300 border-amber-300/50' : 'text-green-300 border-green-300/50'
                }`}>
                {property.rentalStatus === 'rented' ? 'Rented' : 'Available'}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              {property.title}
            </h1>

            <div className="flex items-center text-gray-300 text-lg">
              <MapPin className="h-5 w-5 mr-2 text-blue-400" />
              {property.location}
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              {isTenant && (
                <Button
                  variant="destructive"
                  onClick={handleRequestTermination}
                  className="shadow-lg hover:shadow-xl transition-all"
                >
                  <FileX className="h-4 w-4 mr-2" />
                  Request Termination
                </Button>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 left-4 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-all backdrop-blur-md"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>{property.address || property.location}, {property.city}, {property.state} {property.zipCode}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-muted-foreground" />
                  <span className="capitalize">{property.propertyType} - {property.configuration}</span>
                </div>

                {/* Unit Condition */}
                {
                  property.unitCondition && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="capitalize">{property.unitCondition}</span>
                    </div>
                  )
                }

                {/* Last Modified */}
                {
                  property.updatedAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Last modified: {new Date(property.updatedAt).toLocaleDateString('en-GB')} at {new Date(property.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  )
                }
              </CardContent >
            </Card >

            <Card>
              <CardHeader>
                <CardTitle>Property Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border bg-gradient-to-br from-gray-100 to-gray-200 relative h-64 flex items-center justify-center">
                  {property.images && property.images.length > 0 && property.images[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover absolute inset-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div className="flex items-center justify-center text-gray-400 flex-col gap-2">
                    <Home className="h-16 w-16" />
                    <span className="text-sm">No image available</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Internal Images */}
            {
              property.internalImages && property.internalImages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Internal Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {property.internalImages.map((img, index) => (
                        <div key={index} className="rounded-lg overflow-hidden border bg-gray-100 relative h-32 flex items-center justify-center group">
                          <img
                            src={img}
                            alt={`Internal ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            }

            {/* Unit Details */}
            <Card>
              <CardHeader>
                <CardTitle>Unit Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Unit Number</label>
                    <p className="text-sm">{property.unitNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Floor</label>
                    <p className="text-sm">{property.floor || 'N/A'}</p>
                  </div>
                  {property.buildingName && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Building Name</label>
                      <p className="text-sm">{property.buildingName}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="text-sm">{property.location || property.address || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Area Details */}
            <Card>
              <CardHeader>
                <CardTitle>Area Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-semibold">{property.carpetArea || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">Carpet Area</div>
                  </div>
                  {property.plotArea && (
                    <div className="text-center">
                      <div className="text-xl font-semibold">{property.plotArea}</div>
                      <div className="text-sm text-muted-foreground">Plot Area</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-xl font-semibold">{property.constructedArea || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">Constructed Area</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tenant Information */}
            {
              (property.tenantName || property.personName || property.mobileNumber || property.employmentStatus) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tenant Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.tenantName && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Tenant Name</label>
                          <p className="text-sm">{property.tenantName}</p>
                        </div>
                      )}
                      {property.personName && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Person Name</label>
                          <p className="text-sm">{property.personName}</p>
                        </div>
                      )}
                      {property.mobileNumber && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                          <p className="text-sm">{property.mobileNumber}</p>
                        </div>
                      )}
                      {property.primaryNo && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Primary Number</label>
                          <p className="text-sm">{property.primaryNo}</p>
                        </div>
                      )}
                      {property.ultNo && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Alt Number</label>
                          <p className="text-sm">{property.ultNo}</p>
                        </div>
                      )}
                      {property.emergencyContact && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                          <p className="text-sm">{property.emergencyContact}</p>
                        </div>
                      )}
                      {property.employmentStatus && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Employment Status</label>
                          <p className="text-sm capitalize">{property.employmentStatus}</p>
                        </div>
                      )}
                      {property.employer && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Employer</label>
                          <p className="text-sm">{property.employer}</p>
                        </div>
                      )}
                    </div>

                    {/* Spouse Information */}
                    {property.isMarried && (property.spouseFirstName || property.spousePhone) && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-3">Spouse Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(property.spouseFirstName || property.spouseLastName) && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Spouse Name</label>
                              <p className="text-sm">{property.spouseFirstName} {property.spouseLastName}</p>
                            </div>
                          )}
                          {property.spouseEmail && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Spouse Email</label>
                              <p className="text-sm">{property.spouseEmail}</p>
                            </div>
                          )}
                          {property.spousePhone && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Spouse Phone</label>
                              <p className="text-sm">{property.spousePhone}</p>
                            </div>
                          )}
                          {property.spouseEmploymentStatus && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Spouse Employment</label>
                              <p className="text-sm capitalize">{property.spouseEmploymentStatus}</p>
                            </div>
                          )}
                          {property.spouseEmployer && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Spouse Employer</label>
                              <p className="text-sm">{property.spouseEmployer}</p>
                            </div>
                          )}
                          {property.spouseNotes && (
                            <div className="md:col-span-2">
                              <label className="text-sm font-medium text-muted-foreground">Spouse Notes</label>
                              <p className="text-sm">{property.spouseNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            }

            {/* Agreement & Security Details */}
            {
              (property.securityDeposit || property.agreementPeriod || property.agreementStartDate || property.agreementEndDate || property.noticePeriod) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Agreement & Security</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.securityDeposit && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Security Deposit</label>
                          <p className="text-sm font-semibold">₹{Number(property.securityDeposit).toLocaleString()}</p>
                        </div>
                      )}
                      {property.agreementPeriod && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Agreement Period</label>
                          <p className="text-sm">{property.agreementPeriod}</p>
                        </div>
                      )}
                      {property.agreementStartDate && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Agreement Start Date</label>
                          <p className="text-sm">{new Date(property.agreementStartDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {property.agreementEndDate && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Agreement End Date</label>
                          <p className="text-sm">{new Date(property.agreementEndDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {property.noticePeriod && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Notice Period</label>
                          <p className="text-sm">{property.noticePeriod}</p>
                        </div>
                      )}
                      {property.lockInPeriod && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Lock-in Period</label>
                          <p className="text-sm">{property.lockInPeriod}</p>
                        </div>
                      )}
                      {property.paymentDueDate && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Payment Due Date</label>
                          <p className="text-sm">{property.paymentDueDate} of each month</p>
                        </div>
                      )}
                      {property.escalationPercentage && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Annual Escalation</label>
                          <p className="text-sm">{property.escalationPercentage}%</p>
                        </div>
                      )}
                      {property.escalationAmount && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Escalation Amount</label>
                          <p className="text-sm font-semibold">₹{Number(property.escalationAmount).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            }

            {/* Unit Condition & Maintenance */}
            {
              (property.unitCondition || property.maintenanceToBePaidBy || property.rentalStatus || property.projectCondition || property.possessionDate) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Unit Condition & Maintenance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.unitCondition && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Unit Condition</label>
                          <p className="text-sm capitalize">{property.unitCondition}</p>
                        </div>
                      )}
                      {property.maintenanceToBePaidBy && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Maintenance To Be Paid By</label>
                          <p className="text-sm capitalize">{property.maintenanceToBePaidBy}</p>
                        </div>
                      )}
                      {property.rentalStatus && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Rental Status</label>
                          <p className="text-sm capitalize">{property.rentalStatus}</p>
                        </div>
                      )}
                      {property.projectCondition && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Project Condition</label>
                          <p className="text-sm">{property.projectCondition}</p>
                        </div>
                      )}
                      {property.possessionDate && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Possession Date</label>
                          <p className="text-sm">{new Date(property.possessionDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            }

            {/* Furnished Checklist */}
            {
              property.furnishedChecklist && property.furnishedChecklist.filter((item: any) => item.checked).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Furnished Items ({property.furnishedChecklist.filter((item: any) => item.checked).length})
                    </CardTitle>
                    <CardDescription>
                      Items included with this property
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Group items by category */}
                    {(() => {
                      const checkedItems = property.furnishedChecklist.filter((item: any) => item.checked);
                      const groupedByCategory = checkedItems.reduce((acc: any, item: any) => {
                        const category = item.category || 'other';
                        if (!acc[category]) {
                          acc[category] = [];
                        }
                        acc[category].push(item);
                        return acc;
                      }, {});

                      const categoryLabels: Record<string, string> = {
                        basic: 'Basic Furnishing',
                        kitchen: 'Kitchen Items',
                        bedroom: 'Bedroom Items',
                        living: 'Living Room Items',
                        appliances: 'Appliances',
                        semifurnished: 'Semi Furnished Items',
                        office: 'Office Furniture & Setup',
                        infrastructure: 'Infrastructure & IT',
                        safety: 'Safety & Security',
                        machinery: 'Machinery & Equipment',
                        storage: 'Storage & Warehouse',
                        utilities: 'Utilities & Amenities',
                        other: 'Custom Items'
                      };

                      return (
                        <div className="space-y-4">
                          {Object.entries(groupedByCategory).map(([category, items]: [string, any]) => (
                            <div key={category} className="space-y-2">
                              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                {categoryLabels[category] || category}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {items.map((item: any, index: number) => (
                                  <div
                                    key={item.id || index}
                                    className="flex items-center justify-between space-x-3 bg-green-50 border border-green-200 rounded-lg p-3 hover:bg-green-100 transition-colors"
                                  >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-gray-800 block truncate">
                                          {item.name}
                                        </span>
                                        {item.category === 'other' && (
                                          <span className="text-xs text-muted-foreground italic">Custom Item</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded whitespace-nowrap">
                                        Qty: {item.quantity || 1}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    <div className="mt-4 pt-3 border-t bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <p className="text-sm font-medium text-blue-800">
                            Total: {property.furnishedChecklist.filter((item: any) => item.checked).length} item{property.furnishedChecklist.filter((item: any) => item.checked).length !== 1 ? 's' : ''}
                            ({property.furnishedChecklist.filter((item: any) => item.checked).reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)} total quantity)
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            {/* Comments */}
            {
              property.specificComments && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Comments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{property.specificComments}</p>
                  </CardContent>
                </Card>
              )
            }

            {/* Tenants Information - Moved below Additional Comments */}
            {
              property.tenants && property.tenants.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Current Tenants ({property.tenants.length})
                    </CardTitle>
                    <CardDescription>
                      Active tenants for this property
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {property.tenants.filter(tenant => tenant.isActive).map((tenant, index) => (
                        <div key={tenant.id}>
                          {index > 0 && <div className="border-t pt-6 mt-6"></div>}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-base">
                                {tenant.firstName} {tenant.lastName}
                              </h4>
                              <p className="text-sm text-muted-foreground">{tenant.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Tenant {index + 1}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Phone</label>
                              <p className="text-sm">{tenant.phone}</p>
                            </div>
                            {tenant.monthlyRent && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Monthly Rent</label>
                                <p className="text-sm font-semibold">₹{Number(tenant.monthlyRent).toLocaleString()}</p>
                              </div>
                            )}
                            {tenant.leaseStartDate && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Lease Start</label>
                                <p className="text-sm">{new Date(tenant.leaseStartDate).toLocaleDateString()}</p>
                              </div>
                            )}
                            {tenant.leaseEndDate && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Lease End</label>
                                <p className="text-sm">{new Date(tenant.leaseEndDate).toLocaleDateString()}</p>
                              </div>
                            )}
                            {tenant.employer && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Employer</label>
                                <p className="text-sm">{tenant.employer}</p>
                              </div>
                            )}
                            {tenant.paymentDueDate && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Payment Due</label>
                                <p className="text-sm">{tenant.paymentDueDate}th of each month</p>
                              </div>
                            )}
                            {tenant.escalationPercentage && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Annual Escalation</label>
                                <p className="text-sm">{tenant.escalationPercentage}</p>
                              </div>
                            )}
                            {tenant.emergencyContact && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                                <p className="text-sm">{tenant.emergencyContact}</p>
                              </div>
                            )}
                            {tenant.updatedAt && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Last Modified</label>
                                <p className="text-sm">{new Date(tenant.updatedAt).toLocaleDateString('en-GB')} at {new Date(tenant.updatedAt).toLocaleTimeString()}</p>
                              </div>
                            )}
                          </div>

                          {/* Rent Schedule Display */}
                          {tenant.rentSchedule && tenant.rentSchedule.length > 0 && (
                            <div className="mt-4 border rounded-md overflow-hidden">
                              <div className="bg-muted px-4 py-2 text-sm font-medium border-b">
                                Monthly Rent Schedule
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-muted/50 text-left">
                                      <th className="px-4 py-2 font-medium bg-muted/30">Year</th>
                                      <th className="px-4 py-2 font-medium bg-muted/30">Amount</th>
                                      <th className="px-4 py-2 font-medium bg-muted/30">From</th>
                                      <th className="px-4 py-2 font-medium bg-muted/30">To</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tenant.rentSchedule.map((item, idx) => (
                                      <tr key={idx} className="border-t">
                                        <td className="px-4 py-2">{item.year}</td>
                                        <td className="px-4 py-2">₹{Number(item.amount).toLocaleString()}</td>
                                        <td className="px-4 py-2">{new Date(item.fromDate).toLocaleDateString()}</td>
                                        <td className="px-4 py-2">{new Date(item.toDate).toLocaleDateString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {tenant.notes && (
                            <div className="mt-4">
                              <label className="text-sm font-medium text-muted-foreground">Notes</label>
                              <p className="text-sm">{tenant.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            }

            {/* Service Request History Section */}
            {
              raisedRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Service Request History ({raisedRequests.length})
                    </CardTitle>
                    <CardDescription>
                      All service requests for this property
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {raisedRequests.map((request, index) => {
                        const getRequestTypeLabel = (type: string) => {
                          switch (type) {
                            case 'service_request': return 'Service Request';
                            case 'inspection_report': return 'Inspection Report';
                            case 'legal_service_request': return 'Legal Service';
                            case 'other_service_request': return 'Other Service';
                            case 'agreement_renewal': return 'Agreement Renewal';
                            case 'agreement_termination': return 'Agreement Termination';
                            default: return 'Request';
                          }
                        };

                        const getRequestIcon = (type: string) => {
                          switch (type) {
                            case 'service_request': return <Wrench className="h-4 w-4" />;
                            case 'inspection_report': return <ClipboardList className="h-4 w-4" />;
                            case 'legal_service_request': return <Scale className="h-4 w-4" />;
                            case 'other_service_request': return <FileText className="h-4 w-4" />;
                            case 'agreement_renewal': return <RefreshCw className="h-4 w-4" />;
                            case 'agreement_termination': return <FileX className="h-4 w-4" />;
                            default: return <FileText className="h-4 w-4" />;
                          }
                        };

                        const getStatusBadge = (request: RaisedRequest) => {
                          if (request.isRead) {
                            return (
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolved
                                </Badge>
                                {request.resolvedAt && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(request.resolvedAt).toLocaleDateString()} at {new Date(request.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            );
                          }
                          return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
                        };

                        return (
                          <div key={request.id} className="p-4 border rounded-lg bg-muted/20">
                            {index > 0 && <div className="border-t -mt-4 mb-4"></div>}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  {getRequestIcon(request.type)}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm">{getRequestTypeLabel(request.type)}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(request.timestamp || request.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              {getStatusBadge(request)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {request.serviceType && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">Service Type</label>
                                  <p className="text-sm capitalize">{request.serviceType.replace(/_/g, ' ')}</p>
                                </div>
                              )}
                              {request.title && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">Title</label>
                                  <p className="text-sm">{request.title}</p>
                                </div>
                              )}
                              {request.userName && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">Requested By</label>
                                  <p className="text-sm">{request.userName}</p>
                                </div>
                              )}
                              {request.userPhone && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">Contact</label>
                                  <p className="text-sm">{request.userPhone}</p>
                                </div>
                              )}
                            </div>

                            {request.serviceComment && (
                              <div className="mt-3 pt-3 border-t">
                                <label className="text-xs font-medium text-muted-foreground">Comment</label>
                                <p className="text-sm">{request.serviceComment}</p>
                              </div>
                            )}

                            {request.message && !request.serviceComment && (
                              <div className="mt-3 pt-3 border-t">
                                <label className="text-xs font-medium text-muted-foreground">Message</label>
                                <p className="text-sm">{request.message}</p>
                              </div>
                            )}

                            {(request.adminRemarks || request.adminImage) && (
                              <div className="mt-3 pt-3 border-t bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageSquare className="h-3.5 w-3.5 text-blue-700" />
                                  <label className="text-xs font-bold text-blue-800 uppercase tracking-wider">Admin Response</label>
                                </div>
                                {request.adminRemarks && (
                                  <p className="text-sm text-blue-900 font-medium italic mb-2">"{request.adminRemarks}"</p>
                                )}
                                {request.adminImage && (
                                  <div className="mt-2">
                                    <img 
                                      src={request.adminImage} 
                                      alt="Admin attachment" 
                                      className="max-w-full h-auto max-h-48 rounded border border-blue-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(request.adminImage, '_blank')}
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {isOwner && !request.resolvedAt && (request.type === 'agreement_termination' || request.type === 'agreement_renewal') && (
                              <div className="mt-3 pt-3 border-t flex justify-end">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    if (request.type === 'agreement_termination') navigate(`/terminate-agreement/${propertyId}`);
                                    if (request.type === 'agreement_renewal') navigate(`/renew-agreement/${propertyId}`);
                                  }}
                                >
                                  Review & {request.type === 'agreement_termination' ? 'Terminate' : 'Renew'}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            }
          </div >

          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatPrice(property)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  Listed on {new Date(property.createdAt).toLocaleDateString()}
                </div>

                {/* Detailed Rent Information for Rentals */}
                {property.listingType === 'rent' && (
                  <div className="space-y-3">
                    {property.monthlyRent1stYear && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">1st Year Rent</label>
                        <p className="text-sm font-semibold">₹{Number(property.monthlyRent1stYear).toLocaleString()}/month</p>
                      </div>
                    )}
                    {property.monthlyRent2ndYear && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">2nd Year Rent</label>
                        <p className="text-sm font-semibold">₹{Number(property.monthlyRent2ndYear).toLocaleString()}/month</p>
                      </div>
                    )}
                    {property.monthlyRent3rdYear && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">3rd Year Rent</label>
                        <p className="text-sm font-semibold">₹{Number(property.monthlyRent3rdYear).toLocaleString()}/month</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle>Owner Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Owner Name</label>
                    <p className="text-sm font-medium">{property.ownerName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Owner Email</label>
                    <p className="text-sm">{property.ownerEmail}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Property Status</label>
                    <div className="text-sm mt-1">
                      <Badge variant={property.isActive ? "default" : "secondary"}>
                        {property.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buyers Information */}
            {property.buyers && property.buyers.length > 0 && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Interested Buyers ({property.buyers.length})
                  </CardTitle>
                  <CardDescription>
                    Buyers interested in purchasing this property
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {property.buyers.map((buyer, index) => (
                      <div key={buyer.id} className="p-4 border rounded-lg bg-muted/20">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold">
                            {buyer.firstName} {buyer.lastName}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            Buyer {index + 1}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Email</label>
                            <p>{buyer.email}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Phone</label>
                            <p>{buyer.phone}</p>
                          </div>
                          {buyer.offerAmount && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Offer Amount</label>
                              <p className="font-semibold">₹{Number(buyer.offerAmount).toLocaleString()}</p>
                            </div>
                          )}
                          {buyer.financingType && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Financing</label>
                              <p className="capitalize">{buyer.financingType}</p>
                            </div>
                          )}
                          {buyer.preApprovalAmount && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Pre-approval</label>
                              <p>₹{Number(buyer.preApprovalAmount).toLocaleString()}</p>
                            </div>
                          )}
                          {buyer.closingDate && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Expected Closing</label>
                              <p>{new Date(buyer.closingDate).toLocaleDateString()}</p>
                            </div>
                          )}
                          {buyer.employmentStatus && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Employment</label>
                              <p className="capitalize">{buyer.employmentStatus}</p>
                            </div>
                          )}
                          {buyer.employer && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Employer</label>
                              <p>{buyer.employer}</p>
                            </div>
                          )}
                          {buyer.annualIncome && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Annual Income</label>
                              <p>₹{Number(buyer.annualIncome).toLocaleString()}</p>
                            </div>
                          )}
                        </div>

                        {buyer.agentName && (
                          <div className="mt-3 pt-3 border-t">
                            <label className="text-xs font-medium text-muted-foreground">Real Estate Agent</label>
                            <p className="text-sm">{buyer.agentName} {buyer.agentPhone && `- ${buyer.agentPhone}`}</p>
                          </div>
                        )}

                        {buyer.currentAddress && (
                          <div className="mt-3 pt-3 border-t">
                            <label className="text-xs font-medium text-muted-foreground">Current Address</label>
                            <p className="text-sm">{buyer.currentAddress}</p>
                          </div>
                        )}

                        {buyer.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <label className="text-xs font-medium text-muted-foreground">Notes</label>
                            <p className="text-sm">{buyer.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div >

        <Dialog open={isTerminationDialogOpen} onOpenChange={setIsTerminationDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request Termination</DialogTitle>
              <DialogDescription>
                Notify the owner that you wish to terminate the lease agreement.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <Input
                    id="notice-period"
                    value={selectedNoticePeriod}
                    onChange={(e) => setSelectedNoticePeriod(e.target.value)}
                    placeholder="e.g. 1 Month, 45 Days, etc."
                    className="mt-2"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-800">
                  <p>
                    <strong>Note:</strong> Sending this request will notify the owner.
                    {selectedNoticePeriod === "Immediate"
                      ? " Since you selected 'Immediate', you are requesting to vacate as soon as possible."
                      : ` You are engaging to serve a notice period of ${selectedNoticePeriod}.`
                    }
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button variant="ghost" onClick={() => setIsTerminationDialogOpen(false)}>Cancel</Button>
              <Button onClick={submitTerminationRequest} disabled={submittingTermination}>
                {submittingTermination ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : "Send Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div >
    </div >
  );
};

export default PropertyDetails;
