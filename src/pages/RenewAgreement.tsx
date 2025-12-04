import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { API_BASE_URL } from "@/utils/config";

const RenewAgreement = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        toast({
          title: "Login Required",
          description: "Please login to renew agreement",
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

  const handleRenew = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to renew agreement",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    if (!confirm("Are you sure you want to request agreement renewal? Admin will be notified.")) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/agreements/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.uid,
        },
        body: JSON.stringify({
          propertyId: propertyId || '',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Renewal Request Submitted",
          description: "Your agreement renewal request has been submitted. Admin has been notified.",
        });
        navigate(`/manage-property`);
      } else {
        throw new Error(data.message || 'Failed to submit renewal request');
      }
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to submit renewal request. Please try again later.",
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
        <title>Renew Agreement | PropBank</title>
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
              <RefreshCw className="h-5 w-5" />
              3. Go for Renewal
            </CardTitle>
            <CardDescription>
              {property && `Property: ${property.title || property.id}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  Requesting agreement renewal will notify the admin. The admin will process your renewal request and contact you.
                </p>
              </div>

              {property && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Agreement Details:</h3>
                  {property.agreementStartDate && (
                    <p className="text-sm">
                      <span className="font-medium">Start Date:</span> {property.agreementStartDate}
                    </p>
                  )}
                  {property.agreementEndDate && (
                    <p className="text-sm">
                      <span className="font-medium">End Date:</span> {property.agreementEndDate}
                    </p>
                  )}
                  {property.agreementPeriod && (
                    <p className="text-sm">
                      <span className="font-medium">Period:</span> {property.agreementPeriod} months
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={handleRenew}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Request Renewal
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
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default RenewAgreement;

