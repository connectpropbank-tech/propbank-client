import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Loader2 } from "lucide-react";
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

const Review = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [reviewerType, setReviewerType] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Tenant part (reviewing owner)
  const [tenantPart, setTenantPart] = useState({
    ownerUnderstandable: "",
    softNature: "",
    ownerTransparent: "",
    problemSolver: "",
    easyOnRefundMoney: "",
    overallExperience: "",
  });

  // Owner part (reviewing tenant)
  const [ownerPart, setOwnerPart] = useState({
    tenantUnderstandable: "",
    softNature: "",
    tenantTransparent: "",
    problemSolver: "",
    punctualOnPayment: "",
    overallExperience: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        toast({
          title: "Login Required",
          description: "Please login to submit a review",
          variant: "destructive"
        });
        navigate("/auth");
        return;
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
            // Auto-detect reviewer type based on property owner
            if (data.property.ownerUID === user?.uid) {
              setReviewerType("owner");
            } else {
              setReviewerType("tenant");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId && user) {
      fetchProperty();
    } else if (propertyId) {
      setLoading(false);
    }
  }, [propertyId, user]);

  const handleTenantPartChange = (field: string, value: string) => {
    setTenantPart(prev => ({ ...prev, [field]: value }));
  };

  const handleOwnerPartChange = (field: string, value: string) => {
    setOwnerPart(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to submit a review",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    if (!reviewerType) {
      toast({
        title: "Reviewer Type Required",
        description: "Please select whether you are a tenant or owner",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Build review details message based on reviewer type
      let reviewDetails = '';
      if (reviewerType === 'tenant') {
        // Tenant reviewing owner
        reviewDetails = `
Owner Review by Tenant:
- Owner Understandable: ${tenantPart.ownerUnderstandable || 'Not rated'}
- Soft Nature: ${tenantPart.softNature || 'Not rated'}
- Owner Transparent: ${tenantPart.ownerTransparent || 'Not rated'}
- Problem Solver: ${tenantPart.problemSolver || 'Not rated'}
- Easy on Refund Money: ${tenantPart.easyOnRefundMoney || 'Not rated'}
- Overall Experience: ${tenantPart.overallExperience || 'Not rated'}`;
      } else {
        // Owner reviewing tenant
        reviewDetails = `
Tenant Review by Owner:
- Tenant Understandable: ${ownerPart.tenantUnderstandable || 'Not rated'}
- Soft Nature: ${ownerPart.softNature || 'Not rated'}
- Tenant Transparent: ${ownerPart.tenantTransparent || 'Not rated'}
- Problem Solver: ${ownerPart.problemSolver || 'Not rated'}
- Punctual on Payment: ${ownerPart.punctualOnPayment || 'Not rated'}
- Overall Experience: ${ownerPart.overallExperience || 'Not rated'}`;
      }

      // Prepare notification payload for admin
      const notificationPayload = {
        type: 'review',
        title: `New Review: ${reviewerType === 'tenant' ? 'Tenant reviewing Owner' : 'Owner reviewing Tenant'}`,
        message: `${user.displayName || user.email || 'A user'} has submitted a review${property ? ` for property: ${property.title || propertyId}` : ''}.${reviewDetails}`,
        propertyId: propertyId || '',
        propertyTitle: property?.title || '',
        propertyAddress: property?.address || property?.city || '',
        // Reviewer details
        userId: user.uid,
        userName: user.displayName || user.email || 'Unknown User',
        userEmail: user.email || '',
        // Review data
        reviewerType: reviewerType,
        tenantPart: reviewerType === 'tenant' ? tenantPart : null,
        ownerPart: reviewerType === 'owner' ? ownerPart : null,
        // Owner details (if available)
        ownerId: property?.ownerUID || '',
        ownerName: property?.ownerName || '',
        ownerEmail: property?.ownerEmail || '',
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'medium'
      };

      console.log('📤 Sending Review Notification:', notificationPayload);

      const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Review Submitted",
          description: "Your review has been submitted successfully and the admin has been notified.",
        });
        // Navigate back
        navigate(`/manage-property`);
      } else {
        throw new Error(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again later.",
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
        <title>Submit Review | PropBank</title>
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
              <Star className="h-5 w-5" />
              Submit Review
            </CardTitle>
            <CardDescription>
              {property && `Property: ${property.title || property.id}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="reviewerType">I am a *</Label>
                <Select value={reviewerType} onValueChange={setReviewerType}>
                  <SelectTrigger id="reviewerType">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tenant Part - Reviewing Owner */}
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="font-semibold text-lg">A. Tenant Part (Reviewing Owner)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>A. Owner Understandable</Label>
                    <Textarea
                      placeholder="Rate/comment on owner's understanding..."
                      value={tenantPart.ownerUnderstandable}
                      onChange={(e) => handleTenantPartChange("ownerUnderstandable", e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>B. Soft Nature</Label>
                    <Textarea
                      placeholder="Rate/comment on owner's nature..."
                      value={tenantPart.softNature}
                      onChange={(e) => handleTenantPartChange("softNature", e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>C. Owner Transparent</Label>
                    <Textarea
                      placeholder="Rate/comment on owner's transparency..."
                      value={tenantPart.ownerTransparent}
                      onChange={(e) => handleTenantPartChange("ownerTransparent", e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>D. Problem Solver</Label>
                    <Textarea
                      placeholder="Rate/comment on owner's problem-solving..."
                      value={tenantPart.problemSolver}
                      onChange={(e) => handleTenantPartChange("problemSolver", e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E. Easy on Refund Money</Label>
                    <Textarea
                      placeholder="Rate/comment on refund process..."
                      value={tenantPart.easyOnRefundMoney}
                      onChange={(e) => handleTenantPartChange("easyOnRefundMoney", e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>F. Overall Experience</Label>
                    <Textarea
                      placeholder="Rate/comment on overall experience..."
                      value={tenantPart.overallExperience}
                      onChange={(e) => handleTenantPartChange("overallExperience", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Owner Part - Reviewing Tenant */}
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="font-semibold text-lg">B. Owner Part (Reviewing Tenant)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>A. Tenant Understandable</Label>
                    <Textarea
                      placeholder="Rate/comment on tenant's understanding..."
                      value={ownerPart.tenantUnderstandable}
                      onChange={(e) => handleOwnerPartChange("tenantUnderstandable", e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>B. Soft Nature</Label>
                    <Textarea
                      placeholder="Rate/comment on tenant's nature..."
                      value={ownerPart.softNature}
                      onChange={(e) => handleOwnerPartChange("softNature", e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>C. Tenant Transparent</Label>
                    <Textarea
                      placeholder="Rate/comment on tenant's transparency..."
                      value={ownerPart.tenantTransparent}
                      onChange={(e) => handleOwnerPartChange("tenantTransparent", e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>D. Problem Solver</Label>
                    <Textarea
                      placeholder="Rate/comment on tenant's problem-solving..."
                      value={ownerPart.problemSolver}
                      onChange={(e) => handleOwnerPartChange("problemSolver", e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E. Punctual on Pay Payment</Label>
                    <Textarea
                      placeholder="Rate/comment on payment punctuality..."
                      value={ownerPart.punctualOnPayment}
                      onChange={(e) => handleOwnerPartChange("punctualOnPayment", e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>F. Overall Experience</Label>
                    <Textarea
                      placeholder="Rate/comment on overall experience..."
                      value={ownerPart.overallExperience}
                      onChange={(e) => handleOwnerPartChange("overallExperience", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={submitting || !reviewerType}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Submit Review
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

export default Review;

