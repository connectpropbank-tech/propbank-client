import { Helmet } from "react-helmet-async";
import { Building2, Plus, Edit3, MessageSquare, MoreVertical, Users, UserPlus, Eye, Edit, Trash2, Wrench, Filter, Home, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/services/visitService";

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
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("");
  const [selectedListingType, setSelectedListingType] = useState<string>("");
  
  // Toggle states for "Want to Sell" - default false for all properties
  const [wantToSellToggles, setWantToSellToggles] = useState<{[key: string]: boolean}>({});

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
      
      const response = await fetch(`${API_BASE_URL}/properties?ownerUID=${ownerUID}`, {
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
        setFilteredProperties(data.properties || []);
      } else {
        console.error("Failed to fetch properties:", data.message);
        setProperties([]);
        setFilteredProperties([]);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperties([]);
      setFilteredProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter properties based on current filter criteria
  const applyFilters = () => {
    let filtered = [...properties];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(property =>
        property.title?.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.description?.toLowerCase().includes(query)
      );
    }

    // Filter by property type
    if (selectedPropertyType && selectedPropertyType !== "all") {
      filtered = filtered.filter(property =>
        property.propertyType?.toLowerCase() === selectedPropertyType.toLowerCase()
      );
    }

    // Filter by listing type
    if (selectedListingType && selectedListingType !== "all") {
      filtered = filtered.filter(property =>
        property.listingType?.toLowerCase() === selectedListingType.toLowerCase()
      );
    }

    setFilteredProperties(filtered);
  };

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedPropertyType, selectedListingType, properties]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedPropertyType("");
    setSelectedListingType("");
    setFilteredProperties(properties);
  };

  const hasActiveFilters = searchQuery.trim() || selectedPropertyType || selectedListingType;

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

  const handleToggleToSell = async (propertyId: string, propertyTitle: string) => {
    try {
      // Update the property listing type to 'sell'
      const updateResponse = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingType: 'sell'
        }),
      });

      const updateData = await updateResponse.json();
      
      if (updateData.success) {
        // Create admin notification
        const notificationResponse = await fetch('${API_BASE_URL}/admin/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'property_listing_change',
            title: 'Property Listing Type Changed',
            message: `Property "${propertyTitle}" has been switched from rent to sell by the owner.`,
            propertyId: propertyId,
            ownerId: user?.uid,
            ownerName: user?.displayName || user?.email || 'Unknown Owner',
            timestamp: new Date().toISOString(),
            isRead: false,
            priority: 'medium'
          }),
        });

        const notificationData = await notificationResponse.json();
        
        if (notificationData.success) {
          console.log('Admin notification created successfully');
        } else {
          console.error('Failed to create admin notification:', notificationData.message);
        }

        // Update local state to reflect the change
        setProperties(prevProperties =>
          prevProperties.map(prop =>
            prop.id === propertyId 
              ? { ...prop, listingType: 'sell' }
              : prop
          )
        );

        setFilteredProperties(prevFiltered =>
          prevFiltered.map(prop =>
            prop.id === propertyId 
              ? { ...prop, listingType: 'sell' }
              : prop
          )
        );

        // Show success message
        toast({
          title: "Success",
          description: `Property "${propertyTitle}" has been switched to sell mode. Admin has been notified.`,
        });
        
      } else {
        console.error('Failed to update property:', updateData.message);
        toast({
          title: "Error",
          description: "Failed to update property listing type. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating property listing type:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating the property. Please try again.",
        variant: "destructive",
      });
    }
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
         
          {/* Property Type Filter */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground/80">Property Types</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={!selectedPropertyType || selectedPropertyType === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedPropertyType("")}
              >
                <Home className="h-4 w-4 mr-2" />
                All Properties
              </Button>
              <Button 
                variant={selectedPropertyType === "residential" ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedPropertyType(selectedPropertyType === "residential" ? "" : "residential")}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Residential
              </Button>
              <Button 
                variant={selectedPropertyType === "commercial" ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedPropertyType(selectedPropertyType === "commercial" ? "" : "commercial")}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Commercial
              </Button>
              <Button 
                variant={selectedPropertyType === "industrial" ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedPropertyType(selectedPropertyType === "industrial" ? "" : "industrial")}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Industrial
              </Button>
            </div>
          </div>

          {/* Listing Type Filter */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground/80">Listing Types</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={!selectedListingType || selectedListingType === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedListingType("")}
              >
                All Listings
              </Button>
              <Button 
                variant={selectedListingType === "rent" ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedListingType(selectedListingType === "rent" ? "" : "rent")}
              >
                For Rent
              </Button>
              <Button 
                variant={selectedListingType === "sell" ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedListingType(selectedListingType === "sell" ? "" : "sell")}
              >
                For Sale
              </Button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  <div className="flex gap-1 flex-wrap">
                    {searchQuery && (
                      <Badge variant="secondary" className="text-xs">
                        "{searchQuery.length > 15 ? `${searchQuery.substring(0, 15)}...` : searchQuery}"
                      </Badge>
                    )}
                    {selectedPropertyType && selectedPropertyType !== "all" && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {selectedPropertyType}
                      </Badge>
                    )}
                    {selectedListingType && selectedListingType !== "all" && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {selectedListingType === "rent" ? "For Rent" : "For Sale"}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear All
                </Button>
              </div>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredProperties.length} of {properties.length} properties
                </p>
              </div>
            </div>
          )}

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
            filteredProperties.length > 0 ? (
              filteredProperties.map((property, index) => (
                <Card key={property.id} className="border-2 border-muted hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <span className="text-xl font-semibold">{index + 1}.</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2 flex-1">
                                <div className="font-semibold text-lg">{property.title}</div>
                                <span className="text-muted-foreground">({property.address}, {property.city}, {property.state} {property.zipCode})</span>
                              </div>
                              {/* Show Want to Sell toggle only for rent properties - positioned on the right */}
                              {property.listingType === 'rent' && (
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-foreground">Want to Sell?</span>
                                  {/* Toggle Switch with dark blue color */}
                                  <button
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                      wantToSellToggles[property.id] ? 'bg-slate-800' : 'bg-gray-300'
                                    }`}
                                    onClick={() => {
                                      const currentState = wantToSellToggles[property.id] || false;
                                      
                                      if (!currentState) {
                                        // Ask for confirmation before changing to sell
                                        const confirmed = window.confirm(
                                          `Are you sure you want to change "${property.title}" from rent to sell?\n\nThis will permanently change the listing type and notify the admin.`
                                        );
                                        
                                        if (confirmed) {
                                          // Call the existing handleToggleToSell function
                                          handleToggleToSell(property.id, property.title);
                                          
                                          // Also update the local toggle state
                                          setWantToSellToggles(prev => ({
                                            ...prev,
                                            [property.id]: true
                                          }));
                                        }
                                      } else {
                                        // No confirmation needed to turn off
                                        setWantToSellToggles(prev => ({
                                          ...prev,
                                          [property.id]: false
                                        }));
                                        console.log('Property no longer marked for sale:', property.id);
                                      }
                                    }}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        wantToSellToggles[property.id] ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                </div>
                              )}
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
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>📅 Last modified: {new Date(property.updatedAt).toLocaleDateString()} at {new Date(property.updatedAt).toLocaleTimeString()}</span>
                                {property.listingType && (
                                  <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                                    {property.listingType === 'rent' ? 'Rent' : property.listingType === 'sell' ? 'Sell' : property.listingType}
                                  </Badge>
                                )}
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
                {hasActiveFilters ? (
                  <>
                    <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="mb-2">No properties match your current filters</p>
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>No properties added yet. Click "Add Property" to get started.</p>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
};

export default ManageProperty;