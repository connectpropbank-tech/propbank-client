import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GradientSpotlight from "@/components/GradientSpotlight";
import heroImage from "@/assets/hero-realestate.jpg";
import { Link } from "react-router-dom";
import { Building2, MapPin, Home, Bed, Bath, Square, Loader2, Search, Filter } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { propertyService, Property } from "@/services/propertyService";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/firebase";
import { useSearch } from "@/contexts/SearchContext";

// Utility function to get placeholder image URL
const getPlaceholderImage = (propertyType?: string): string => {
  const type = propertyType?.toLowerCase() || 'property';
  
  if (type.includes('commercial')) {
    return 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  } else if (type.includes('residential')) {
    return 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  } else if (type.includes('industrial')) {
    return 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  } else {
    return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  }
};

const getListingTypeBadge = (listingType?: string) => {
  if (listingType === 'rent') {
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
        For Rent
      </Badge>
    );
  } else if (listingType === 'sell') {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
        For Sale
      </Badge>
    );
  }
  return null;
};

const Index = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedProjectCondition, setSelectedProjectCondition] = useState<string>("");
  const observerTarget = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Use SearchContext for shared state
  const { 
    searchQuery, 
    setSearchQuery,
    searchType, 
    setSearchType,
    selectedCategories,
    setSelectedCategories,
    selectedListingTypes,
    isSearching,
    setIsSearching,
    setOnSearchTrigger
  } = useSearch();

  const ITEMS_PER_PAGE = 12;



  useEffect(() => {
    loadAllProperties();
    
    // Set up the search trigger for header filters
    setOnSearchTrigger(() => handleSearch);
    
    return () => {
      setOnSearchTrigger(null);
    };
  }, [setOnSearchTrigger]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreProperties();
        }
      },
      { threshold: 1.0 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore]);

  const loadAllProperties = async () => {
    try {
      setLoading(true);
      const fetchedProperties = await propertyService.getAllProperties();
      setAllProperties(fetchedProperties);
      
      // Initially show first page of properties
      const initialProperties = fetchedProperties.slice(0, ITEMS_PER_PAGE);
      setProperties(initialProperties);
      setHasMore(fetchedProperties.length > ITEMS_PER_PAGE);
      setPage(1);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProperties = useCallback(() => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    
    // Simulate network delay for smooth UX
    setTimeout(() => {
      const startIndex = page * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const sourceProperties = isSearching ? getFilteredProperties() : allProperties;
      const newProperties = sourceProperties.slice(startIndex, endIndex);
      
      if (newProperties.length > 0) {
        setProperties(prev => [...prev, ...newProperties]);
        setPage(prev => prev + 1);
        setHasMore(endIndex < sourceProperties.length);
      } else {
        setHasMore(false);
      }
      
      setLoadingMore(false);
    }, 500);
  }, [page, hasMore, loadingMore, isSearching, allProperties]);

  const getFilteredProperties = useCallback(() => {
    let filtered = [...allProperties];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(property =>
        property.title?.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.propertyType?.toLowerCase().includes(query) ||
        property.description?.toLowerCase().includes(query)
      );
    }

    // Filter by search type (buy/rent) - Note: backend uses 'sell' for 'buy'
    if (searchType) {
      // This would require listingType field in properties
      // For now, we'll assume all properties can be both bought and rented
      // You can add this logic when the backend provides listingType field
    }

    // Filter by header selected listing types (if any)
    if (selectedListingTypes && selectedListingTypes.length > 0) {
      filtered = filtered.filter(property => {
        if (!property.listingType) return false;
        // Map frontend types to backend types
        return selectedListingTypes.some(type => {
          const backendType = type === 'buy' ? 'sell' : type;
          return property.listingType === backendType;
        });
      });
    }

    // Filter by categories (property types) - use SearchContext categories for header filters
    // or local selectedCategories for homepage category buttons
    const categoriesToFilter = selectedCategories.length > 0 ? selectedCategories : [];
    
    if (categoriesToFilter.length > 0) {
      filtered = filtered.filter(property =>
        categoriesToFilter.some(category =>
          property.propertyType?.toLowerCase().includes(category.toLowerCase())
        )
      );
    }

    // Filter by project condition
    if (selectedProjectCondition && selectedProjectCondition !== "") {
      filtered = filtered.filter(property =>
        property.projectCondition === selectedProjectCondition
      );
    }

    return filtered;
  }, [allProperties, searchQuery, searchType, selectedCategories, selectedListingTypes, selectedProjectCondition]);

  const handleSearch = () => {
    setIsSearching(true);

    const filteredProperties = getFilteredProperties();
    const initialResults = filteredProperties.slice(0, ITEMS_PER_PAGE);
    
    setProperties(initialResults);
    setPage(1);
    setHasMore(filteredProperties.length > ITEMS_PER_PAGE);
    
    if (filteredProperties.length === 0 && (searchQuery.trim() || selectedCategories.length > 0)) {
      toast({
        title: "No Results",
        description: "No properties found matching your search criteria.",
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSearchType("buy");
    setSelectedCategories([]);
    setSelectedProjectCondition("");
    setIsSearching(false);
    setPage(1);
    
    const initialProperties = allProperties.slice(0, ITEMS_PER_PAGE);
    setProperties(initialProperties);
    setHasMore(allProperties.length > ITEMS_PER_PAGE);
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId) 
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    setSelectedCategories(newCategories);
  };

  // Auto-apply filters when categories, search query, search type, or header filters change
  useEffect(() => {
    if (selectedCategories.length > 0 || selectedListingTypes?.length > 0 || searchQuery.trim() || selectedProjectCondition) {
      setIsSearching(true);
      const filteredProperties = getFilteredProperties();
      const initialResults = filteredProperties.slice(0, ITEMS_PER_PAGE);
      
      setProperties(initialResults);
      setPage(1);
      setHasMore(filteredProperties.length > ITEMS_PER_PAGE);
    } else if (!searchQuery.trim() && selectedCategories.length === 0 && (!selectedListingTypes || selectedListingTypes.length === 0) && !selectedProjectCondition) {
      // Show all properties when no filters are applied
      setIsSearching(false);
      const initialProperties = allProperties.slice(0, ITEMS_PER_PAGE);
      setProperties(initialProperties);
      setPage(1);
      setHasMore(allProperties.length > ITEMS_PER_PAGE);
    }
  }, [selectedCategories, selectedListingTypes, searchQuery, searchType, selectedProjectCondition, allProperties, getFilteredProperties]);

  const formatPrice = (property: Property): string => {
    if (property.price > 0) {
      return `₹${property.price.toLocaleString()}`;
    }
    return "Contact for price";
  };

  return (
    <main>
      <Helmet>
        <title>ShoPROP — Buy, Sell & Rent Properties</title>
        <meta name="description" content="Buy, sell, or rent properties with ShoPROP. Modern PWA for real estate with buyer/tenant and seller/landlord profiles." />
        <link rel="canonical" href="/" />
      </Helmet>

      {/* Hero Section */}
      <section aria-label="Hero" className="relative">
        <GradientSpotlight className="">
          <div className="container mx-auto py-16 space-y-12">
            {/* Header with Text and Image */}
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                  Your Real Estate, Simplified
                </h1>
                <p className="text-lg text-muted-foreground lg:text-xl">
                  Buy and sell homes, rent out as a landlord, or find your next place as a tenant — 
                  all in one fast, installable app.
                </p>
                
                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="hero" size="lg">
                    <Link to="/search?types=buy">Browse Properties for Sale</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/search?types=rent">Find Rental Properties</Link>
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <div className="glass-panel shadow-elegant rounded-xl overflow-hidden">
                  <img
                    src={heroImage}
                    alt="Modern homes and city skyline for a real estate app hero"
                    loading="eager"
                    className="w-full h-[400px] lg:h-[500px] object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Search Section */}
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold">Find Your Perfect Property</h2>
                <p className="text-muted-foreground">
                  Search thousands of properties by location, type, or features
                </p>
              </div>
              
              {/* Large Search Bar */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 space-y-4">
                <div className="w-full max-w-2xl mx-auto">
                  <div className="flex items-center gap-0 rounded-lg border border-input bg-background shadow-sm overflow-hidden">
                    <Select value={searchType} onValueChange={setSearchType}>
                      <SelectTrigger className="w-32 border-0 border-r border-input rounded-none bg-muted/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="rent">Rent</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search properties by location, type, or features..."
                      className="flex-1 border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    
                    <Button 
                      onClick={handleSearch}
                      className="rounded-none px-4"
                      variant="default"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Project Condition Filter */}
                <div className="w-full max-w-md mx-auto">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={!selectedProjectCondition ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedProjectCondition("")}
                      className="text-xs"
                    >
                      All Projects
                    </Button>
                    <Button
                      variant={selectedProjectCondition === "New Project" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedProjectCondition("New Project")}
                      className="text-xs"
                    >
                      New Project
                    </Button>
                    <Button
                      variant={selectedProjectCondition === "Ready Project" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedProjectCondition("Ready Project")}
                      className="text-xs"
                    >
                      Ready Project
                    </Button>
                  </div>
                  <div className="mt-2">
                    <Button
                      variant={selectedProjectCondition === "Preleased" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedProjectCondition("Preleased")}
                      className="text-xs w-full"
                    >
                      Preleased
                    </Button>
                  </div>
                </div>
              </div>

              {/* Search Status */}
              {(isSearching || selectedCategories.length > 0 || selectedProjectCondition) && (
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    <div className="flex gap-1">
                      {selectedCategories.map(category => (
                        <Badge key={category} variant="secondary" className="capitalize">
                          {category}
                        </Badge>
                      ))}
                      {searchQuery && (
                        <Badge variant="secondary">
                          "{searchQuery}"
                        </Badge>
                      )}
                      {searchType && (
                        <Badge variant="secondary" className="capitalize">
                          {searchType}
                        </Badge>
                      )}
                      {selectedProjectCondition && (
                        <Badge variant="default" className="bg-blue-600 text-white hover:bg-blue-700">
                          {selectedProjectCondition}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>
              )}

              {/* Property Category Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant={selectedCategories.length === 0 ? "default" : "outline"} 
                  className="h-auto p-4 flex-col gap-2 shadow-md"
                  onClick={() => {
                    setSelectedCategories([]);
                    setSearchQuery("");
                    setSelectedProjectCondition("");
                  }}
                >
                  <Home className="h-6 w-6" />
                  <span>All Properties</span>
                </Button>
                <Button 
                  variant={selectedCategories.includes("residential") ? "default" : "outline"} 
                  className="h-auto p-4 flex-col gap-2"
                  onClick={() => handleCategoryToggle("residential")}
                >
                  <Building2 className="h-6 w-6" />
                  <span>Residential</span>
                </Button>
                <Button 
                  variant={selectedCategories.includes("commercial") ? "default" : "outline"} 
                  className="h-auto p-4 flex-col gap-2"
                  onClick={() => handleCategoryToggle("commercial")}
                >
                  <Building2 className="h-6 w-6" />
                  <span>Commercial</span>
                </Button>
                <Button 
                  variant={selectedCategories.includes("industrial") ? "default" : "outline"} 
                  className="h-auto p-4 flex-col gap-2"
                  onClick={() => handleCategoryToggle("industrial")}
                >
                  <Building2 className="h-6 w-6" />
                  <span>Industrial</span>
                </Button>
              </div>
            </div>
          </div>
        </GradientSpotlight>
      </section>

      {/* Properties Section */}
      <section aria-label="Properties" className="py-16 px-4 bg-background">
        <div className="container mx-auto space-y-8 px-4">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">
              {isSearching || selectedCategories.length > 0 ? 'Filtered Results' : 'Featured Properties'}
            </h2>
            <p className="text-muted-foreground">
              {isSearching || selectedCategories.length > 0 || selectedProjectCondition
                ? `Found ${getFilteredProperties().length} properties${searchQuery ? ` matching "${searchQuery}"` : ''}${selectedCategories.length > 0 ? ` in ${selectedCategories.join(', ')} categories` : ''}${selectedProjectCondition ? ` with ${selectedProjectCondition} condition` : ''}`
                : 'Discover some of our best properties available now'
              }
            </p>
          </div>

          {/* Properties Grid */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Loading Properties...</h3>
              <p className="text-muted-foreground">Please wait while we fetch the latest properties</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Properties Available</h3>
              <p className="text-muted-foreground mb-4">Check back later for new property listings</p>
              <Button asChild variant="outline">
                <Link to="/search">Browse All Properties</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-2">
                {properties.map((property) => (
                  <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow group flex flex-col h-full p-2">
                    {/* Property Image */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={
                          property.images && property.images.length > 0 && property.images[0] 
                            ? property.images[0] 
                            : getPlaceholderImage(property.propertyType)
                        }
                        alt={property.title || 'Property'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          // If the original image fails, try the placeholder
                          if (target.src !== getPlaceholderImage(property.propertyType)) {
                            target.src = getPlaceholderImage(property.propertyType);
                          } else {
                            // If placeholder also fails, show the animated house fallback
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }
                        }}
                      />
                      <div 
                        className="w-full h-full hidden items-center justify-center"
                        style={{ 
                          background: property.propertyType?.toLowerCase().includes('commercial') 
                            ? 'linear-gradient(135deg, #f0f9ff, #e0e7ff)' 
                            : property.propertyType?.toLowerCase().includes('residential')
                            ? 'linear-gradient(135deg, #fef7cd, #fef3c7)'
                            : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)'
                        }}
                      >
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground/80 font-medium mt-2 capitalize">
                            {property.propertyType || 'Property'}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            No Image Available
                          </p>
                        </div>
                      </div>
                      
                      {/* Listing Type Badge */}
                      {property.listingType && (
                        <div className="absolute top-3 left-3">
                          {getListingTypeBadge(property.listingType)}
                        </div>
                      )}

                      {/* Price Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-primary text-primary-foreground">
                          {formatPrice(property)}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <CardTitle className="line-clamp-2">
                          {property.title || 'Property'}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs capitalize">
                          {property.propertyType || 'Property'}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col space-y-4">
                      {/* Location */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {property.address || property.city || 'Location not specified'}
                        </p>
                      </div>

                      {/* Property Details */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {property.bedrooms > 0 && (
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{property.bedrooms}</span>
                          </div>
                        )}
                        {property.bathrooms > 0 && (
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            <span>{property.bathrooms}</span>
                          </div>
                        )}
                        {property.squareFeet > 0 && (
                          <div className="flex items-center gap-1">
                            <Square className="h-4 w-4" />
                            <span>{property.squareFeet} sq ft</span>
                          </div>
                        )}
                      </div>

                      {/* Spacer to push content to bottom */}
                      <div className="flex-1"></div>

                      {/* Property Enquiry */}
                      <div className="pt-4 border-t space-y-3 mt-auto">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Property Enquiry</span>
                          <span className="text-xs text-muted-foreground">
                            Owner: {property.ownerName}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="w-full">
                            Enquire about this property
                          </Button>
                        </div>

                        {/* View Details Button */}
                        <Button asChild className="w-full" variant="default">
                          <Link to={`/property/${property.id}`}>
                            View Full Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Infinite Scroll Trigger */}
              <div ref={observerTarget} className="flex justify-center py-8">
                {loadingMore ? (
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading more properties...</p>
                  </div>
                ) : hasMore ? (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Scroll down for more properties</p>
                    <Button 
                      onClick={loadMoreProperties}
                      variant="outline"
                      size="sm"
                    >
                      Load More
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {properties.length > 0 
                        ? "You've reached the end of the results"
                        : "No more properties to show"
                      }
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default Index;
