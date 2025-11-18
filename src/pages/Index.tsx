import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GradientSpotlight from "@/components/GradientSpotlight";
import heroImage from "@/assets/hero-realestate.jpg";
import { Link, useNavigate } from "react-router-dom";
import { Building2, MapPin, Home, Bed, Bath, Square, Loader2, Search, Filter, Calendar, Settings, ArrowRight } from "lucide-react";
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

const HomePage = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedProjectCondition, setSelectedProjectCondition] = useState<string>("");
  const [budgetRange, setBudgetRange] = useState<{min: number; max: number}>({min: 0, max: 0});
  const [showCustomBudget, setShowCustomBudget] = useState<boolean>(false);
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

    // Filter by budget range
    if (budgetRange.min > 0 || budgetRange.max > 0) {
      filtered = filtered.filter(property => {
        const price = property.price || 0;
        if (budgetRange.min > 0 && budgetRange.max > 0) {
          return price >= budgetRange.min && price <= budgetRange.max;
        } else if (budgetRange.min > 0) {
          return price >= budgetRange.min;
        } else if (budgetRange.max > 0) {
          return price <= budgetRange.max;
        }
        return true;
      });
    }

    return filtered;
  }, [allProperties, searchQuery, searchType, selectedCategories, selectedListingTypes, selectedProjectCondition, budgetRange]);

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
    setBudgetRange({min: 0, max: 0});
    setShowCustomBudget(false);
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
    if (selectedCategories.length > 0 || selectedListingTypes?.length > 0 || searchQuery.trim() || selectedProjectCondition || budgetRange.min > 0 || budgetRange.max > 0) {
      setIsSearching(true);
      const filteredProperties = getFilteredProperties();
      const initialResults = filteredProperties.slice(0, ITEMS_PER_PAGE);
      
      setProperties(initialResults);
      setPage(1);
      setHasMore(filteredProperties.length > ITEMS_PER_PAGE);
    } else if (!searchQuery.trim() && selectedCategories.length === 0 && (!selectedListingTypes || selectedListingTypes.length === 0) && !selectedProjectCondition && budgetRange.min === 0 && budgetRange.max === 0) {
      // Show all properties when no filters are applied
      setIsSearching(false);
      const initialProperties = allProperties.slice(0, ITEMS_PER_PAGE);
      setProperties(initialProperties);
      setPage(1);
      setHasMore(allProperties.length > ITEMS_PER_PAGE);
    }
  }, [selectedCategories, selectedListingTypes, searchQuery, searchType, selectedProjectCondition, budgetRange, allProperties, getFilteredProperties]);

  const formatPrice = (property: Property): string => {
    if (property.price > 0) {
      return `₹${property.price.toLocaleString()}`;
    }
    return "Contact for price";
  };

  return (
    <>
      <Helmet>
        <title>Propbank — Buy, Sell & Rent Properties</title>
        <meta name="description" content="Buy, sell, or rent properties with ShoPROP. Modern PWA for real estate with buyer/tenant and seller/landlord profiles." />
        <link rel="canonical" href="/" />
      </Helmet>

      {/* Hero Section */}
      <section aria-label="Hero" className="relative">
        <GradientSpotlight className="">
          <div className="container mx-auto py-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center justify-center">
              <div className="space-y-8 flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="space-y-6">
                  <h1 className="text-3xl font-bold leading-tight md:text-2xl lg:text-3xl">
                    Your Go-To Hub for Buying, Selling, and Renting
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Find, list, and manage — all in one platform
                  </p>
                </div>
                
                <div className="glass-panel shadow-elegant rounded-xl overflow-hidden">
                  <img
                    src={heroImage}
                    alt="Modern homes and city skyline for a real estate app hero"
                    loading="eager"
                    className="w-full h-[300px] md:h-[350px] object-cover"
                  />
                </div>
              </div>

              <div className="space-y-6 w-full max-w-2xl mx-auto lg:mx-0">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl md:text-3xl font-bold">Quick Access</h2>
                  <p className="text-muted-foreground">
                    Manage your properties and plan visits with ease
                  </p>
                </div>
              
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 space-y-4 w-full">
                  <div className="grid gap-4">

                    <div 
                      onClick={() => navigate('/manage-property')}
                      className="group cursor-pointer bg-gradient-to-r from-secondary/20 to-secondary/10 backdrop-blur-sm border border-white/30 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-secondary/30 hover:to-secondary/20"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="bg-secondary p-2 sm:p-3 rounded-lg flex-shrink-0">
                          <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground">Manage Property</h3>
                            <span className="px-2 py-1 bg-secondary/10 text-secondary-foreground text-xs font-medium rounded-full self-start border border-secondary/20">
                              Property Management
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                            View, edit, and manage all your property listings in one place
                          </p>
                          <div className="flex items-center text-secondary-foreground group-hover:text-secondary-foreground/80 transition-colors">
                            <span className="text-xs sm:text-sm font-medium">Get Started</span>
                            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visit Planner Card */}
                    <div 
                      onClick={() => navigate('/visit-planner')}
                      className="group cursor-pointer bg-gradient-to-r from-secondary/20 to-secondary/10 backdrop-blur-sm border border-white/30 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-secondary/30 hover:to-secondary/20"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="bg-secondary p-2 sm:p-3 rounded-lg flex-shrink-0">
                          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground">Visit Planner</h3>
                            <span className="px-2 py-1 bg-secondary/10 text-secondary-foreground text-xs font-medium rounded-full self-start border border-secondary/20">
                              Schedule Visits
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                            Schedule and organize property visits with clients efficiently
                          </p>
                          <div className="flex items-center text-secondary-foreground group-hover:text-secondary-foreground/80 transition-colors">
                            <span className="text-xs sm:text-sm font-medium">Plan Visits</span>
                            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GradientSpotlight>
      </section>

      {/* Search Section */}
      <section className="py-8 sm:py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Find Your Dream Property</h2>
            <p className="text-gray-600 text-base sm:text-lg">
              Your dream property is just a search away
            </p>
          </div>
          
          {/* Main Search Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border">
            {/* Search Input */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <div className="flex items-center gap-0 rounded-lg border border-input bg-background shadow-sm overflow-hidden w-full">
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className="w-20 sm:w-32 border-0 border-r border-input rounded-none bg-muted/50 text-xs sm:text-sm">
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
                    placeholder="Search by location, type, or features..."
                    className="flex-1 border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-xs sm:text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  
                  <Button 
                    onClick={handleSearch}
                    className="rounded-none px-3 sm:px-6 text-xs sm:text-sm"
                    variant="default"
                  >
                    <Search className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Search</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters Grid - Mobile Responsive */}
            <div className="space-y-4 sm:space-y-6">
              {/* Property Types */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground text-center sm:text-left">Property Types</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <Button 
                    variant={selectedCategories.length === 0 ? "default" : "outline"} 
                    size="sm"
                    className="h-auto p-2 sm:p-3 flex-col gap-1 text-xs"
                    onClick={() => {
                      setSelectedCategories([]);
                      setSearchQuery("");
                      setSelectedProjectCondition("");
                    }}
                  >
                    <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>All</span>
                  </Button>
                  <Button 
                    variant={selectedCategories.includes("residential") ? "default" : "outline"} 
                    size="sm"
                    className="h-auto p-2 sm:p-3 flex-col gap-1 text-xs"
                    onClick={() => handleCategoryToggle("residential")}
                  >
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Residential</span>
                  </Button>
                  <Button 
                    variant={selectedCategories.includes("commercial") ? "default" : "outline"} 
                    size="sm"
                    className="h-auto p-2 sm:p-3 flex-col gap-1 text-xs"
                    onClick={() => handleCategoryToggle("commercial")}
                  >
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Commercial</span>
                  </Button>
                  <Button 
                    variant={selectedCategories.includes("industrial") ? "default" : "outline"} 
                    size="sm"
                    className="h-auto p-2 sm:p-3 flex-col gap-1 text-xs"
                    onClick={() => handleCategoryToggle("industrial")}
                  >
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Industrial</span>
                  </Button>
                </div>
              </div>

              {/* Project Types & Budget - Two Column Layout on Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Project Types */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Project Types</h3>
                  <div className="grid grid-cols-2 gap-2">
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
                    <Button
                      variant={selectedProjectCondition === "Preleased" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedProjectCondition("Preleased")}
                      className="text-xs"
                    >
                      Preleased
                    </Button>
                  </div>
                </div>

                {/* Budget Range */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">
                    Budget Range (₹{searchType === 'rent' ? '/month' : ''})
                  </h3>
                  {!showCustomBudget ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={budgetRange.min === 0 && budgetRange.max === 0 ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setBudgetRange({min: 0, max: 0});
                          setShowCustomBudget(false);
                        }}
                        className="text-xs col-span-2"
                      >
                        Any Budget
                      </Button>
                      
                      {searchType === 'buy' ? (
                        <>
                          <Button
                            variant={budgetRange.min === 0 && budgetRange.max === 5000000 && !showCustomBudget ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setBudgetRange({min: 0, max: 5000000});
                              setShowCustomBudget(false);
                            }}
                            className="text-xs"
                          >
                            Under 50L
                          </Button>
                          <Button
                            variant={budgetRange.min === 5000000 && budgetRange.max === 10000000 && !showCustomBudget ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setBudgetRange({min: 5000000, max: 10000000});
                              setShowCustomBudget(false);
                            }}
                            className="text-xs"
                          >
                            50L - 1Cr
                          </Button>
                          <Button
                            variant={budgetRange.min === 10000000 && budgetRange.max === 20000000 && !showCustomBudget ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setBudgetRange({min: 10000000, max: 20000000});
                              setShowCustomBudget(false);
                            }}
                            className="text-xs"
                          >
                            1Cr - 2Cr
                          </Button>
                          <Button
                            variant={budgetRange.min === 20000000 && budgetRange.max === 0 && !showCustomBudget ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setBudgetRange({min: 20000000, max: 0});
                              setShowCustomBudget(false);
                            }}
                            className="text-xs"
                          >
                            Above 2Cr
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant={budgetRange.min === 0 && budgetRange.max === 25000 && !showCustomBudget ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setBudgetRange({min: 0, max: 25000});
                              setShowCustomBudget(false);
                            }}
                            className="text-xs"
                          >
                            Under 25K
                          </Button>
                          <Button
                            variant={budgetRange.min === 25000 && budgetRange.max === 50000 && !showCustomBudget ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setBudgetRange({min: 25000, max: 50000});
                              setShowCustomBudget(false);
                            }}
                            className="text-xs"
                          >
                            25K - 50K
                          </Button>
                          <Button
                            variant={budgetRange.min === 50000 && budgetRange.max === 100000 && !showCustomBudget ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setBudgetRange({min: 50000, max: 100000});
                              setShowCustomBudget(false);
                            }}
                            className="text-xs"
                          >
                            50K - 1L
                          </Button>
                          <Button
                            variant={budgetRange.min === 100000 && budgetRange.max === 0 && !showCustomBudget ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setBudgetRange({min: 100000, max: 0});
                              setShowCustomBudget(false);
                            }}
                            className="text-xs"
                          >
                            Above 1L
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomBudget(true)}
                        className="text-xs col-span-2"
                      >
                        Custom Range
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min Budget"
                          value={budgetRange.min || ''}
                          onChange={(e) => setBudgetRange({...budgetRange, min: parseInt(e.target.value) || 0})}
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="Max Budget"
                          value={budgetRange.max || ''}
                          onChange={(e) => setBudgetRange({...budgetRange, max: parseInt(e.target.value) || 0})}
                          className="text-sm"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomBudget(false)}
                        className="w-full text-xs"
                      >
                        Back to Presets
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(selectedCategories.length > 0 || selectedProjectCondition || budgetRange.min > 0 || budgetRange.max > 0 || searchQuery.trim()) && (
              <div className="mt-4 sm:mt-6 text-center">
                <Button variant="ghost" onClick={clearFilters} size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Search Status */}
      {(isSearching || selectedCategories.length > 0 || selectedProjectCondition || budgetRange.min > 0 || budgetRange.max > 0) && (
        <section className="py-4 px-4 bg-background">
          <div className="container mx-auto">
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  <div className="flex gap-1 flex-wrap">
                    {selectedCategories.map(category => (
                      <Badge key={category} variant="secondary" className="capitalize text-xs">
                        {category}
                      </Badge>
                    ))}
                    {searchQuery && (
                      <Badge variant="secondary" className="text-xs">
                        "{searchQuery.length > 15 ? `${searchQuery.substring(0, 15)}...` : searchQuery}"
                      </Badge>
                    )}
                    {searchType && (
                      <Badge variant="secondary" className="capitalize text-xs">
                        {searchType}
                      </Badge>
                    )}
                    {selectedProjectCondition && (
                      <Badge variant="default" className="bg-blue-600 text-white hover:bg-blue-700 text-xs">
                        {selectedProjectCondition}
                      </Badge>
                    )}
                    {(budgetRange.min > 0 || budgetRange.max > 0) && (
                      <Badge variant="default" className="bg-green-600 text-white hover:bg-green-700 text-xs">
                        ₹{searchType === 'rent' 
                          ? `${budgetRange.min > 0 ? `${(budgetRange.min/1000).toFixed(0)}K` : '0'} - ${budgetRange.max > 0 ? `${(budgetRange.max/1000).toFixed(0)}K` : '∞'}/mo`
                          : `${budgetRange.min > 0 ? `${(budgetRange.min/100000).toFixed(0)}L` : '0'} - ${budgetRange.max > 0 ? `${(budgetRange.max/100000).toFixed(0)}L` : '∞'}`
                        }
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="self-start sm:self-auto">
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}



      {/* Properties Section */}
      <section aria-label="Properties" className="py-16 px-4 bg-background">
        <div className="container mx-auto space-y-8 px-4">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">
              {isSearching || selectedCategories.length > 0 ? 'Filtered Results' : 'Featured Properties'}
            </h2>
            <p className="text-muted-foreground">
              {isSearching || selectedCategories.length > 0 || selectedProjectCondition || budgetRange.min > 0 || budgetRange.max > 0
                ? `Found ${getFilteredProperties().length} properties${searchQuery ? ` matching "${searchQuery}"` : ''}${selectedCategories.length > 0 ? ` in ${selectedCategories.join(', ')} categories` : ''}${selectedProjectCondition ? ` with ${selectedProjectCondition} condition` : ''}${(budgetRange.min > 0 || budgetRange.max > 0) ? ` in budget range ₹${
                  searchType === 'rent' 
                    ? `${budgetRange.min > 0 ? `${(budgetRange.min/1000).toFixed(0)}K` : '0'} - ${budgetRange.max > 0 ? `${(budgetRange.max/1000).toFixed(0)}K` : '∞'}/month`
                    : `${budgetRange.min > 0 ? `${(budgetRange.min/100000).toFixed(0)}L` : '0'} - ${budgetRange.max > 0 ? `${(budgetRange.max/100000).toFixed(0)}L` : '∞'}`
                }` : ''}`
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
                            {(property.propertyType || 'Property')
                            .charAt(0).toUpperCase() + (property.propertyType || 'Property').slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <CardTitle className="line-clamp-2">
                          {property.title || 'Property'}
                        </CardTitle>
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
    </>
  );
};

export default HomePage;
