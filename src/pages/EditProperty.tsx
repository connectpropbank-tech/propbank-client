import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Building2, CheckCircle2, CheckSquare, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState, useRef } from "react";
import { auth } from "../firebase";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { API_BASE_URL } from "../utils/config";
import { FurnishedChecklistModal } from "@/components/FurnishedChecklistModal";
import { uploadBase64Image } from "@/services/uploadService";

interface UserInfo {
  uid: string;
  name: string;
  email: string;
  phoneNumber: string;
  photoURL?: string;
}

const formSchema = z.object({
  propertyTitle: z.string().min(1, "Property title is required"),
  propertyType: z.string().min(1, "Property type is required"),
  configuration: z.string().min(1, "Configuration is required"),
  listingType: z.string().min(1, "Listing type is required"),
  unitNumber: z.string().optional(),
  floor: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  carpetArea: z.string().optional(),
  plotArea: z.string().optional(),
  constructedArea: z.string().optional(),

  // Tenant Information
  tenantFirstName: z.string().optional(),
  tenantLastName: z.string().optional(),
  tenantEmail: z.string().optional(),
  personName: z.string().optional(),
  mobileNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  primaryNo: z.string().optional(),
  ultNo: z.string().optional(),

  // Pricing Details
  monthlyRent: z.string().optional(),
  sellingPrice: z.string().optional(),
  paymentDueDate: z.string().optional(),
  monthlyRent1stYear: z.string().optional(),
  monthlyRent2ndYear: z.string().optional(),
  monthlyRent3rdYear: z.string().optional(),
  monthlyRent4thYear: z.string().optional(),
  rentFromDate1: z.string().optional(),
  rentToDate1: z.string().optional(),
  rentFromDate2: z.string().optional(),
  rentToDate2: z.string().optional(),
  securityDeposit: z.string().optional(),
  agreementPeriod: z.string().optional(),
  agreementStartDate: z.string().optional(),
  agreementEndDate: z.string().optional(),
  noticePeriod: z.string().optional(),
  lockInPeriod: z.string().optional(),
  unitCondition: z.string().optional(),
  maintenanceToBePaidBy: z.string().optional(),
  rentalStatus: z.string().optional(),
  images: z.array(z.string()).optional(),
  specificComments: z.string().optional(),
  furnishedChecklist: z.array(z.object({
    id: z.string(),
    name: z.string(),
    checked: z.boolean(),
    quantity: z.number().min(1).default(1),
    category: z.enum(['basic', 'kitchen', 'bedroom', 'living', 'appliances', 'other', 'semifurnished', 'storage', 'office', 'infrastructure', 'safety', 'machinery', 'utilities'])
  })).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Property {
  id: string;
  title: string;
  propertyType: string;
  configuration: string;
  listingType: string;
  unitNumber: string;
  floor: string;
  location: string;
  carpetArea: string;
  plotArea: string;
  constructedArea: string;

  // Tenant Information
  tenantName: string;
  personName: string;
  mobileNumber: string;
  primaryNo: string;
  ultNo: string;

  // Pricing Details
  monthlyRent: string;
  sellingPrice: string;
  monthlyRent1stYear: string;
  monthlyRent2ndYear: string;
  monthlyRent3rdYear: string;
  monthlyRent4thYear: string;
  rentFromDate1: string;
  rentToDate1: string;
  rentFromDate2: string;
  rentToDate2: string;
  securityDeposit: string;
  agreementPeriod: string;
  agreementStartDate: string;
  agreementEndDate: string;
  noticePeriod: string;
  lockInPeriod: string;
  unitCondition: string;
  maintenanceToBePaidBy: string;
  rentalStatus: string;
  images: string[];
  specificComments: string;
  furnishedChecklist: {
    id: string;
    name: string;
    checked: boolean;
    category: 'basic' | 'kitchen' | 'bedroom' | 'living' | 'appliances' | 'other' | 'semifurnished' | 'storage' | 'office' | 'infrastructure' | 'safety' | 'machinery' | 'utilities';
  }[];
  ownerUID: string;

  // Tenants array
  tenants?: any[];

  // Status and timestamps
  isActive: boolean;
  isRented: boolean;
  isSold: boolean;
  createdAt: string;
  updatedAt: string;
}

const EditProperty = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isRenewalMode = location.state?.mode === 'renewal';
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFurnishedModal, setShowFurnishedModal] = useState(false);
  const [furnishedChecklist, setFurnishedChecklist] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // User Search State
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [searchError, setSearchError] = useState<string | undefined>(undefined);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchUserByPhone = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      setUserInfo(null);
      setSearchError(undefined);
      setSearchingUser(false);
      return;
    }

    setSearchingUser(true);
    setSearchError(undefined);

    try {
      const response = await fetch(`${API_BASE_URL}/users/search?phone=${encodeURIComponent(phoneNumber)}`);
      const data = await response.json();

      if (data.success && data.user) {
        const user = data.user;
        setUserInfo({
          uid: user.uid,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL || '',
          phoneNumber: user.phoneNumber
        });

        // Auto-fill form
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        form.setValue('tenantFirstName', firstName);
        form.setValue('tenantLastName', lastName);
        if (user.email) form.setValue('tenantEmail', user.email);

        toast({
          title: "User Found",
          description: `Found user: ${user.name}`,
        });
      } else {
        setUserInfo(null);
        setSearchError(data.message || "User is not found. Please ask to sign up with our platform to continue.");
        toast({
          title: "User Not Found",
          description: data.message || "User is not found. Please ask to sign up with our platform to continue.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setUserInfo(null);
      setSearchError("Failed to search user. Please try again.");
    } finally {
      setSearchingUser(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const value = e.target.value;
    field.onChange(e); // Update form state

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUserByPhone(value);
    }, 1000);
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyTitle: "",
      propertyType: "",
      configuration: "",
      listingType: "",
      unitNumber: "",
      floor: "",
      location: "",
      carpetArea: "",
      plotArea: "",
      constructedArea: "",



      // Tenant Information
      tenantFirstName: "",
      tenantLastName: "",
      personName: "",
      mobileNumber: "",
      primaryNo: "",
      ultNo: "",

      // Pricing Details
      monthlyRent: "",
      sellingPrice: "",
      monthlyRent1stYear: "",
      monthlyRent2ndYear: "",
      monthlyRent3rdYear: "",
      monthlyRent4thYear: "",
      rentFromDate1: "",
      rentToDate1: "",
      rentFromDate2: "",
      rentToDate2: "",
      securityDeposit: "",
      agreementPeriod: "",
      agreementStartDate: "",
      agreementEndDate: "",
      noticePeriod: "",
      lockInPeriod: "",
      unitCondition: "",
      maintenanceToBePaidBy: "",
      rentalStatus: "",
      images: [],
      specificComments: "",
      furnishedChecklist: [],
    },
  });

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails(propertyId);
    }
  }, [propertyId]);

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
        const propertyData = data.property;

        setProperty(propertyData);
        setUploadedImages(propertyData.images || []);

        // Populate form with existing data
        let activeTenant = null;
        if (propertyData.tenants && propertyData.tenants.length > 0) {
          // Assuming the last tenant in the list is the active one
          activeTenant = propertyData.tenants[propertyData.tenants.length - 1];
        }

        const formData = {
          propertyTitle: propertyData.title || "",
          propertyType: propertyData.propertyType || "",
          configuration: propertyData.configuration || "",
          listingType: propertyData.listingType || "",
          unitNumber: propertyData.unitNumber || "",
          floor: propertyData.floor || "",
          location: propertyData.location || propertyData.address || "",
          carpetArea: propertyData.carpetArea || "",
          plotArea: propertyData.plotArea || "",
          constructedArea: propertyData.constructedArea || "",

          // Tenant Information - Prefer active tenant data, fallback to property top-level
          tenantFirstName: activeTenant?.firstName || (propertyData.tenantName ? propertyData.tenantName.split(' ')[0] : ""),
          tenantLastName: activeTenant?.lastName || (propertyData.tenantName ? propertyData.tenantName.split(' ').slice(1).join(' ') : ""),
          tenantEmail: activeTenant?.email || propertyData.tenantEmail || "",
          personName: propertyData.personName || "",
          mobileNumber: activeTenant?.phone || propertyData.mobileNumber || "",
          emergencyContact: activeTenant?.emergencyContact || propertyData.emergencyContact || "",
          primaryNo: propertyData.primaryNo || "",
          ultNo: propertyData.ultNo || "",

          // Pricing Details - Prefer active tenant data for lease details
          monthlyRent: activeTenant?.monthlyRent || propertyData.monthlyRent || "",
          sellingPrice: propertyData.sellingPrice || "",
          paymentDueDate: activeTenant?.paymentDueDate || propertyData.paymentDueDate || "",
          monthlyRent1stYear: propertyData.monthlyRent1stYear || "",
          monthlyRent2ndYear: propertyData.monthlyRent2ndYear || "",
          monthlyRent3rdYear: propertyData.monthlyRent3rdYear || "",
          monthlyRent4thYear: propertyData.monthlyRent4thYear || "",
          rentFromDate1: propertyData.rentFromDate1 || "",
          rentToDate1: propertyData.rentToDate1 || "",
          rentFromDate2: propertyData.rentFromDate2 || "",
          rentToDate2: propertyData.rentToDate2 || "",
          securityDeposit: activeTenant?.securityDeposit || propertyData.securityDeposit || "",
          agreementPeriod: propertyData.agreementPeriod || "",
          agreementStartDate: activeTenant?.leaseStartDate || propertyData.agreementStartDate || "",
          agreementEndDate: activeTenant?.leaseEndDate || propertyData.agreementEndDate || "",
          noticePeriod: activeTenant?.noticePeriod || propertyData.noticePeriod || "",
          lockInPeriod: propertyData.lockInPeriod || "",
          unitCondition: propertyData.unitCondition || "",
          maintenanceToBePaidBy: propertyData.maintenanceToBePaidBy || "",
          rentalStatus: propertyData.rentalStatus || "",
          images: propertyData.images || [],
          specificComments: propertyData.specificComments || "",
          furnishedChecklist: propertyData.furnishedChecklist || [],
        };

        // Normalize furnished checklist - handle both old string[] format and new object format
        const normalizeFurnishedChecklist = (checklist: any) => {
          if (!checklist || !Array.isArray(checklist)) return [];

          return checklist.map((item: any) => {
            // If it's already in the new format (object with id, name, etc.)
            if (typeof item === 'object' && item !== null && item.name) {
              return {
                ...item,
                quantity: item.quantity || 1,
                checked: item.checked !== undefined ? item.checked : true
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

        // Set the furnished checklist state
        setFurnishedChecklist(normalizeFurnishedChecklist(propertyData.furnishedChecklist));


        form.reset(formData);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch property details",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch user details when property is loaded and has a phone number
  useEffect(() => {
    if (property && property.mobileNumber && property.mobileNumber.length >= 10) {
      searchUserByPhone(property.mobileNumber);
    } else if (property && property.tenants && property.tenants.length > 0) {
      // Check active tenant phone
      const activeTenant = property.tenants[property.tenants.length - 1];
      if (activeTenant && activeTenant.phone && activeTenant.phone.length >= 10) {
        searchUserByPhone(activeTenant.phone);
      }
    }
  }, [property]);

  // Image handling functions
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const totalImages = uploadedImages.length + files.length;
    if (totalImages > 6) {
      toast({
        title: "Too many images",
        description: "You can upload maximum 6 images per property.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        try {
          // Convert file to base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
          });
          reader.readAsDataURL(file);
          const base64Image = await base64Promise;

          try {
            // Upload to Cloudflare R2
            const uploadedUrl = await uploadBase64Image(base64Image, 'properties', `edit-${propertyId}`);

            setUploadedImages(prev => {
              const newImages = [...prev, uploadedUrl];
              form.setValue('images', newImages);
              return newImages;
            });

            toast({
              title: "Image uploaded",
              description: "Image uploaded successfully to cloud storage.",
            });
          } catch (uploadError) {

            // Fallback to base64 if R2 upload fails
            setUploadedImages(prev => {
              const newImages = [...prev, base64Image];
              form.setValue('images', newImages);
              return newImages;
            });

            toast({
              title: "Image saved locally",
              description: "Cloud upload failed, image will be uploaded when saving.",
              variant: "destructive",
            });
          }
        } catch (error) {

          toast({
            title: "Upload failed",
            description: "Failed to read the image file.",
            variant: "destructive",
          });
        }
      }
    }

    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      form.setValue('images', newImages);
      return newImages;
    });
  };

  const getConfigurationOptions = () => {
    switch (form.watch("propertyType")) {
      case "residential":
        return [
          { value: "bunglow", label: "Bunglow" },
          { value: "1 BHK Flat", label: "1 BHK" },
          { value: "2 BHK Flat", label: "2 BHK" },
          { value: "3 BHK Flat", label: "3 BHK" },
          { value: "4 BHK Flat", label: "4 BHK" },
          { value: "5+ BHK Flat", label: "5+ BHK" },
        ];
      case "commercial":
        return [
          { value: "office", label: "Office" },
          { value: "shop", label: "Shop" },
        ];
      case "industrial":
        return [
          { value: "unit", label: "Unit" },
          { value: "shed", label: "Shed" },
          { value: "Plot/land", label: "Plot/land" },
          { value: "RCC", label: "RCC" },
        ];
      default:
        return [];
    }
  };

  const getUnitLabel = () => {
    switch (form.watch("propertyType")) {
      case "residential":
        return "Flat No.";
      case "commercial":
        return "Office / Shop No.";
      case "industrial":
        return "Unit/ Plot No.";
      default:
        return "Unit No.";
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Validate pricing based on listing type
      if (data.listingType === "rent" && (!data.monthlyRent || data.monthlyRent.trim() === "")) {
        toast({
          title: "Missing Monthly Rent",
          description: "Please enter the monthly rent amount for rental properties.",
          variant: "destructive",
        });
        return;
      }

      if (data.listingType === "sell" && (!data.sellingPrice || data.sellingPrice.trim() === "")) {
        toast({
          title: "Missing Selling Price",
          description: "Please enter the selling price for sale properties.",
          variant: "destructive",
        });
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to update the property.",
          variant: "destructive",
        });
        return;
      }

      // Filter furnished checklist to only include checked items (saves DB space)
      const checkedFurnishedItems = furnishedChecklist.filter(item => item.checked);

      // Prepare update data - map propertyTitle to title for backend consistency
      const { propertyTitle, ...restData } = data;

      // Update the active tenant in the tenants array if it exists
      let updatedTenants = property?.tenants || [];

      if (data.listingType === "rent") {
        if (updatedTenants.length === 0) {
          // Create new active tenant if none exists
          const newTenant = {
            id: Date.now().toString(),
            firstName: data.tenantFirstName || "",
            lastName: data.tenantLastName || "",
            email: data.tenantEmail || "",
            phone: data.mobileNumber || "",
            emergencyContact: data.emergencyContact || "",
            leaseStartDate: data.agreementStartDate || "",
            leaseEndDate: data.agreementEndDate || "",
            monthlyRent: data.monthlyRent || "",
            paymentDueDate: data.paymentDueDate || "",
            securityDeposit: data.securityDeposit || "",
            noticePeriod: data.noticePeriod || "",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          updatedTenants = [newTenant];
        } else {
          // Update existing active tenant
          const lastIndex = updatedTenants.length - 1;
          const activeTenant = { ...updatedTenants[lastIndex] };

          // Update tenant fields
          activeTenant.firstName = data.tenantFirstName || activeTenant.firstName;
          activeTenant.lastName = data.tenantLastName || activeTenant.lastName;
          activeTenant.email = data.tenantEmail || activeTenant.email;
          activeTenant.phone = data.mobileNumber || activeTenant.phone;
          activeTenant.emergencyContact = data.emergencyContact || activeTenant.emergencyContact;

          // Update lease fields
          activeTenant.monthlyRent = data.monthlyRent || activeTenant.monthlyRent;
          activeTenant.securityDeposit = data.securityDeposit || activeTenant.securityDeposit;
          activeTenant.paymentDueDate = data.paymentDueDate || activeTenant.paymentDueDate;
          activeTenant.leaseStartDate = data.agreementStartDate || activeTenant.leaseStartDate;
          activeTenant.leaseEndDate = data.agreementEndDate || activeTenant.leaseEndDate;
          activeTenant.noticePeriod = data.noticePeriod || activeTenant.noticePeriod;

          updatedTenants[lastIndex] = activeTenant;
        }
      }

      const updateData = {
        ...restData,
        title: propertyTitle, // Backend expects 'title' field
        tenantName: `${data.tenantFirstName || ""} ${data.tenantLastName || ""}`.trim(), // Determine legacy name
        personName: `${data.tenantFirstName || ""} ${data.tenantLastName || ""}`.trim(), // Also set personName just in case
        images: uploadedImages, // Ensure images from state are included
        furnishedChecklist: checkedFurnishedItems, // Only include checked items
        ownerUID: currentUser.uid,
        tenants: updatedTenants, // Sync top-level changes to tenants array
      };

      // Debug log

      // Send update request to backend
      const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Property Updated!",
          description: `${data.propertyTitle} has been successfully updated.`,
        });

        // Refresh the property data to show updated values
        if (propertyId) {
          await fetchPropertyDetails(propertyId);
        }

        // Optional: navigate back or stay on the page
        // navigate("/manage-property");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update property. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server. Please try again.",
        variant: "destructive",
      });
    }
  };


  const isPropertyEditable = () => {
    if (!property) return false;

    // Check if property is already rented or sold
    const hasActiveTenant = property.tenantName && property.tenantName.trim() !== "";
    const hasTenantsInArray = property.tenants && property.tenants.length > 0;
    const hasActiveAgreement = property.agreementStartDate && property.agreementEndDate;
    const isCurrentlyRented = property.isRented || hasActiveTenant || hasTenantsInArray || hasActiveAgreement;
    const isCurrentlySold = property.isSold;

    // Disallow editing for both rented and sold properties
    return !isCurrentlySold && !isCurrentlyRented;
  };

  const getPropertyStatusMessage = () => {
    if (!property) return "";

    const hasActiveTenant = property.tenantName && property.tenantName.trim() !== "";
    const hasTenantsInArray = property.tenants && property.tenants.length > 0;
    const isCurrentlyRented = property.isRented || hasActiveTenant || hasTenantsInArray;
    const isCurrentlySold = property.isSold;

    if (isCurrentlySold) {
      return "This property has been sold and cannot be edited.";
    }
    if (isCurrentlyRented) {
      return "This property is currently rented and cannot be edited.";
    }
    return "";
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
        <title>{property.title.charAt(0).toUpperCase() + property.title.slice(1)}</title>
        <meta name="description" content={`Edit property details for ${property.title}`} />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/manage-property")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Manage Properties
          </Button>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{isRenewalMode ? "Renew Agreement" : "Edit your property details"}</h1>
              <p className="text-lg text-muted-foreground">
                {property.title}
                <span className="ml-2 px-2 py-1 text-sm bg-primary/10 text-primary rounded-md capitalize">
                  {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
                </span>
                {!isPropertyEditable() && (
                  <span className="ml-2 px-2 py-1 text-sm bg-orange-100 text-orange-800 rounded-md">
                    {property.isSold ? "🏷️ SOLD" : "🏠 RENTED"}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>
              {isPropertyEditable()
                ? "Update the form below to modify your property listing."
                : getPropertyStatusMessage()
              }
            </CardDescription>
            {property.updatedAt && (
              <div className="text-sm text-muted-foreground mt-2">
                <strong>Last Modified:</strong> {new Date(property.updatedAt).toLocaleString()}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Basic Property Information */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 border rounded-lg">
                  <div className="lg:col-span-4">
                    <h3 className="text-lg font-semibold mb-6">Property Details</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="propertyTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter property name here"
                            disabled={!isPropertyEditable()}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="configuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Configuration / (Structure)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!isPropertyEditable()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select configuration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getConfigurationOptions().map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="listingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Listing Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!isPropertyEditable()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select listing type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rent">For Rent</SelectItem>
                            <SelectItem value="sell">For Sale</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tenant Information - Only for Rented Properties */}
                {form.watch("listingType") === "rent" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 border rounded-lg">
                    <div className="lg:col-span-2">
                      <h3 className="text-lg font-semibold mb-6">Tenant Information</h3>
                    </div>

                    <div className="lg:col-span-2">
                      <FormField
                        control={form.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="Enter mobile number to search user"
                                  disabled={!isPropertyEditable()}
                                  {...field}
                                  onChange={(e) => handlePhoneChange(e, field)}
                                />
                                {searchingUser && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* User Search Feedback */}
                      {userInfo && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-800">User Found</p>
                            <p className="text-xs text-green-700">{userInfo.name} ({userInfo.email})</p>
                          </div>
                        </div>
                      )}

                      {searchError && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800">User Not Found</p>
                            <p className="text-xs text-red-700">{searchError}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:col-span-2">
                      <FormField
                        control={form.control}
                        name="tenantFirstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter first name"
                                disabled={!isPropertyEditable()}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tenantLastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter last name"
                                disabled={!isPropertyEditable()}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:col-span-2">
                      <FormField
                        control={form.control}
                        name="tenantEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tenant Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter tenant email"
                                type="email"
                                disabled={!isPropertyEditable()}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="emergencyContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter emergency contact"
                                disabled={!isPropertyEditable()}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Pricing & Lease Information */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 border rounded-lg">
                  <div className="lg:col-span-3">
                    <h3 className="text-lg font-semibold mb-6">
                      {form.watch("listingType") === "rent" ? "Lease & Pricing Details" : "Pricing Details"}
                    </h3>
                  </div>

                  {form.watch("listingType") === "rent" && (
                    <>
                      <FormField
                        control={form.control}
                        name="monthlyRent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Rent (₹) *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 25000"
                                type="number"
                                disabled={!isPropertyEditable()}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="securityDeposit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Security Deposit (₹)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 100000"
                                type="number"
                                disabled={!isPropertyEditable()}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentDueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Due Day</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!isPropertyEditable()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select day" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[...Array(31)].map((_, i) => (
                                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                                    {i + 1}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="agreementStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lease Start Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                disabled={!isPropertyEditable()}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="agreementEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lease End Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                disabled={!isPropertyEditable()}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="noticePeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notice Period</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!isPropertyEditable()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select notice period" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1 Month">1 Month</SelectItem>
                                <SelectItem value="2 Months">2 Months</SelectItem>
                                <SelectItem value="3 Months">3 Months</SelectItem>
                                <SelectItem value="6 Months">6 Months</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lockInPeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lock-in Period (Months)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 6"
                                type="number"
                                disabled={!isPropertyEditable()}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {form.watch("listingType") === "sell" && (
                    <FormField
                      control={form.control}
                      name="sellingPrice"
                      render={({ field }) => (
                        <FormItem className="lg:col-span-3">
                          <FormLabel>Selling Price (₹) *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter selling price (e.g., 5000000)"
                              type="number"
                              disabled={!isPropertyEditable()}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Unit Condition & Maintenance */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 border rounded-lg">
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-6">Unit Condition & Maintenance</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="unitCondition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Condition</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!isPropertyEditable()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="semi-furnished">Semi Furnished</SelectItem>
                            <SelectItem value="furnished">Furnished</SelectItem>
                            <SelectItem value="unfurnished">Unfurnished</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Furnished Checklist Button - Aligned with Unit Condition */}
                  <FormField
                    control={form.control}
                    name="furnishedChecklist"
                    render={() => (
                      <FormItem>
                        <FormLabel>Furnished Items Checklist</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowFurnishedModal(true)}
                          className="w-full"
                          disabled={!isPropertyEditable()}
                        >
                          <CheckSquare className="mr-2 h-4 w-4" />
                          Manage Furnished Items Checklist
                          {furnishedChecklist.filter((item: any) => item.checked).length > 0 && (
                            <span className="ml-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                              {furnishedChecklist.filter((item: any) => item.checked).length} items selected
                            </span>
                          )}
                        </Button>
                        <FormDescription className="text-xs text-muted-foreground">
                          Add items included with this property (available for all unit conditions)
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {form.watch("listingType") !== "sell" && (
                    <FormField
                      control={form.control}
                      name="maintenanceToBePaidBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maintenance To Be Paid By</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!isPropertyEditable()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select who pays" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="tenant">Tenant</SelectItem>
                              <SelectItem value="shared">Shared</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Images */}
                <div className="grid grid-cols-1 gap-6 p-6 border rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold mb-6">Property Images</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadedImages.length >= 6 || !isPropertyEditable() || isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : !isPropertyEditable()
                          ? 'Property cannot be edited'
                          : uploadedImages.length >= 6
                            ? 'Maximum 6 images uploaded'
                            : 'Upload Images (Max 6)'
                        }
                      </Button>
                    </div>

                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {uploadedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Property ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            {isPropertyEditable() && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments */}
                <div className="grid grid-cols-1 gap-6 p-6 border rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold mb-6">Additional Comments</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="specificComments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specific Comments</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any specific comments or notes about the property..."
                            disabled={!isPropertyEditable()}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Status Alert */}
                {!isPropertyEditable() && (
                  <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-orange-600">⚠️</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-orange-800">
                          {getPropertyStatusMessage()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/manage-property")}
                  >
                    {isPropertyEditable() ? "Cancel" : "Back to Properties"}
                  </Button>
                  {isPropertyEditable() && (
                    <Button type="submit">
                      Update Property
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Furnished Checklist Modal */}
      <FurnishedChecklistModal
        isOpen={showFurnishedModal}
        onClose={() => setShowFurnishedModal(false)}
        onSave={(checklist) => {
          setFurnishedChecklist(checklist);
          form.setValue("furnishedChecklist", checklist);
        }}
        initialChecklist={furnishedChecklist}
      />
    </main >
  );
};

export default EditProperty;
