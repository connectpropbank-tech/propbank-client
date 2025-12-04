import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, MapPin, Home, Calendar, CheckCircle, ClipboardList, FileText, Scale, Wrench, RefreshCw, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
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
  priority?: string;
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
  tenantName: string;
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
  specificComments: string;
  
  // Tenants
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
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [raisedRequests, setRaisedRequests] = useState<RaisedRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

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
      console.error("Error fetching raised requests:", error);
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
        console.error("Failed to fetch property:", data.message);
      }
    } catch (error) {
      console.error("Error fetching property:", error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <Button onClick={() => navigate("/manage-property")}>
            Back to Properties
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <Helmet>
        <title>{property.title} — Property Details</title>
        <meta name="description" content={`Details for ${property.title}`} />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/manage-property")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Manage Properties
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
              <Eye className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{property.title}</h1>
                {getListingTypeBadge(property.listingType)}
              </div>
              <p className="text-lg text-muted-foreground">Property Details</p>
            </div>
          </div>
        </div>

        {/* Property Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Property Information */}
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
                {property.unitCondition && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="capitalize">{property.unitCondition}</span>
                  </div>
                )}

                {/* Last Modified */}
                {property.updatedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Last modified: {new Date(property.updatedAt).toLocaleDateString('en-GB')} at {new Date(property.updatedAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Image */}
            {property.images && property.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Property Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border">
                    <img 
                      src={property.images[0]} 
                      alt={property.title}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

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
            {(property.tenantName || property.personName || property.mobileNumber || property.employmentStatus) && (
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
            )}

            {/* Agreement & Security Details */}
            {(property.securityDeposit || property.agreementPeriod || property.agreementStartDate || property.agreementEndDate || property.noticePeriod) && (
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
            )}

            {/* Unit Condition & Maintenance */}
            {(property.unitCondition || property.maintenanceToBePaidBy || property.rentalStatus || property.projectCondition || property.possessionDate) && (
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
            )}

            {/* Furnished Checklist */}
            {property.furnishedChecklist && property.furnishedChecklist.filter((item: any) => item.checked).length > 0 && (
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
            )}

            {/* Comments */}
            {property.specificComments && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{property.specificComments}</p>
                </CardContent>
              </Card>
            )}

            {/* Tenants Information - Moved below Additional Comments */}
            {property.tenants && property.tenants.length > 0 && (
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
            )}

            {/* Service Request History Section */}
            {raisedRequests.length > 0 && (
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
                          return <Badge variant="secondary" className="text-xs">Reviewed</Badge>;
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
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

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
        </div>

        {/* Images */}
        {property.images && property.images.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Property Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Property ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
};

export default PropertyDetails;
