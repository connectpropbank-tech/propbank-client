import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PropertyTypeSelector from "@/components/PropertyTypeSelector";
import PropertySearchForm from "@/components/PropertySearchForm";
import CommercialPropertySearchForm from "@/components/CommercialPropertySearchForm";
import PropertyCard, { Property } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { propertyService, Property as PropertyType } from "@/services/propertyService";
import { useToast } from "@/hooks/use-toast";

const Buy = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Load properties for sale when component mounts or search query changes
  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
    loadProperties(query);
  }, [searchParams]);

  const loadProperties = async (query: string = '') => {
    try {
      setLoading(true);
      const results = await propertyService.searchProperties(query, 'buy');
      setProperties(results);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProperties(searchQuery);
  };

  const handleFormSubmit = (data: any) => {
    setFormData(data);
    // Load properties based on form data
    loadProperties();
  };

  const handleBackToTypes = () => {
    setSelectedType(null);
    setFormData(null);
  };

  const handleBackToForm = () => {
    setFormData(null);
  };

  const formatPropertyForCard = (property: PropertyType): Property => ({
    id: property.id,
    title: property.title || 'Property',
    price: property.price > 0 ? `₹${property.price.toLocaleString()}` : 'Price on request',
    location: property.address || property.city || 'Location not specified',
    type: 'sale',
    furnishedCount: property.furnishedChecklist?.length || 0
  });

  // Step 1: Property Type Selection
  if (!selectedType) {
    return (
      <>
        <Helmet>
          <title>Buy Property — ShoPROP Real Estate</title>
          <meta name="description" content="Browse properties for sale on ShoPROP. Find your next home with ease." />
          <link rel="canonical" href="/buy" />
        </Helmet>
        <PropertyTypeSelector
          title="Buy Property"
          description="Choose the type of property you want to buy"
          onSelect={setSelectedType}
        />
      </>
    );
  }

  // Step 2: Search Form (for residential and commercial properties)
  if ((selectedType === 'residential' || selectedType === 'commercial') && !formData) {
    return (
      <>
        <Helmet>
          <title>Buy {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Property — ShoPROP Real Estate</title>
          <meta name="description" content={`Find your perfect ${selectedType} property. Fill in your preferences to get matched with suitable properties.`} />
          <link rel="canonical" href={`/buy/${selectedType}`} />
        </Helmet>
        {selectedType === 'residential' ? (
          <PropertySearchForm
            propertyType={selectedType}
            onSubmit={handleFormSubmit}
            onBack={handleBackToTypes}
          />
        ) : (
          <CommercialPropertySearchForm
            propertyType={selectedType}
            onSubmit={handleFormSubmit}
            onBack={handleBackToTypes}
          />
        )}
      </>
    );
  }

  // Default view: Show all properties for sale with search functionality
  return (
    <main className="container mx-auto py-10">
      <Helmet>
        <title>Buy Property — ShoPROP Real Estate</title>
        <meta name="description" content="Browse properties for sale on ShoPROP. Find your next home with ease." />
        <link rel="canonical" href="/buy" />
      </Helmet>
      
      <div className="mb-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Properties for Sale</h1>
          <p className="text-muted-foreground">Find your perfect property from our collection</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
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
      </div>
      
      {/* Properties Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Loading Properties...</h3>
          <p className="text-muted-foreground">Please wait while we fetch available properties</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Properties Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? `No properties found for "${searchQuery}"` : 'No properties available for sale at the moment'}
          </p>
          {searchQuery && (
            <Button variant="outline" onClick={() => { setSearchQuery(''); loadProperties(''); }}>
              Show All Properties
            </Button>
          )}
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={formatPropertyForCard(property)} 
              ctaLabel="View Details" 
              onAction={() => window.location.href = `/property/${property.id}`} 
            />
          ))}
        </section>
      )}
    </main>
  );
};

export default Buy;
