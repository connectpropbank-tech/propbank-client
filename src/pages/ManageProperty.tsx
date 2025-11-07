import { Helmet } from "react-helmet-async";
import { Building2, Plus, Edit3, MessageSquare, MoreVertical, Users, UserPlus, Eye, Edit, Trash2, Wrench, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface TenantInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: string;
  securityDeposit: string;
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
  description: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  listingType: string; // 'rent' or 'sell'
  monthlyRent: string;
  sellingPrice: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  images: string[];
  tenants?: TenantInfo[];
  buyers?: BuyerInfo[];
  ownerUID: string;
  ownerName: string;
  ownerEmail: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ManageProperty = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    console.log("ManageProperty component mounted");
    
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser);
      setUser(currentUser);
      
      if (currentUser) {
        console.log("User found, fetching properties for:", currentUser.uid);
        fetchProperties(currentUser.uid);
      } else {
        console.log("No user found");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchProperties = async (ownerUID: string) => {
    try {
      console.log("Fetching properties for user:", ownerUID);
      
      const response = await fetch(`http://localhost:8002/properties?ownerUID=${ownerUID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log("Properties fetched successfully:", data.properties);
        console.log("First property sample:", data.properties?.[0]);
        setProperties(data.properties || []);
      } else {
        console.error("Failed to fetch properties:", data.message);
        setProperties([]);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (property: any) => {
    console.log("Property price data:", {
      id: property.id,
      title: property.title,
      listingType: property.listingType,
      price: property.price,
      monthlyRent: property.monthlyRent,
      sellingPrice: property.sellingPrice,
      sellingPriceType: typeof property.sellingPrice,
      sellingPriceValue: property.sellingPrice,
    });

    // Helper function to get a valid price value
    const getValidPrice = (value: any): number => {
      console.log("Converting price:", value, "type:", typeof value);
      
      if (!value) return 0;
      if (value === "") return 0;
      
      let numValue: number;
      if (typeof value === 'string') {
        // Remove any currency symbols, commas, or spaces
        const cleanValue = value.replace(/[₹,$\s]/g, '');
        numValue = parseFloat(cleanValue);
      } else {
        numValue = Number(value);
      }
      
      const result = isNaN(numValue) ? 0 : numValue;
      console.log("Converted to:", result);
      return result;
    };

    if (property.listingType === 'rent') {
      // Try multiple possible field names for monthly rent
      const monthlyRent = getValidPrice(property.monthlyRent) || 
                         getValidPrice(property.monthly_rent) || 
                         getValidPrice(property.price);
      
      if (monthlyRent > 0) {
        return `₹${monthlyRent.toLocaleString()}/month`;
      }
    } else if (property.listingType === 'sell') {
      // Try multiple possible field names for selling price
      const sellingPrice = getValidPrice(property.sellingPrice) || 
                          getValidPrice(property.selling_price) || 
                          getValidPrice(property.price);
      
      console.log("Final selling price calculated:", sellingPrice);
      
      if (sellingPrice > 0) {
        return `₹${sellingPrice.toLocaleString()}`;
      }
    }
    
    // Final fallback to price field
    const genericPrice = getValidPrice(property.price);
    if (genericPrice > 0) {
      return `₹${genericPrice.toLocaleString()}`;
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

  const handleEdit = (propertyId: string) => {
    // Navigate to edit property page
    navigate(`/edit-property/${propertyId}`);
  };

  const handleView = (propertyId: string) => {
    // Navigate to property details page
    navigate(`/property/${propertyId}`);
  };

  const handleAddTenant = (propertyId: string) => {
    // Navigate to add tenant page
    navigate(`/add-tenant/${propertyId}`);
  };

  const handleAddBuyer = (propertyId: string) => {
    // Navigate to add buyer page
    navigate(`/add-buyer/${propertyId}`);
  };

  const handleRequestServices = (propertyId: string) => {
    // Navigate to request services page
    navigate(`/request-services/${propertyId}`);
  };

  console.log("ManageProperty render - User:", user, "Loading:", loading, "Properties:", properties.length);

  return (
    <main className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Manage Property — ShoPROP</title>
        <meta name="description" content="Manage your property listings, update property details, unit numbers, and building information." />
        <link rel="canonical" href="/manage-property" />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Manage Your Properties</h1>
                <p className="text-lg text-muted-foreground">Property Management Hub</p>
              </div>
            </div>
            <Button 
              className="px-12 py-3 rounded-lg border-2 border-primary/20 bg-primary/10 hover:bg-primary/20 transition-colors shadow-sm"
              variant="outline"
              onClick={() => navigate("/select-property-type")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
          <p className="text-muted-foreground">
            Manage your listings and property portfolio.
          </p>
        </div>

        {/* Property List Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Here are your properties</h2>
          </div>

          {/* Properties List */}
          <div className="space-y-4 pb-20">
              {!user ? (
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Please Sign In</h3>
                  <p className="text-muted-foreground mb-4">
                    You need to be signed in to view and manage your properties.
                  </p>
                  <Button onClick={() => navigate("/auth")}>
                    Sign In
                  </Button>
                </div>
              ) 
            : 
              loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Loading properties...</p>
                </div>
              ) 
            : 
            properties.length > 0 ? (
              properties.map((property, index) => (
                <Card key={property.id} className="border-2 border-muted hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <span className="text-xl font-semibold">{index + 1}.</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="font-semibold text-lg">{property.title}</div>
                              {property.listingType && (
                                <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                                  {property.listingType === 'rent' ? 'rent' : property.listingType === 'sell' ? 'sell' : property.listingType}
                                </Badge>
                              )}
                            </div>
                            <div className="text-muted-foreground mb-2">
                              <span className="font-bold ">Address:</span> {property.address}, {property.city}, {property.state} {property.zipCode}
                            </div>
                            {/* <div className="flex items-center gap-4 mb-3">
                              <div className="text-lg font-semibold text-primary">
                                {formatPrice(property.price)}
                              </div>
                            </div> */}
                            <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                              <span>🏠 {property.propertyType.toUpperCase()}</span>
                              {property.squareFeet > 0 && <span>📐 {property.squareFeet} sqft</span>}
                              {property.updatedAt && (
                              <div className="text-sm text-muted-foreground">
                                <span>📅 Last modified: {new Date(property.updatedAt).toLocaleDateString()} at {new Date(property.updatedAt).toLocaleTimeString()}</span>
                              </div>
                             )}
                            </div>
                            
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleView(property.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(property.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Property
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {property.listingType === 'rent' && (
                              <DropdownMenuItem onClick={() => handleAddTenant(property.id)}>
                                {property.tenants && property.tenants.length > 0 ? (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Tenant Details ({property.tenants.length})
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Tenant Info
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            {property.listingType === 'sell' && (
                              <DropdownMenuItem onClick={() => handleAddBuyer(property.id)}>
                                {property.buyers && property.buyers.length > 0 ? (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Buyer Details ({property.buyers.length})
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Buyer Info
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleRequestServices(property.id)}>
                              <Wrench className="h-4 w-4 mr-2" />
                              Request Services
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Property
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No properties added yet. Click "Add Property" to get started.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
};

export default ManageProperty;