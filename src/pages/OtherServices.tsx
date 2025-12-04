import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { API_BASE_URL } from "@/utils/config";

const OTHER_SERVICE_TYPES = [
  "Keys Management",
  "Police verification",
  "Society procedure",
  "All maintenance work To shift (exp. Borne By owner)",
  "Pre-Rental Service - Painting, plumbing, carpenter, electrical",
  "Flat verification Before handover (In Case of Purchase) cost Rs 25000/-",
  "Client Owner Meeting arrangement with LOI"
];

const OtherServices = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [serviceType, setServiceType] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [userPhone, setUserPhone] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        toast({
          title: "Login Required",
          description: "Please login to request services",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }
      // Fetch user phone number
      try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.uid}`);
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.phoneNumber) {
            setUserPhone(data.user.phoneNumber);
          }
        }
      } catch (error) {
        
      }
    });
    return () => unsubscribe();
  }, [navigate, toast]);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.property) {
            setProperty(data.property);
          }
        }
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    } else {
      setLoading(false);
    }
  }, [propertyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to request services",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    if (!serviceType) {
      toast({
        title: "Service Type Required",
        description: "Please select a service type",
        variant: "destructive"
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide details about your service request",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Fetch owner details
      let ownerPhoneNumber = property?.primaryNo || '';
      let ownerEmail = property?.ownerEmail || '';
      if (property?.ownerUID) {
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

      // Special handling for Keys Management - send notification to owner
      if (serviceType === "Keys Management") {
        // This will be handled by the admin notification system
        // The admin can then notify the owner
      }

      // Prepare notification payload
      const notificationPayload = {
        type: 'other_service_request',
        title: `Other Service Request: ${serviceType}`,
        message: `User ${user.displayName || user.email || 'Unknown User'} has requested service: ${serviceType} for property: ${property?.title || propertyId}. Details: ${comment}`,
        propertyId: propertyId || '',
        ownerId: property?.ownerUID || '',
        ownerName: property?.ownerName || 'Unknown Owner',
        ownerPhone: ownerPhoneNumber,
        ownerEmail: ownerEmail,
        userId: user.uid || '',
        userName: user.displayName || user.email || 'Unknown User',
        userEmail: user.email || '',
        userPhone: userPhone || user.phoneNumber || '',
        propertyTitle: property?.title || '',
        propertyAddress: property?.address || property?.city || property?.location || 'Not specified',
        propertyListingType: property?.listingType || 'rent',
        serviceType: serviceType,
        serviceComment: comment,
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
          title: "Request Submitted",
          description: `Your ${serviceType} request has been sent to the admin.${serviceType === "Keys Management" ? " Owner will be notified." : ""}`,
        });
        // Reset form
        setServiceType("");
        setComment("");
        navigate(`/manage-property`);
      } else {
        throw new Error(notificationData.message || 'Failed to submit request');
      }
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Other Related Services | PropBank</title>
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Other Related Services
            </CardTitle>
            <CardDescription>
              {property && `Property: ${property.title || property.id}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="serviceType">Select Service *</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger id="serviceType">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {OTHER_SERVICE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {serviceType === "Keys Management" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Note: Visit Update - Owner will be notified
                  </p>
                )}
                {serviceType === "Flat verification Before handover (In Case of Purchase) cost Rs 25000/-" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cost: Rs 25,000/-
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Details / Comments *</Label>
                <Textarea
                  id="comment"
                  placeholder="Please provide details about your service request..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={submitting || !serviceType || !comment.trim()}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Wrench className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default OtherServices;

