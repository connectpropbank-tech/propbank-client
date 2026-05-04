import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GradientSpotlight from "@/components/GradientSpotlight";
import GeneralInquiryForm from "@/components/GeneralInquiryForm";
import heroImage from "@/assets/hero-realestate.jpg";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Building, Factory, MapPin, Home, Loader2, Search, Filter, Calendar, Settings, ArrowRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { propertyService, Property, SiteSettings } from "@/services/propertyService";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { useSearch } from "@/contexts/SearchContext";
import { API_BASE_URL } from "@/utils/config";
import PropertyDetailsDialog from "@/components/PropertyDetailsDialog";

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
  const [budgetRange, setBudgetRange] = useState<{ min: number; max: number }>({ min: 0, max: 0 });
  const observerTarget = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userPhone, setUserPhone] = useState<string>("");
  const [sendingEnquiry, setSendingEnquiry] = useState<string | null>(null); // Track which property enquiry is being sent

  // Site settings from admin (dynamic content)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    quote: "Manage your properties and plan visits with ease",
    heroTitle: "Your Smart Hub for Property Management",
    heroSubtitle: "Manage, list your properties and find your dream house— all in one platform",
    announcementText: "",
    isAnnouncementActive: false,
    bannerImages: [],
  });

  // Banner carousel state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const {
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    selectedCategories,
    setSelectedCategories,
    selectedListingTypes,
    setSelectedListingTypes,
    isSearching,
    setIsSearching,
    setOnSearchTrigger
  } = useSearch();

  const ITEMS_PER_PAGE = 12;
  const hasLoadedRef = useRef(false); // Track if properties have been loaded

  const loadAllProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyService.getAllPropertiesWithSettings();
      const fetchedProperties = response.properties;
      
      // Filter properties for display (exclude rented/sold)
      const displayProperties = fetchedProperties.filter(property => {
        const isInactive = property.status?.toLowerCase() === "inactive" || property.isActive === false;
        if (isInactive) return false;
        
        if (property.listingType === "rent") {
          return property.rentalStatus !== "rented" && !property.isRented;
        }
        if (property.listingType === "sell") {
          return !property.isSold;
        }
        return true;
      });

      setAllProperties(displayProperties);

      if (response.siteSettings) {
        setSiteSettings(prev => ({
          ...prev,
          ...response.siteSettings,
        }));
      }

      // Initially show first page of properties
      const initialProperties = displayProperties.slice(0, ITEMS_PER_PAGE);
      setProperties(initialProperties);
      setHasMore(displayProperties.length > ITEMS_PER_PAGE);
      setPage(1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load properties. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
    if (searchType && searchType !== "all") {
      filtered = filtered.filter(property => {
        const backendType = (searchType === 'buy' ? 'sell' : searchType).toLowerCase();
        return property.listingType?.toLowerCase() === backendType;
      });
    }

    // Filter by status (show active properties or those without a specific status set)
    filtered = filtered.filter(property => 
      !property.status || 
      property.status === "" || 
      property.status.toLowerCase() === "active" || 
      property.isActive === true
    );

    // Filter out rented and sold properties (show only available ones)
    filtered = filtered.filter(property => {
      if (property.listingType === "rent") {
        return property.rentalStatus !== "rented" && !property.isRented;
      }
      if (property.listingType === "sell") {
        return !property.isSold;
      }
      return true;
    });

    // Filter by header selected listing types (if any)
    if (selectedListingTypes && selectedListingTypes.length > 0) {
      filtered = filtered.filter(property => {
        const propType = property.listingType?.toLowerCase();
        const displayType = propType === 'sell' ? 'buy' : propType;
        return selectedListingTypes.some(t => t.toLowerCase() === displayType);
      });
    }

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
  }, [page, hasMore, loadingMore, isSearching, allProperties, getFilteredProperties]);

  const handleSearch = useCallback(() => {
    const hasActiveFilters = searchQuery.trim() !== "" || 
      searchType !== "all" || 
      selectedCategories.length > 0 || 
      selectedListingTypes.length > 0 || 
      selectedProjectCondition !== "" || 
      budgetRange.min > 0 || 
      budgetRange.max > 0;

    setIsSearching(hasActiveFilters);

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
  }, [searchQuery, selectedCategories, getFilteredProperties, setIsSearching, toast]);

  // Get current user and their phone number
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch user phone number from backend
        try {
          const response = await fetch(`${API_BASE_URL}/users/${firebaseUser.uid}`);
          if (response.ok) {
            const data = await response.json();
            if (data.user && data.user.phoneNumber) {
              setUserPhone(data.user.phoneNumber);
            }
          }
        } catch (error) {
          // Silent error
        }
      } else {
        setUserPhone("");
      }
    });
    return () => unsubscribe();
  }, []);

  // Load properties only once on mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadAllProperties();
    }
  }, []); // Empty dependency array - only run on mount

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
  }, [hasMore, loading, loadingMore, loadMoreProperties]);

  // Banner carousel rotation - every 10 seconds
  useEffect(() => {
    const bannerImages = siteSettings.bannerImages || [];
    if (bannerImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % bannerImages.length);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [siteSettings.bannerImages]);

  // Automatically trigger search when any filter changes
  useEffect(() => {
    handleSearch();
  }, [searchQuery, searchType, selectedCategories, selectedListingTypes, selectedProjectCondition, budgetRange, handleSearch]);

  // Set search trigger after handleSearch is defined
  useEffect(() => {
    setOnSearchTrigger(() => handleSearch);
    return () => {
      setOnSearchTrigger(null);
    };
  }, [handleSearch, setOnSearchTrigger]);

  const clearFilters = () => {
    setSearchQuery("");
    setSearchType("all");
    setSelectedCategories([]);
    setSelectedListingTypes([]);
    setSelectedProjectCondition("");
    setBudgetRange({ min: 0, max: 0 });
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

  // Generic function to raise a request to admin
  const handleRaiseRequest = async (property: Property, requestType: string, requestTitle: string, requestMessage: string) => {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to raise a request.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const requestUser = currentUser;
    const requestKey = `${property.id}_${requestType}`;

    setSendingEnquiry(requestKey);
    try {
      // Fetch current user's phone number from backend if not already available
      let requestUserPhone = userPhone || requestUser.phoneNumber || '';
      if (!requestUserPhone && currentUser.uid) {
        try {
          const userResponse = await fetch(`${API_BASE_URL}/users/${currentUser.uid}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.user && userData.user.phoneNumber) {
              requestUserPhone = userData.user.phoneNumber;
            }
          }
        } catch (error) {

        }
      }

      // Fetch owner's phone number from user service
      let ownerPhoneNumber = '';
      let ownerEmail = property.ownerEmail || '';
      if (property.ownerUID) {
        try {
          const ownerResponse = await fetch(`${API_BASE_URL}/users/${property.ownerUID}`);
          if (ownerResponse.ok) {
            const ownerData = await ownerResponse.json();
            if (ownerData.user) {
              if (ownerData.user.phoneNumber) {
                ownerPhoneNumber = ownerData.user.phoneNumber;
              }
              if (ownerData.user.email && !ownerEmail) {
                ownerEmail = ownerData.user.email;
              }
            }
          }
        } catch (error) {

        }
      }

      // Prepare notification payload
      const notificationPayload = {
        type: requestType,
        title: requestTitle,
        message: requestMessage,
        propertyId: property.id || '',
        ownerId: property.ownerUID || '',
        ownerName: property.ownerName || 'Unknown Owner',
        ownerPhone: ownerPhoneNumber || '',
        ownerEmail: ownerEmail || '',
        // User details (person who raised the request)
        userId: requestUser.uid || '',
        userName: requestUser.displayName || requestUser.email || 'Unknown User',
        userEmail: requestUser.email || '',
        userPhone: requestUserPhone || '',
        // Property details
        propertyTitle: property.title || '',
        propertyAddress: property.address || property.city || 'Not specified',
        propertyListingType: property.listingType || 'rent',
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'high'
      };



      const notificationResponse = await fetch(`${API_BASE_URL}/admin/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload),
      });

      const notificationData = await notificationResponse.json();

      if (notificationData.success) {
        toast({
          title: "Request Sent",
          description: "Your request has been sent to the admin. They will contact you soon.",
        });
      } else {
        throw new Error(notificationData.message || 'Failed to send request');
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to send request. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSendingEnquiry(null);
    }
  };

  // Handle property enquiry - send notification to admin
  const handleEnquireProperty = async (property: Property) => {
    // Check if user is logged in - get current user from auth directly
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to enquire about properties.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Use currentUser instead of user state for reliability
    const enquiryUser = currentUser;

    setSendingEnquiry(property.id);
    try {
      // Fetch current user's phone number from backend if not already available
      let enquiryUserPhone = userPhone || enquiryUser.phoneNumber || '';
      if (!enquiryUserPhone && currentUser.uid) {
        try {
          const userResponse = await fetch(`${API_BASE_URL}/users/${currentUser.uid}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.user && userData.user.phoneNumber) {
              enquiryUserPhone = userData.user.phoneNumber;
            }
          }
        } catch (error) {

          // Continue without phone number
        }
      }

      // Fetch owner's phone number from user service
      let ownerPhoneNumber = '';
      let ownerEmail = property.ownerEmail || '';
      if (property.ownerUID) {
        try {
          const ownerResponse = await fetch(`${API_BASE_URL}/users/${property.ownerUID}`);
          if (ownerResponse.ok) {
            const ownerData = await ownerResponse.json();
            if (ownerData.user) {
              if (ownerData.user.phoneNumber) {
                ownerPhoneNumber = ownerData.user.phoneNumber;
              }
              if (ownerData.user.email && !ownerEmail) {
                ownerEmail = ownerData.user.email;
              }
            }
          }
        } catch (error) {

          // Continue without phone number
        }
      }

      // Prepare notification payload with all required fields
      const notificationPayload = {
        type: 'property_enquiry',
        title: 'Property Enquiry Request',
        message: `User ${enquiryUser.displayName || enquiryUser.email || 'Unknown User'} is interested in property: ${property.title || property.id}`,
        propertyId: property.id || '',
        ownerId: property.ownerUID || '',
        ownerName: property.ownerName || 'Unknown Owner',
        ownerPhone: ownerPhoneNumber || '',
        ownerEmail: ownerEmail || '',
        // User details (person who enquired) - currently logged in user
        userId: enquiryUser.uid || '',
        userName: enquiryUser.displayName || enquiryUser.email || 'Unknown User',
        userEmail: enquiryUser.email || '',
        userPhone: enquiryUserPhone || '',
        // Property details
        propertyTitle: property.title || '',
        propertyAddress: property.address || property.city || 'Not specified',
        propertyListingType: property.listingType || 'rent',
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'high'
      };

      // Debug: Log the payload being sent


      const notificationResponse = await fetch(`${API_BASE_URL}/admin/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload),
      });

      const notificationData = await notificationResponse.json();

      if (notificationData.success) {
        toast({
          title: "Enquiry Sent",
          description: "Your enquiry has been sent to the admin. They will contact you soon.",
        });
      } else {
        throw new Error(notificationData.message || 'Failed to send enquiry');
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to send enquiry. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSendingEnquiry(null);
    }
  };

  // Auto-apply filters when categories, search query, search type, or header filters change
  // Note: Only filter when we have properties loaded (allProperties.length > 0)
  useEffect(() => {
    // Don't run if properties haven't been loaded yet
    if (allProperties.length === 0) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedListingTypes, searchQuery, searchType, selectedProjectCondition, budgetRange, allProperties.length]);


  return (
    <>
      <Helmet>
        <title>Propbank — Buy, Sell & Rent Properties</title>
        <meta name="description" content="Buy, sell, or rent properties with Propbank. Modern PWA for real estate with buyer/tenant and seller/landlord profiles." />
        <link rel="canonical" href="/" />
      </Helmet>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(2deg);
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.1);
          }
        }
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4);
          }
        }
      `}</style>

      {/* Announcement Banner - Shows if admin has set announcement text and it's active */}
      {siteSettings.isAnnouncementActive && siteSettings.announcementText && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4">
          <div className="container mx-auto">
            <p className="text-center text-sm md:text-base font-medium">
              📢 {siteSettings.announcementText}
            </p>
          </div>
        </div>
      )}

      <section aria-label="Hero" className="relative">
        <GradientSpotlight className="">
          <div className="container mx-auto py-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center justify-center">
              <div className="space-y-8 flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="space-y-6">
                  <h1 className="text-3xl font-bold leading-tight md:text-2xl lg:text-3xl">
                    {siteSettings.heroTitle || "Your Smart Hub for Property Management"}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {siteSettings.heroSubtitle || "Manage, list your properties and find your dream house— all in one platform"}
                  </p>
                </div>

                <div className="glass-panel shadow-elegant rounded-xl overflow-hidden relative w-full">
                  {/* Banner Carousel or Fallback Hero Image */}
                  {siteSettings.bannerImages && siteSettings.bannerImages.length > 0 ? (
                    <div className="relative w-full h-[300px] md:h-[350px]">
                      {siteSettings.bannerImages.map((bannerUrl, index) => (
                        <img
                          key={index}
                          src={bannerUrl}
                          alt={`Banner ${index + 1}`}
                          loading={index === 0 ? "eager" : "lazy"}
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentBannerIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                          onError={(e) => {

                            const target = e.target as HTMLImageElement;
                            target.src = heroImage;
                          }}
                        />
                      ))}
                      {/* Carousel Indicators */}
                      {siteSettings.bannerImages.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                          {siteSettings.bannerImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentBannerIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${index === currentBannerIndex
                                ? 'bg-white w-4'
                                : 'bg-white/50 hover:bg-white/75'
                                }`}
                              aria-label={`Go to slide ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <img
                      src={heroImage}
                      alt="Modern homes and city skyline for a real estate app hero"
                      loading="eager"
                      className="w-full h-[300px] md:h-[350px] object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-6 w-full max-w-2xl mx-auto lg:mx-0">
                <div className="text-center space-y-4">
                  <h2 className="text-muted-foreground">{siteSettings.quote || "Manage your properties and plan visits with ease"}</h2>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 space-y-4 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div
                      onClick={() => navigate('/manage-property')}
                      className="group cursor-pointer bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="relative bg-gradient-to-br from-blue-400/20 to-blue-600/30 p-3 sm:p-4 rounded-xl flex-shrink-0 border border-gray-200 flex items-center justify-center shadow-sm">
                          <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-md"></div>
                            <img
                              src="/icons/icon-512.png"
                              alt="Propbank Logo"
                              className="relative h-10 w-10 sm:h-14 sm:w-14 object-contain drop-shadow-lg"
                              style={{
                                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))',
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) {
                                  fallback.style.display = 'block';
                                }
                              }}
                            />
                            <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-white hidden drop-shadow-lg" />
                          </div>
                        </div>
                        <div className="flex-1 w-full">
                          <div className="flex flex-col items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-black">Manage Property</h3>
                            <span className="px-2 py-1 bg-gray-100 text-black text-xs font-medium rounded-full border border-gray-200">
                              Property Management
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3">
                            View, edit, and manage all your property listings in one place
                          </p>
                          <div className="flex items-center justify-center text-black">
                            <span className="text-xs sm:text-sm font-medium">Get Started</span>
                            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visit Planner Card */}
                    <div
                      onClick={() => navigate('/visit-planner')}
                      className="group cursor-pointer bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="relative bg-gradient-to-br from-purple-400/20 to-purple-600/30 p-3 sm:p-4 rounded-xl flex-shrink-0 border border-gray-200 flex items-center justify-center shadow-sm">
                          <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-md"></div>
                            <Calendar className="relative h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-lg"
                              style={{
                                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))',
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex-1 w-full">
                          <div className="flex flex-col items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-black">Visit Planner</h3>
                            <span className="px-2 py-1 bg-gray-100 text-black text-xs font-medium rounded-full border border-gray-200">
                              Schedule Visits
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3">
                            Schedule and organize property visits with clients efficiently
                          </p>
                          <div className="flex items-center justify-center text-black">
                            <span className="text-xs sm:text-sm font-medium">Plan Visits</span>
                            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
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

      {/* Quick Inquiry Section */}
      <section className="py-8 sm:py-12 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Quick Inquiry</h2>
            <p className="text-gray-600 text-base sm:text-lg">Let us know what you're looking for</p>
          </div>
          <GeneralInquiryForm />
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Find Your Dream Property</h2>
            <p className="text-gray-600 text-base sm:text-lg">Your dream property is just a search away</p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">
            <div className="mb-8">
              <div className="flex items-center bg-white rounded-2xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent transition-all overflow-hidden group">
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger className="w-32 border-0 border-r border-gray-200 rounded-none bg-gray-50/50 h-14 focus:ring-0 focus:ring-offset-0 font-semibold text-gray-700 px-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by location, type, or features..."
                  className="flex-1 border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base py-7 px-6"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  className="rounded-none px-8 h-14 bg-[#111827] hover:bg-[#1F2937] transition-all text-white font-semibold text-base flex items-center gap-2"
                  variant="default"
                >
                  <Search className="h-5 w-5" />
                  <span>Search</span>
                </Button>
              </div>
            </div>

            {/* Filters Sections */}
            <div className="space-y-10">
              {/* Property Types */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-900">Property Types</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className={`h-24 rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 border-gray-200 shadow-sm hover:border-blue-200 hover:bg-blue-50/30 ${selectedCategories.length === 0 ? "bg-[#111827] text-white border-[#111827] hover:bg-[#1F2937] hover:text-white" : "text-gray-600 bg-white"}`}
                    onClick={() => {
                      setSelectedCategories([]);
                    }}
                  >
                    <Home className={`h-6 w-6 ${selectedCategories.length === 0 ? "text-white" : "text-gray-400"}`} />
                    <span className="font-semibold text-sm">All</span>
                  </Button>
                  <Button
                    variant="outline"
                    className={`h-24 rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 border-gray-200 shadow-sm hover:border-blue-200 hover:bg-blue-50/30 ${selectedCategories.includes("residential") ? "bg-[#111827] text-white border-[#111827] hover:bg-[#1F2937] hover:text-white" : "text-gray-600 bg-white"}`}
                    onClick={() => handleCategoryToggle("residential")}
                  >
                    <Building2 className={`h-6 w-6 ${selectedCategories.includes("residential") ? "text-white" : "text-gray-400"}`} />
                    <span className="font-semibold text-sm">Residential</span>
                  </Button>
                  <Button
                    variant="outline"
                    className={`h-24 rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 border-gray-200 shadow-sm hover:border-blue-200 hover:bg-blue-50/30 ${selectedCategories.includes("commercial") ? "bg-[#111827] text-white border-[#111827] hover:bg-[#1F2937] hover:text-white" : "text-gray-600 bg-white"}`}
                    onClick={() => handleCategoryToggle("commercial")}
                  >
                    <Building className={`h-6 w-6 ${selectedCategories.includes("commercial") ? "text-white" : "text-gray-400"}`} />
                    <span className="font-semibold text-sm">Commercial</span>
                  </Button>
                  <Button
                    variant="outline"
                    className={`h-24 rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 border-gray-200 shadow-sm hover:border-blue-200 hover:bg-blue-50/30 ${selectedCategories.includes("industrial") ? "bg-[#111827] text-white border-[#111827] hover:bg-[#1F2937] hover:text-white" : "text-gray-600 bg-white"}`}
                    onClick={() => handleCategoryToggle("industrial")}
                  >
                    <Factory className={`h-6 w-6 ${selectedCategories.includes("industrial") ? "text-white" : "text-gray-400"}`} />
                    <span className="font-semibold text-sm">Industrial</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-8">
                {/* Project Types */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900">Project Types</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedProjectCondition("")}
                      className={`h-12 rounded-xl font-semibold border-gray-200 shadow-sm transition-all ${!selectedProjectCondition ? "bg-[#111827] text-white border-[#111827] hover:bg-[#1F2937]" : "text-gray-600 bg-white hover:bg-gray-50"}`}
                    >
                      All Projects
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedProjectCondition("New Project")}
                      className={`h-12 rounded-xl font-semibold border-gray-200 shadow-sm transition-all ${selectedProjectCondition === "New Project" ? "bg-[#111827] text-white border-[#111827] hover:bg-[#1F2937]" : "text-gray-600 bg-white hover:bg-gray-50"}`}
                    >
                      New Project
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedProjectCondition("Ready Project")}
                      className={`h-12 rounded-xl font-semibold border-gray-200 shadow-sm transition-all ${selectedProjectCondition === "Ready Project" ? "bg-[#111827] text-white border-[#111827] hover:bg-[#1F2937]" : "text-gray-600 bg-white hover:bg-gray-50"}`}
                    >
                      Ready Project
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedProjectCondition("Preleased")}
                      className={`h-12 rounded-xl font-semibold border-gray-200 shadow-sm transition-all ${selectedProjectCondition === "Preleased" ? "bg-[#111827] text-white border-[#111827] hover:bg-[#1F2937]" : "text-gray-600 bg-white hover:bg-gray-50"}`}
                    >
                      Preleased
                    </Button>
                  </div>
                </div>

                {/* Budget Range */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900">Budget Range (₹)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-500">Min Budget</label>
                      <Select
                        value={budgetRange.min.toString()}
                        onValueChange={(value) => setBudgetRange({ ...budgetRange, min: parseInt(value) || 0 })}
                      >
                        <SelectTrigger className="w-full h-12 rounded-xl border-gray-200 bg-white text-gray-700 font-medium">
                          <SelectValue placeholder="No Min" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                          <SelectItem value="0">No Min</SelectItem>
                          {searchType === 'buy' ? (
                            <>
                              <SelectItem value="1000000">₹10 Lakh</SelectItem>
                              <SelectItem value="2000000">₹20 Lakh</SelectItem>
                              <SelectItem value="3000000">₹30 Lakh</SelectItem>
                              <SelectItem value="4000000">₹40 Lakh</SelectItem>
                              <SelectItem value="5000000">₹50 Lakh</SelectItem>
                              <SelectItem value="7500000">₹75 Lakh</SelectItem>
                              <SelectItem value="10000000">₹1 Crore</SelectItem>
                              <SelectItem value="20000000">₹2 Crore</SelectItem>
                              <SelectItem value="50000000">₹5 Crore</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="5000">₹5,000</SelectItem>
                              <SelectItem value="10000">₹10,000</SelectItem>
                              <SelectItem value="20000">₹20,000</SelectItem>
                              <SelectItem value="30000">₹30,000</SelectItem>
                              <SelectItem value="50000">₹50,000</SelectItem>
                              <SelectItem value="100000">₹1 Lakh</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-500">Max Budget</label>
                      <Select
                        value={budgetRange.max.toString()}
                        onValueChange={(value) => setBudgetRange({ ...budgetRange, max: parseInt(value) || 0 })}
                      >
                        <SelectTrigger className="w-full h-12 rounded-xl border-gray-200 bg-white text-gray-700 font-medium">
                          <SelectValue placeholder="No Max" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                          <SelectItem value="0">No Max</SelectItem>
                          {searchType === 'buy' ? (
                            <>
                              <SelectItem value="5000000">₹50 Lakh</SelectItem>
                              <SelectItem value="10000000">₹1 Crore</SelectItem>
                              <SelectItem value="20000000">₹2 Crore</SelectItem>
                              <SelectItem value="50000000">₹5 Crore</SelectItem>
                              <SelectItem value="100000000">₹10 Crore</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="20000">₹20,000</SelectItem>
                              <SelectItem value="50000">₹50,000</SelectItem>
                              <SelectItem value="100000">₹1 Lakh</SelectItem>
                              <SelectItem value="200000">₹2 Lakh</SelectItem>
                              <SelectItem value="500000">₹5 Lakh</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(selectedCategories.length > 0 || selectedProjectCondition || budgetRange.min > 0 || budgetRange.max > 0 || searchQuery.trim()) && (
              <div className="mt-8 flex justify-center">
                <Button 
                  variant="ghost" 
                  onClick={clearFilters} 
                  className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl px-6 transition-all"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

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
                          ? `${budgetRange.min > 0 ? `${(budgetRange.min / 1000).toFixed(0)}K` : '0'} - ${budgetRange.max > 0 ? `${(budgetRange.max / 1000).toFixed(0)}K` : '∞'}/mo`
                          : `${budgetRange.min > 0 ? `${(budgetRange.min / 100000).toFixed(0)}L` : '0'} - ${budgetRange.max > 0 ? `${(budgetRange.max / 100000).toFixed(0)}L` : '∞'}`
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

      <section aria-label="Properties" className="py-16 px-4 bg-background">
        <div className="container mx-auto space-y-8 px-4">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">
              {isSearching || selectedCategories.length > 0 ? 'Filtered Results' : 'Featured Properties'}
            </h2>
            <p className="text-muted-foreground">
              {isSearching || selectedCategories.length > 0 || selectedProjectCondition || budgetRange.min > 0 || budgetRange.max > 0
                ? `Found ${getFilteredProperties().length} properties${searchQuery ? ` matching "${searchQuery}"` : ''}${selectedCategories.length > 0 ? ` in ${selectedCategories.join(', ')} categories` : ''}${selectedProjectCondition ? ` with ${selectedProjectCondition} condition` : ''}${(budgetRange.min > 0 || budgetRange.max > 0) ? ` in budget range ₹${searchType === 'rent'
                  ? `${budgetRange.min > 0 ? `${(budgetRange.min / 1000).toFixed(0)}K` : '0'} - ${budgetRange.max > 0 ? `${(budgetRange.max / 1000).toFixed(0)}K` : '∞'}/month`
                  : `${budgetRange.min > 0 ? `${(budgetRange.min / 100000).toFixed(0)}L` : '0'} - ${budgetRange.max > 0 ? `${(budgetRange.max / 100000).toFixed(0)}L` : '∞'}`
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
                        <img src={
                          property.images && property.images.length > 0 && property.images[0]
                            ? property.images[0]
                            : getPlaceholderImage(property.propertyType)}
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
                      </div>

                      <CardContent className="pt-4 space-y-3">
                        {/* Property Title */}
                        <h3 className="font-semibold text-lg line-clamp-2">
                          {property.title || (property.propertyType ? property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) : 'Property')}
                        </h3>

                        {/* Property Type */}
                        <div className="text-sm text-muted-foreground">
                          {property.propertyType ? property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) : 'Property'}
                        </div>

                        {/* Property ID */}
                        <div className="text-xs text-muted-foreground">
                          ID: {property.id}
                        </div>

                        {/* Pricing */}
                        <div className="text-lg font-bold text-primary">
                          ₹{
                            property.price > 0
                              ? property.price.toLocaleString('en-IN')
                              : property.listingType === 'rent' && property.monthlyRent
                                ? parseInt(property.monthlyRent).toLocaleString('en-IN')
                                : property.listingType === 'sell' && property.sellingPrice
                                  ? parseInt(property.sellingPrice).toLocaleString('en-IN')
                                  : "0"
                          }
                          {property.listingType === 'rent' ? '/month' : ''}
                        </div>

                        {/* Property Details Grid Removed - Moved to Dialog */}

                        {/* Buttons Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-auto pt-4">
                          <PropertyDetailsDialog property={property} />

                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleEnquireProperty(property)}
                            disabled={sendingEnquiry === property.id}
                          >
                            {sendingEnquiry === property.id ? "Sending..." : "Enquire Now"}
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
