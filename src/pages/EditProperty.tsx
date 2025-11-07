import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

const formSchema = z.object({
  propertyTitle: z.string().min(1, "Property title is required"),
  propertyType: z.string().min(1, "Property type is required"),
  configuration: z.string().min(1, "Configuration is required"),
  listingType: z.string().min(1, "Listing type is required"),
  unitNumber: z.string().optional(),
  floor: z.string().optional(),
  buildingName: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  carpetArea: z.string().optional(),
  plotArea: z.string().optional(),
  constructedArea: z.string().optional(),
  
  // Tenant Information
  tenantName: z.string().optional(),
  personName: z.string().optional(),
  mobileNumber: z.string().optional(),
  primaryNo: z.string().optional(),
  ultNo: z.string().optional(),
  
  // Pricing Details
  monthlyRent: z.string().optional(),
  sellingPrice: z.string().optional(),
  monthlyRent1stYear: z.string().optional(),
  monthlyRent2ndYear: z.string().optional(),
  monthlyRent3rdYear: z.string().optional(),
  monthlyRent4thYear: z.string().optional(),
  rentFromDate1: z.string().optional(),
  rentToDate1: z.string().optional(),
  rentFromDate2: z.string().optional(),
  rentToDate2: z.string().optional(),
  paymentDueDate: z.string().optional(),
  escalationPercentage: z.string().optional(),
  escalationAmount: z.string().optional(),
  securityDeposit: z.string().optional(),
  agreementPeriod: z.string().optional(),
  agreementStartDate: z.string().optional(),
  agreementEndDate: z.string().optional(),
  noticePeriod: z.string().optional(),
  lockInPeriod: z.string().optional(),
  unitCondition: z.string().optional(),
  maintenanceToBePaidBy: z.string().optional(),
  images: z.array(z.string()).optional(),
  specificComments: z.string().optional(),
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
  buildingName: string;
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
  paymentDueDate: string;
  escalationPercentage: string;
  escalationAmount: string;
  securityDeposit: string;
  agreementPeriod: string;
  agreementStartDate: string;
  agreementEndDate: string;
  noticePeriod: string;
  lockInPeriod: string;
  unitCondition: string;
  maintenanceToBePaidBy: string;
  images: string[];
  specificComments: string;
  ownerUID: string;
  
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
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyTitle: "",
      propertyType: "",
      configuration: "",
      listingType: "",
      unitNumber: "",
      floor: "",
      buildingName: "",
      location: "",
      carpetArea: "",
      plotArea: "",
      constructedArea: "",
      
      // Tenant Information
      tenantName: "",
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
      images: [],
      specificComments: "",
    },
  });

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails(propertyId);
    }
  }, [propertyId]);

  const fetchPropertyDetails = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8002/properties/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        const propertyData = data.property;
        console.log("Fetched property data:", propertyData);
        setProperty(propertyData);
        setUploadedImages(propertyData.images || []);
        
        // Populate form with existing data
        const formData = {
          propertyTitle: propertyData.title || "",
          propertyType: propertyData.propertyType || "",
          configuration: propertyData.configuration || "",
          listingType: propertyData.listingType || "",
          unitNumber: propertyData.unitNumber || "",
          floor: propertyData.floor || "",
          buildingName: propertyData.buildingName || "",
          location: propertyData.location || propertyData.address || "",
          carpetArea: propertyData.carpetArea || "",
          plotArea: propertyData.plotArea || "",
          constructedArea: propertyData.constructedArea || "",
          
          // Tenant Information
          tenantName: propertyData.tenantName || "",
          personName: propertyData.personName || "",
          mobileNumber: propertyData.mobileNumber || "",
          primaryNo: propertyData.primaryNo || "",
          ultNo: propertyData.ultNo || "",
          
          // Pricing Details
          monthlyRent: propertyData.monthlyRent || "",
          sellingPrice: propertyData.sellingPrice || "",
          monthlyRent1stYear: propertyData.monthlyRent1stYear || "",
          monthlyRent2ndYear: propertyData.monthlyRent2ndYear || "",
          monthlyRent3rdYear: propertyData.monthlyRent3rdYear || "",
          monthlyRent4thYear: propertyData.monthlyRent4thYear || "",
          rentFromDate1: propertyData.rentFromDate1 || "",
          rentToDate1: propertyData.rentToDate1 || "",
          rentFromDate2: propertyData.rentFromDate2 || "",
          rentToDate2: propertyData.rentToDate2 || "",
          paymentDueDate: propertyData.paymentDueDate || "",
          escalationPercentage: propertyData.escalationPercentage || "",
          escalationAmount: propertyData.escalationAmount || "",
          securityDeposit: propertyData.securityDeposit || "",
          agreementPeriod: propertyData.agreementPeriod || "",
          agreementStartDate: propertyData.agreementStartDate || "",
          agreementEndDate: propertyData.agreementEndDate || "",
          noticePeriod: propertyData.noticePeriod || "",
          lockInPeriod: propertyData.lockInPeriod || "",
          unitCondition: propertyData.unitCondition || "",
          maintenanceToBePaidBy: propertyData.maintenanceToBePaidBy || "",
          images: propertyData.images || [],
          specificComments: propertyData.specificComments || "",
        };
        
        console.log("Populating form with data:", formData);
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

  // Image handling functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setUploadedImages(prev => {
            const newImages = [...prev, result];
            form.setValue('images', newImages);
            return newImages;
          });
        };
        reader.readAsDataURL(file);
      }
    });

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
          { value: "shop", label: "Shop"},
        ];
      case "industrial":
        return [
          { value: "unit-ncc-shed", label: "Unit / NCC / Shed / Land" },
          { value: "ground-floor", label: "Ground / Ground+1 / etc ( if RCC )" },
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

      // Prepare update data
      const updateData = {
        ...data,
        ownerUID: currentUser.uid,
      };

      // Send update request to backend
      const response = await fetch(`http://localhost:8002/properties/${propertyId}`, {
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
    const hasActiveAgreement = property.agreementStartDate && property.agreementEndDate;
    const isCurrentlyRented = property.isRented || hasActiveTenant || hasActiveAgreement;
    const isCurrentlySold = property.isSold;
    
    return !isCurrentlyRented && !isCurrentlySold;
  };

  const getPropertyStatusMessage = () => {
    if (!property) return "";
    
    const hasActiveTenant = property.tenantName && property.tenantName.trim() !== "";
    const isCurrentlyRented = property.isRented || hasActiveTenant;
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
              <h1 className="text-3xl font-bold">Edit your property details</h1>
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

                {/* Pricing Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 border rounded-lg">
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-6">
                      Pricing Information
                      {form.watch("listingType") && (
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          ({form.watch("listingType") === "rent" ? "Rental Details" : "Sale Details"})
                        </span>
                      )}
                    </h3>
                  </div>

                  {form.watch("listingType") === "rent" && (
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
                              disabled={!isPropertyEditable()}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 border rounded-lg">
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
                        disabled={uploadedImages.length >= 6 || !isPropertyEditable()}
                      >
                        {!isPropertyEditable() 
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
    </main>
  );
};

export default EditProperty;
