import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { API_BASE_URL } from "@/utils/config";

const TerminateAgreement = () => {
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
          description: "Please login to terminate agreement",
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

  const handleTerminate = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to terminate agreement",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    if (!confirm("Are you sure you want to terminate this agreement? This will:\n\n• Remove all tenant information from this property\n• Mark the property as 'Available for Rent'\n• Notify the admin about this termination\n\nThis action cannot be undone.")) {
      return;
    }

    setSubmitting(true);
    try {
      // Ensure API_BASE_URL doesn't have trailing slash
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const url = `${baseUrl}/agreements/terminate`;
      
      
      
      
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.uid,
        },
        body: JSON.stringify({
          propertyId: propertyId || '',
        }),
      });

      // Read response text once
      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        
      } catch (parseError) {
        
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }

      // Check if we got the root endpoint response by mistake
      if (data.message === "ShoPROP Backend API is running!") {
        
        throw new Error("Request was redirected to root endpoint. Please check the API URL and server configuration.");
      }

      if (data.success) {
        toast({
          title: "Agreement Terminated",
          description: "Tenant information has been removed and property is now available for rent. Admin has been notified.",
        });
        navigate(`/manage-property`);
      } else {
        throw new Error(data.message || 'Failed to terminate agreement');
      }
    } catch (error) {
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to terminate agreement. Please try again later.';
      toast({
        title: "Error",
        description: errorMessage,
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
        <title>Terminate Agreement | PropBank</title>
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
              <XCircle className="h-5 w-5" />
              4. Terminate Agreement
            </CardTitle>
            <CardDescription>
              {property && `Property: ${property.title || property.id}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Alert variant="destructive" className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <AlertDescription className="flex-1">
                  <strong>Warning:</strong> Terminating this agreement will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Remove all tenant information from this property</li>
                    <li>Clear agreement dates and lease details</li>
                    <li>Mark the property as "Available for Rent"</li>
                    <li>Notify the admin with full owner, tenant and property details</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {property && (
                <div className="space-y-4">
                  {/* Tenant Details Section */}
                  {(property.tenantName || property.mobileNumber || (property.tenants && property.tenants.length > 0)) && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h3 className="font-semibold text-orange-800 mb-2">Tenant Information (Will be removed):</h3>
                      {property.tenantName && (
                        <p className="text-sm text-orange-700">
                          <span className="font-medium">Tenant Name:</span> {property.tenantName}
                        </p>
                      )}
                      {property.personName && (
                        <p className="text-sm text-orange-700">
                          <span className="font-medium">Contact Person:</span> {property.personName}
                        </p>
                      )}
                      {property.mobileNumber && (
                        <p className="text-sm text-orange-700">
                          <span className="font-medium">Mobile:</span> {property.mobileNumber}
                        </p>
                      )}
                      {property.ultNo && (
                        <p className="text-sm text-orange-700">
                          <span className="font-medium">Alt. Contact:</span> {property.ultNo}
                        </p>
                      )}
                      {property.tenants && property.tenants.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-orange-700">Additional Tenants:</p>
                          {property.tenants.filter((t: any) => t.isActive).map((tenant: any, index: number) => (
                            <p key={index} className="text-sm text-orange-700 ml-2">
                              • {tenant.firstName} {tenant.lastName} ({tenant.email}, {tenant.phone})
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Agreement Details Section */}
                  <div className="p-4 bg-gray-50 border rounded-lg">
                    <h3 className="font-semibold mb-2">Agreement Details:</h3>
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
                    {property.monthlyRent && (
                      <p className="text-sm">
                        <span className="font-medium">Monthly Rent:</span> ₹{property.monthlyRent}
                      </p>
                    )}
                    {property.securityDeposit && (
                      <p className="text-sm">
                        <span className="font-medium">Security Deposit:</span> ₹{property.securityDeposit}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={handleTerminate}
                  disabled={submitting}
                  variant="destructive"
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Terminating...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Terminate Agreement
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

export default TerminateAgreement;

