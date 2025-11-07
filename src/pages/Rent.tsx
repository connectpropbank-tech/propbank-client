import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Square, Mail, User, Loader2, Home, Building, Search, Filter } from "lucide-react";
import { propertyService, Property } from "@/services/propertyService";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Rent = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadRentalProperties();
  }, []);

  const loadRentalProperties = async (query: string = '') => {
    try {
      setLoading(true);
      const rentalProperties = await propertyService.searchProperties(query, 'rent');
      setProperties(rentalProperties);
      console.log(`✅ Loaded ${rentalProperties.length} rental properties`);
    } catch (error) {
      console.error('Error loading rental properties:', error);
      toast({
        title: "Error",
        description: "Failed to load rental properties. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRentalProperties(searchQuery);
  };

  const formatPrice = (price: number): string => {
    if (price > 0) {
      return `₹${price.toLocaleString()}/month`;
    }
    return "Contact for price";
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'apartment':
      case 'flat':
        return <Building className="h-4 w-4" />;
      case 'house':
      case 'villa':
        return <Home className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Find Rental Properties — ShoPROP</title>
        <meta name="description" content="Discover rental properties on ShoPROP. Apartments, houses, and more for tenants." />
        <link rel="canonical" href="/rent" />
      </Helmet>

      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
            <Search className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Find Rental Properties</h1>
        </div>
        <p className="text-muted-foreground">Discover your next home from our curated selection of rental properties</p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by location, property type, or features (e.g., 2BHK, 3BHK, Mumbai)..."
              className="w-full"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {loading ? "Loading..." : `${properties.length} properties found`}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadRentalProperties()}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Refresh
        </Button>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Loading rental properties...</h3>
          <p className="text-muted-foreground">Please wait while we fetch the latest listings</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {properties.length === 0 ? "No rental properties available" : "No properties match your search"}
          </h3>
          <p className="text-muted-foreground">
            {properties.length === 0 
              ? "Check back later for new listings or contact property owners directly."
              : "Try adjusting your search terms or filters to find more properties."
            }
          </p>
          {searchQuery && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                loadRentalProperties("");
              }}
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Property Image */}
              {property.images && property.images.length > 0 ? (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Building className="h-12 w-12 text-muted-foreground" />
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{property.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      {property.address || property.city}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1 capitalize">
                    {getPropertyTypeIcon(property.propertyType)}
                    {property.propertyType}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Price */}
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(property.price)}
                  </div>

                  {/* Property Details */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {property.bedrooms > 0 && (
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}
                      </div>
                    )}
                    {property.bathrooms > 0 && (
                      <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}
                      </div>
                    )}
                    {property.squareFeet > 0 && (
                      <div className="flex items-center gap-1">
                        <Square className="h-4 w-4" />
                        {property.squareFeet} sqft
                      </div>
                    )}
                  </div>

                  {/* Owner Info */}
                  <div className="pt-3 border-t border-muted">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Listed by {property.ownerName}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Enquire about this property
                    </Button>
                    <Button variant="default" size="sm" className="flex-1">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
};

export default Rent;
