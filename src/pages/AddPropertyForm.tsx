import { Helmet } from "react-helmet-async";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Building2, Upload, X, Image as ImageIcon, CheckSquare, User, Plus, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { auth } from "../firebase";
import { User as FirebaseUser } from "firebase/auth";
import { useState, useRef } from "react";
import { API_BASE_URL } from "../utils/config";
import { FurnishedChecklistModal } from "@/components/FurnishedChecklistModal";
import { uploadBase64Image } from "../services/uploadService";

const formSchema = z.object({
  // Property Basic Details
  propertyTitle: z.string().min(1, "Property title is required"),
  propertyType: z.string().min(1, "Property type is required"),
  configuration: z.string().min(1, "Configuration is required"),
  listingType: z.string().min(1, "Listing type is required"), // Sell or Rent

  // Unit Details (conditional based on property type)
  unitNumber: z.string().optional(),
  floor: z.string().optional(),
  location: z.string().min(1, "Location is required"),

  // Area Details
  carpetArea: z.string().optional(),
  plotArea: z.string().optional(),
  constructedArea: z.string().optional(),

  // Tenant Information (conditional - required when property is rented)
  tenantName: z.string().optional(),
  tenantEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  personName: z.string().optional(),
  mobileNumber: z.string().optional(),
  primaryNo: z.string().optional(),
  ultNo: z.string().optional(),
  emergencyContact: z.string().optional(),

  // Tenant Employment Details
  employmentStatus: z.string().optional(),
  employer: z.string().optional(),

  // Tenant Spouse Information
  isMarried: z.boolean().optional(),
  spouseFirstName: z.string().optional(),
  spouseLastName: z.string().optional(),
  spouseEmail: z.string().optional(),
  spousePhone: z.string().optional(),
  spouseEmploymentStatus: z.string().optional(),
  spouseEmployer: z.string().optional(),
  spouseNotes: z.string().optional(),

  // Pricing Details (conditional based on listing type)
  monthlyRent: z.string().optional(), // For rent
  sellingPrice: z.string().optional(), // For sell

  // Monthly Rent Details (for rent only) - Dynamic Schedule
  rentSchedule: z.array(z.object({
    year: z.string().optional(),
    amount: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  })).optional(),

  // Legacy fields - kept for compatibility but will be populated from schedule if needed
  monthlyRent1stYear: z.string().optional(),
  monthlyRent2ndYear: z.string().optional(),
  monthlyRent3rdYear: z.string().optional(),
  monthlyRent4thYear: z.string().optional(),
  rentFromDate1: z.string().optional(),
  rentToDate1: z.string().optional(),
  rentFromDate2: z.string().optional(),
  rentToDate2: z.string().optional(),

  // Payment Details
  paymentDueDate: z.string().optional(),
  escalationPercentage: z.string().optional(),
  escalationAmount: z.string().optional(),

  // Security & Agreement
  securityDeposit: z.string().optional(),
  agreementPeriod: z.string().optional(),
  agreementStartDate: z.string().optional(),
  agreementEndDate: z.string().optional(),

  // Notice & Lock-in
  noticePeriod: z.string().optional(),
  lockInPeriod: z.string().optional(),

  // Unit Condition & Maintenance
  unitCondition: z.string().optional(),
  maintenanceToBePaidBy: z.string().optional(),
  projectCondition: z.string().optional(),
  rentalStatus: z.string().optional(), // New field to track if property is rented
  possessionDate: z.string().optional(), // Possession date for available for rent

  // Furnished Checklist
  furnishedChecklist: z.array(z.object({
    id: z.string(),
    name: z.string(),
    checked: z.boolean(),
    quantity: z.number().min(1).default(1),
    category: z.enum(['basic', 'kitchen', 'bedroom', 'living', 'appliances', 'semifurnished', 'office', 'infrastructure', 'safety', 'machinery', 'storage', 'utilities', 'other'])
  })).optional(),

  // Images & Comments
  images: z.array(z.string()).optional(),
  internalImages: z.array(z.string()).optional(),
  specificComments: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const getOrdinalSuffix = (i: number) => {
  const j = i % 10,
    k = i % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
};

const AddPropertyForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPropertyType = searchParams.get('type') || '';
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedInternalImages, setUploadedInternalImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const [showFurnishedModal, setShowFurnishedModal] = useState(false);
  const [furnishedChecklist, setFurnishedChecklist] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isInternalUploading, setIsInternalUploading] = useState(false);

  // Image handling functions
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Only allow 1 building image
    if (uploadedImages.length >= 1) {
      toast({
        title: "Image already uploaded",
        description: "Only one building image is allowed. Remove the existing image first.",
        variant: "destructive",
      });
      return;
    }

    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      setIsUploading(true);

      try {
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Image = e.target?.result as string;

          try {
            // Upload to Cloudflare R2
            const uploadedUrl = await uploadBase64Image(base64Image, 'properties', 'building');



            setUploadedImages([uploadedUrl]);
            form.setValue('images', [uploadedUrl]);

            toast({
              title: "Image uploaded",
              description: "Building image uploaded successfully to cloud storage.",
            });
          } catch (uploadError) {

            // Fallback to base64 if R2 upload fails

            setUploadedImages([base64Image]);
            form.setValue('images', [base64Image]);

            toast({
              title: "Image saved locally",
              description: "Cloud upload failed, image will be uploaded when saving property.",
              variant: "destructive",
            });
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {

        setIsUploading(false);
        toast({
          title: "Upload failed",
          description: "Failed to read the image file.",
          variant: "destructive",
        });
      }
    }

    // Reset file input
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

  const handleInternalImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (uploadedInternalImages.length + files.length > 6) {
      toast({
        title: "Limit exceeded",
        description: "You can only upload up to 6 internal images.",
        variant: "destructive",
      });
      return;
    }

    setIsInternalUploading(true);
    const newImages: string[] = [];

    // Process files sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && file.type.startsWith('image/')) {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const base64Image = await base64Promise;

          try {
            const uploadedUrl = await uploadBase64Image(base64Image, 'properties', 'internal');
            newImages.push(uploadedUrl);
          } catch (e) {
            // Fallback
            newImages.push(base64Image);
          }
        } catch (error) {
          console.error("Error reading file", error);
        }
      }
    }

    setUploadedInternalImages(prev => {
      const update = [...prev, ...newImages];
      form.setValue('internalImages', update);
      return update;
    });
    setIsInternalUploading(false);

    // Reset input
    if (internalFileInputRef.current) {
      internalFileInputRef.current.value = '';
    }
  };

  const removeInternalImage = (index: number) => {
    setUploadedInternalImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      form.setValue('internalImages', newImages);
      return newImages;
    });
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyTitle: "",
      propertyType: selectedPropertyType,
      configuration: "",
      listingType: "",
      unitNumber: "",
      floor: "",
      location: "",
      carpetArea: "",
      plotArea: "",
      constructedArea: "",
      // Tenant Information
      tenantName: "",
      tenantEmail: "",
      personName: "",
      mobileNumber: "",
      primaryNo: "",
      ultNo: "",
      emergencyContact: "",
      employmentStatus: "",
      employer: "",
      isMarried: false,
      spouseFirstName: "",
      spouseLastName: "",
      spouseEmail: "",
      spousePhone: "",
      spouseEmploymentStatus: "",
      spouseEmployer: "",
      spouseNotes: "",
      // Pricing
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
      rentSchedule: [{ year: "1st Year", amount: "", fromDate: "", toDate: "" }], // Start with one row
      paymentDueDate: "",
      escalationPercentage: "",
      escalationAmount: "",
      securityDeposit: "",
      agreementPeriod: "",
      agreementStartDate: "",
      agreementEndDate: "",
      noticePeriod: "",
      lockInPeriod: "",
      unitCondition: "",
      maintenanceToBePaidBy: "",
      projectCondition: "",
      rentalStatus: "",
      possessionDate: '',
      furnishedChecklist: [],
      images: [],
      internalImages: [],
      specificComments: "",

    },
  });

  const { fields: rentScheduleFields, append: appendRentSchedule, remove: removeRentSchedule } = useFieldArray({
    control: form.control,
    name: "rentSchedule",
  });

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

      // Validate tenant details for rented properties
      if (data.listingType === "rent" && data.rentalStatus === "rented") {
        if (!data.tenantName || data.tenantName.trim() === "") {
          toast({
            title: "Missing Tenant Information",
            description: "Please enter the tenant name for rented properties.",
            variant: "destructive",
          });
          return;
        }

        if (!data.mobileNumber || data.mobileNumber.trim() === "") {
          toast({
            title: "Missing Tenant Contact",
            description: "Please enter the tenant's mobile number for rented properties.",
            variant: "destructive",
          });
          return;
        }

        // Validate agreement details for rented properties
        if (!data.agreementPeriod || data.agreementPeriod.trim() === "") {
          toast({
            title: "Missing Agreement Information",
            description: "Please enter the agreement period for rented properties.",
            variant: "destructive",
          });
          return;
        }

        if (!data.agreementStartDate || data.agreementStartDate.trim() === "") {
          toast({
            title: "Missing Agreement Start Date",
            description: "Please enter the agreement start date for rented properties.",
            variant: "destructive",
          });
          return;
        }

        if (!data.agreementEndDate || data.agreementEndDate.trim() === "") {
          toast({
            title: "Missing Agreement End Date",
            description: "Please enter the agreement end date for rented properties.",
            variant: "destructive",
          });
          return;
        }
      }

      // Get current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to add a property.",
          variant: "destructive",
        });
        return;
      }

      // Filter furnished checklist to only include checked items (saves DB space)
      const checkedFurnishedItems = furnishedChecklist.filter(item => item.checked);

      // Prepare property data for backend API
      const propertyData = {
        ...data,
        images: uploadedImages, // Ensure images from state are included
        furnishedChecklist: checkedFurnishedItems, // Only include checked items
        ownerUID: currentUser.uid,
      };

      // Debug log
      // Debug log

      console.log("Submitting property data:", propertyData);

      // Send to backend API
      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData)
      });

      const result = await response.json();

      if (result.success) {
        const listingTypeText = data.listingType === "rent" ? "rental property" : "property for sale";
        toast({
          title: `${data.propertyTitle} added successfully!`,
          description: `Your ${listingTypeText} has been saved and is now listed.`,
        });
        navigate("/manage-property");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to add property. Please try again.",
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

  const getConfigurationOptions = () => {
    switch (selectedPropertyType) {
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
    switch (selectedPropertyType) {
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

  return (
    <main className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Add Property — Comprehensive Property Details</title>
        <meta name="description" content="Add comprehensive property details including rental terms, tenant information, and agreement details." />
        <link rel="canonical" href="/add-property" />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/select-property-type")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Property Type Selection
          </Button>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Add Property</h1>
              <p className="text-lg text-muted-foreground">
                Comprehensive Property Details
                {selectedPropertyType && (
                  <span className="ml-2 px-2 py-1 text-sm bg-primary/10 text-primary rounded-md">
                    {selectedPropertyType.charAt(0).toUpperCase() + selectedPropertyType.slice(1)}
                  </span>
                )}

              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Property Listing Form</CardTitle>
            <CardDescription>
              Fill out the form below to add your property to the listings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.error("Form validation errors:", errors);
                toast({
                  title: "Form Validation Failed",
                  description: "Please check the form for errors. See console for details.",
                  variant: "destructive",
                });
              })} className="space-y-8">

                {/* Basic Property Information */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-4 border rounded-lg">
                  <div className="lg:col-span-4">
                    <h3 className="text-lg font-semibold mb-4">Property Details</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="propertyTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter property name here" {...field} />
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                  {/* Rental Status - Only show for rental properties */}
                  {form.watch("listingType") === "rent" && (
                    <FormField
                      control={form.control}
                      name="rentalStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rental Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rental status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="available">Available for Rent</SelectItem>
                              <SelectItem value="rented">Already Rented Out</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Unit Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 border rounded-lg">
                  <div className="lg:col-span-3">
                    <h3 className="text-lg font-semibold ">Unit Details</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="unitNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{getUnitLabel()}</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter unit number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Floor</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter floor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-3">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Where is your property located? (Enter full address)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Area Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 border rounded-lg">
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold">Area (in sqft)</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="carpetArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carpet Area (Sqft)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter carpet area" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="constructedArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Built-up Area (Sqft)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter built-up area" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Plot Area - Only for Industrial properties */}
                  {selectedPropertyType === "industrial" && (
                    <FormField
                      control={form.control}
                      name="plotArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plot Area (Sqft)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter plot area" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Tenant Information - Only show when property is already rented */}
                {form.watch("listingType") === "rent" && form.watch("rentalStatus") === "rented" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 border rounded-lg">
                    <div className="lg:col-span-3">
                      <h3 className="text-lg font-semibold mb-4">Current Tenant Information</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Since this property is already rented out, please provide the current tenant details.
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="tenantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tenant Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter tenant full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tenantEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tenant Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter tenant email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="personName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact person name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField control={form.control} name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter mobile number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField control={form.control} name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact</FormLabel>
                          <FormControl>
                            <Input placeholder="Emergency contact name and phone" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Employment Details Section */}
                    <div className="lg:col-span-3 mt-6 pt-4 border-t">
                      <h4 className="text-md font-medium mb-4 text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Employment Details
                      </h4>
                    </div>

                    <FormField
                      control={form.control}
                      name="employmentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employment Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="employed">Employed</SelectItem>
                              <SelectItem value="self-employed">Self-Employed</SelectItem>
                              <SelectItem value="unemployed">Unemployed</SelectItem>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="retired">Retired</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField control={form.control} name="employer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employer/Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Company name" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Spouse Information Section */}
                    <div className="lg:col-span-3 mt-6 pt-4 border-t">
                      <FormField
                        control={form.control}
                        name="isMarried"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Is the tenant married?</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Spouse Details - Only show when isMarried is true */}
                    {form.watch("isMarried") && (
                      <>
                        <div className="lg:col-span-3 p-4 bg-slate-50 rounded-lg border">
                          <h4 className="text-md font-medium mb-4 text-gray-700 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Spouse Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="spouseFirstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Spouse First Name <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter spouse first name" {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField control={form.control} name="spouseLastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Spouse Last Name <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter spouse last name" {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField control={form.control} name="spouseEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Spouse Email</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="spouse@example.com" {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField control={form.control} name="spousePhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Spouse Phone <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="+1 (555) 123-4567" {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="spouseEmploymentStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Spouse Employment Status</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="employed">Employed</SelectItem>
                                      <SelectItem value="self-employed">Self-Employed</SelectItem>
                                      <SelectItem value="unemployed">Unemployed</SelectItem>
                                      <SelectItem value="student">Student</SelectItem>
                                      <SelectItem value="retired">Retired</SelectItem>
                                      <SelectItem value="homemaker">Homemaker</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField control={form.control} name="spouseEmployer"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Spouse Employer/Company</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Company name" {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="md:col-span-2">
                              <FormField control={form.control} name="spouseNotes"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Spouse Additional Notes</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder="Any additional notes about the spouse" rows={3} {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Agreement Details Section */}
                    <div className="lg:col-span-3 mt-6 pt-4 border-t">
                      <h4 className="text-md font-medium mb-4 text-gray-700">Agreement Details</h4>
                    </div>

                    <FormField
                      control={form.control}
                      name="agreementPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agreement Period <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 11 Months, 1 Year, 2 Years" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter the duration of the rental agreement
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agreementStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agreement Start Date <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            When did the rental agreement begin?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agreementEndDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agreement End Date <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            When does the rental agreement expire?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}



                {/* Pricing Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 border rounded-lg">
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">
                      Pricing Information
                      {form.watch("listingType") && (
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          ({form.watch("listingType") === "rent" ? "Rental Details" : "Sale Details"})
                        </span>
                      )}
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
                                placeholder="Enter monthly rent amount (e.g., 25000)"
                                type="number"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Dynamic Monthly Rent Schedule */}
                      {form.watch("rentalStatus") === "rented" && (
                        <div className="mt-6 space-y-4 pt-4 border-t col-span-1 lg:col-span-2">
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-base font-semibold">Monthly Rent Schedule</FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => appendRentSchedule({ year: `${rentScheduleFields.length + 1}${getOrdinalSuffix(rentScheduleFields.length + 1)} Year`, amount: "", fromDate: "", toDate: "" })}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Year
                            </Button>
                          </div>

                          <div className="space-y-4">
                            {rentScheduleFields.map((field, index) => (
                              <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg bg-gray-50/50 items-end relative">
                                <div className="md:col-span-2">
                                  <FormLabel className="text-xs">Year</FormLabel>
                                  <Input
                                    {...form.register(`rentSchedule.${index}.year`)}
                                    className="bg-white"
                                  />
                                </div>
                                <div className="md:col-span-3">
                                  <FormLabel className="text-xs">Amount (₹)</FormLabel>
                                  <Input
                                    {...form.register(`rentSchedule.${index}.amount`)}
                                    placeholder="Amount"
                                    className="bg-white"
                                  />
                                </div>
                                <div className="md:col-span-3">
                                  <FormLabel className="text-xs">From</FormLabel>
                                  <Input
                                    type="date"
                                    {...form.register(`rentSchedule.${index}.fromDate`)}
                                    className="bg-white"
                                  />
                                </div>
                                <div className="md:col-span-3">
                                  <FormLabel className="text-xs">To</FormLabel>
                                  <Input
                                    type="date"
                                    {...form.register(`rentSchedule.${index}.toDate`)}
                                    className="bg-white"
                                  />
                                </div>

                                {rentScheduleFields.length > 1 && (
                                  <div className="md:col-span-1 flex justify-center pb-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeRentSchedule(index)}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}

                            {rentScheduleFields.length === 0 && (
                              <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                                No rent schedule added. Click "Add Year" to define the rent structure.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {form.watch("listingType") === "sell" && (
                    <FormField
                      control={form.control}
                      name="sellingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Selling Price (₹) *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter selling price (e.g., 5000000)"
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {!form.watch("listingType") && (
                    <div className="lg:col-span-2 text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                      <p>Please select a listing type above to see pricing options</p>
                    </div>
                  )}
                </div>



                {/* Security & Agreement - Only for Rent */}
                {form.watch("listingType") === "rent" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 border rounded-lg">
                    <div className="lg:col-span-2">
                      <h3 className="text-lg font-semibold mb-4">Security Deposit and Agreement Details</h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="securityDeposit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security Deposit Amount (in ₹)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter security deposit amount" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    {/* Agreement Duration - Only for Already Rented Out */}
                    {form.watch("rentalStatus") === "rented" && (
                      <FormField
                        control={form.control}
                        name="agreementPeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agreement Duration (in Months)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter agreement duration in months" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="agreementStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agreement Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
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
                          <FormLabel>Agreement End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div> */}
                  </div>
                )}


                {/* Notice & Lock-in Period - Only for Rented properties */}
                {form.watch("listingType") === "rent" && form.watch("rentalStatus") === "rented" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 border rounded-lg">
                    <div className="lg:col-span-2">
                      <h3 className="text-lg font-semibold mb-4">Notice and Lock-in Period</h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="noticePeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notice Period / Early Termination Notice <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <FormLabel>Lock-in Period (in Months)</FormLabel>
                          <FormControl>
                            <Input placeholder="Specify lock-in period in months" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}


                {/* Unit Condition & Maintenance */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 border rounded-lg">
                  <div className="lg:col-span-3">
                    <h3 className="text-lg font-semibold mb-4">Unit Condition & Maintenance</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="unitCondition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Condition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <FormItem className="lg:col-span-2">
                        <FormLabel>Furnished Items Checklist</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowFurnishedModal(true)}
                          className="w-full"
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Manage Furnished Items Checklist
                          {furnishedChecklist.filter(item => item.checked).length > 0 && (
                            <span className="ml-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                              {furnishedChecklist.filter(item => item.checked).length} items selected
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
                          <FormLabel>Maintenance Payment By</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                  {form.watch("listingType") !== "rent" && (
                    <FormField
                      control={form.control}
                      name="projectCondition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Condition</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select project condition" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="New Project">New Project</SelectItem>
                              <SelectItem value="Ready Project">Ready Project</SelectItem>
                              <SelectItem value="Preleased">Preleased</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {((form.watch("listingType") === "rent" && form.watch("rentalStatus") === "available") || form.watch("listingType") === "sell") && (
                    <FormField
                      control={form.control}
                      name="possessionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Possession Date</FormLabel>
                          <FormControl>
                            <Input type="date" placeholder="Select possession date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Images & Comments */}
                <div className="grid grid-cols-1 gap-6 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold">Additional Information</h3>

                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building Image (Exterior view only)</FormLabel>
                        <FormDescription className="text-xs text-muted-foreground">
                          Upload only the building exterior image. This image will be shown publicly.
                        </FormDescription>
                        <FormControl>
                          <div className="space-y-4">
                            {/* Upload Button */}
                            <div className="flex items-center gap-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadedImages.length >= 1 || isUploading}
                                className="flex items-center gap-2"
                              >
                                <Upload className="h-4 w-4" />
                                {isUploading ? 'Uploading...' : uploadedImages.length === 0 ? 'Upload Building Image' : 'Image Uploaded'}
                              </Button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </div>

                            {/* Image Preview */}
                            {uploadedImages.length > 0 && (
                              <div className="max-w-xs">
                                <div className="relative group">
                                  <div className="aspect-video rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                                    <img
                                      src={uploadedImages[0]}
                                      alt="Building exterior"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeImage(0)}
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Empty State */}
                            {uploadedImages.length === 0 && (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center max-w-xs">
                                <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500 mb-2">No image uploaded yet</p>
                                <p className="text-sm text-gray-400">
                                  Upload building exterior image only
                                </p>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="internalImages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Images (Max 6)</FormLabel>
                        <FormDescription className="text-xs text-muted-foreground">
                          Upload internal photos of the property.
                        </FormDescription>
                        <FormControl>
                          <div className="space-y-4">
                            {/* Upload Button */}
                            <div className="flex items-center gap-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => internalFileInputRef.current?.click()}
                                disabled={uploadedInternalImages.length >= 6 || isInternalUploading}
                                className="flex items-center gap-2"
                              >
                                <Upload className="h-4 w-4" />
                                {isInternalUploading ? 'Uploading...' : `Upload Internal Images (${uploadedInternalImages.length}/6)`}
                              </Button>
                              <input
                                ref={internalFileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleInternalImageUpload}
                                className="hidden"
                              />
                            </div>

                            {/* Image Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {uploadedInternalImages.map((img, index) => (
                                <div key={index} className="relative group aspect-video rounded-lg border border-gray-200 overflow-hidden">
                                  <img src={img} alt={`Internal ${index + 1}`} className="w-full h-full object-cover" />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeInternalImage(index)}
                                    className="absolute top-1 right-1 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specificComments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Comments</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any additional details or specific notes about the property..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                {/* Form Actions */}
                <div className="flex justify-center gap-4 pt-6 pb-20">
                  <Button type="button" variant="outline" className="px-8"
                    onClick={() => navigate("/manage-property")}>
                    CANCEL
                  </Button>
                  <Button
                    type="submit"
                    className="px-8 bg-primary hover:bg-primary/90"
                  >
                    SUBMIT
                  </Button>
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
          form.setValue('furnishedChecklist', checklist);
        }}
        initialChecklist={furnishedChecklist}
        propertyType={selectedPropertyType as 'residential' | 'commercial' | 'industrial'}
      />
    </main>
  );
};

export default AddPropertyForm;