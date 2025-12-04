import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Image as ImageIcon, Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { auth } from "@/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { API_BASE_URL } from "@/utils/config";
import { uploadBase64Image } from "@/services/uploadService";

interface ServiceRequestForm {
  serviceType: string;
  image: string | null;
  comment: string;
}

const SERVICE_TYPES = [
  "Plumbing Issue",
  "Leakage/ Seepage Issue",
  "Fixtures issue",
  "Painting work",
  "Electrical Issue",
  "Any other"
];

const RequestServices = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [userPhone, setUserPhone] = useState<string>("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [serviceForms, setServiceForms] = useState<Record<string, ServiceRequestForm>>(() => {
    const initial: Record<string, ServiceRequestForm> = {};
    SERVICE_TYPES.forEach(type => {
      initial[type] = {
        serviceType: type,
        image: null,
        comment: ""
      };
    });
    return initial;
  });

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user phone number from backend
        try {
          const response = await fetch(`${API_BASE_URL}/users/${currentUser.uid}`);
          if (response.ok) {
            const data = await response.json();
            if (data.user && data.user.phoneNumber) {
              setUserPhone(data.user.phoneNumber);
            }
          }
        } catch (error) {
          console.error("Error fetching user phone:", error);
        }
      } else {
        setUserPhone("");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageUpload = (serviceType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setServiceForms(prev => ({
        ...prev,
        [serviceType]: {
          ...prev[serviceType],
          image: result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (serviceType: string) => {
    setServiceForms(prev => ({
      ...prev,
      [serviceType]: {
        ...prev[serviceType],
        image: null
      }
    }));
    // Reset file input
    if (fileInputRefs.current[serviceType]) {
      fileInputRefs.current[serviceType]!.value = '';
    }
  };

  const handleCommentChange = (serviceType: string, comment: string) => {
    setServiceForms(prev => ({
      ...prev,
      [serviceType]: {
        ...prev[serviceType],
        comment
      }
    }));
  };

  const handleSubmitRequest = async (serviceType: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to raise a request",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    const form = serviceForms[serviceType];
    
    if (!form.comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a comment describing the issue",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(serviceType);

      // Fetch property details to get owner information
      let property = null;
      let ownerPhoneNumber = '';
      let ownerEmail = '';
      let ownerName = '';
      let propertyTitle = '';
      let propertyAddress = '';

      if (propertyId) {
        try {
          const propertyResponse = await fetch(`${API_BASE_URL}/properties/${propertyId}`);
          if (propertyResponse.ok) {
            const propertyData = await propertyResponse.json();
            if (propertyData.success && propertyData.property) {
              property = propertyData.property;
              propertyTitle = property.title || '';
              propertyAddress = property.address || property.city || property.location || 'Not specified';
              ownerName = property.ownerName || 'Unknown Owner';
              ownerEmail = property.ownerEmail || '';

              // Fetch owner's phone number
              if (property.ownerUID) {
                try {
                  const ownerResponse = await fetch(`${API_BASE_URL}/users/${property.ownerUID}`);
                  if (ownerResponse.ok) {
                    const ownerData = await ownerResponse.json();
                    if (ownerData.user && ownerData.user.phoneNumber) {
                      ownerPhoneNumber = ownerData.user.phoneNumber;
                    }
                    if (ownerData.user && ownerData.user.email && !ownerEmail) {
                      ownerEmail = ownerData.user.email;
                    }
                  }
                } catch (error) {
                  console.error("Error fetching owner details:", error);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error fetching property details:", error);
        }
      }

      // Upload image to Cloudflare R2 if provided
      let serviceImageUrl = '';
      if (form.image) {
        try {
          console.log('📤 Uploading service request image to Cloudflare R2...');
          serviceImageUrl = await uploadBase64Image(
            form.image,
            'service-requests',
            `${user.uid}-${Date.now()}`
          );
          console.log('✅ Image uploaded successfully:', serviceImageUrl);
        } catch (uploadError) {
          console.error('❌ Failed to upload image:', uploadError);
          toast({
            title: "Image Upload Failed",
            description: "Failed to upload image. Submitting request without image.",
            variant: "destructive"
          });
        }
      }

      // Prepare notification payload
      const notificationPayload = {
        type: 'service_request',
        title: `Service Request: ${serviceType}`,
        message: `User ${user.displayName || user.email || 'Unknown User'} has raised a ${serviceType} request${propertyId ? ` for property: ${propertyTitle || propertyId}` : ''}. ${form.comment}`,
        propertyId: propertyId || '',
        ownerId: property?.ownerUID || '',
        ownerName: ownerName,
        ownerPhone: ownerPhoneNumber || property?.primaryNo || '',
        ownerEmail: ownerEmail,
        // User details (person who raised the request)
        userId: user.uid || '',
        userName: user.displayName || user.email || 'Unknown User',
        userEmail: user.email || '',
        userPhone: userPhone || user.phoneNumber || '',
        // Property details
        propertyTitle: propertyTitle,
        propertyAddress: propertyAddress,
        propertyListingType: property?.listingType || 'rent',
        // Service request specific fields
        serviceType: serviceType,
        serviceComment: form.comment,
        serviceImage: serviceImageUrl, // Use uploaded URL instead of base64
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'high'
      };

      console.log(`📤 Sending Service Request:`, notificationPayload);

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
          title: "Request Submitted",
          description: `Your ${serviceType} request has been sent to the admin. They will contact you soon.`,
        });

        // Reset form after successful submission
        setServiceForms(prev => ({
          ...prev,
          [serviceType]: {
            serviceType: serviceType,
            image: null,
            comment: ""
          }
        }));
        if (fileInputRefs.current[serviceType]) {
          fileInputRefs.current[serviceType]!.value = '';
        }
      } else {
        throw new Error(notificationData.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error(`Error submitting ${serviceType} request:`, error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Raise a Request — Property Management</title>
        <meta name="description" content="Raise maintenance and service requests for your property" />
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
              <Wrench className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">RAISE A REQUEST</h1>
              <p className="text-lg text-muted-foreground">
                {propertyId ? `Property ID: ${propertyId}` : "Submit maintenance and service requests"}
              </p>
            </div>
          </div>
        </div>

        {/* Service Request Forms */}
        <Card>
          <CardHeader>
            <CardTitle>Service Request Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {SERVICE_TYPES.map((serviceType) => {
                const form = serviceForms[serviceType];
                const isSubmitting = submitting === serviceType;

                return (
                  <div key={serviceType} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{serviceType}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Image Upload */}
                      <div className="space-y-2">
                        <Label>Image</Label>
                        <div className="space-y-2">
                          {form.image ? (
                            <div className="relative">
                              <img
                                src={form.image}
                                alt={`${serviceType} image`}
                                className="w-full h-32 object-cover rounded-md border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => removeImage(serviceType)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center h-32">
                              <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRefs.current[serviceType]?.click()}
                                className="w-full"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Image
                              </Button>
                              <input
                                ref={(el) => {
                                  fileInputRefs.current[serviceType] = el;
                                }}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(serviceType, e)}
                                className="hidden"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Comment */}
                      <div className="space-y-2">
                        <Label htmlFor={`comment-${serviceType}`}>Comment</Label>
                        <Textarea
                          id={`comment-${serviceType}`}
                          placeholder="Describe the issue..."
                          value={form.comment}
                          onChange={(e) => handleCommentChange(serviceType, e.target.value)}
                          rows={5}
                          className="resize-none"
                        />
                      </div>

                      {/* Raise Request Button */}
                      <div className="space-y-2 flex flex-col">
                        <Label>&nbsp;</Label>
                        <Button
                          type="button"
                          onClick={() => handleSubmitRequest(serviceType)}
                          disabled={isSubmitting || !form.comment.trim()}
                          className="w-full cursor-pointer"
                          size="sm"
                          variant="default"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Raising Request...
                            </>
                          ) : (
                            "Raise a Request"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default RequestServices;
