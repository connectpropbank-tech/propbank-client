import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
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

const InspectionReport = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [reportType, setReportType] = useState<string>("");
  const [report, setReport] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Text fields only
  const [keysDetails, setKeysDetails] = useState<string>("");
  const [otherDetails, setOtherDetails] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        toast({
          title: "Login Required",
          description: "Please login to submit an inspection report",
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
        console.error("Error fetching property:", error);
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
        description: "Please login to submit an inspection report",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    if (!reportType) {
      toast({
        title: "Report Type Required",
        description: "Please select a report type",
        variant: "destructive"
      });
      return;
    }

    if (!report.trim()) {
      toast({
        title: "Report Required",
        description: "Please provide the inspection report details",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/inspection-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.uid,
        },
        body: JSON.stringify({
          propertyId: propertyId || '',
          reportType: reportType,
          report: report.trim(),
          keysDetails: keysDetails,
          otherDetails: otherDetails,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Report Submitted",
          description: "Your inspection report has been submitted successfully and the admin has been notified.",
        });
        // Reset form
        setReportType("");
        setReport("");
        setKeysDetails("");
        setOtherDetails("");
        // Navigate back
        navigate(`/property/${propertyId}`);
      } else {
        throw new Error(data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error("Error submitting inspection report:", error);
      toast({
        title: "Error",
        description: "Failed to submit inspection report. Please try again later.",
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
        <title>Submit Inspection Report | PropBank</title>
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
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
              <FileText className="h-5 w-5" />
              Submit Inspection Report
            </CardTitle>
            <CardDescription>
              {property && `Property: ${property.title || property.id}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type *</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="reportType">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_possession">1. On Possession</SelectItem>
                    <SelectItem value="on_handover">2. On Handover</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* On Possession Section */}
              {reportType === "on_possession" && (
                <div className="space-y-6 border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">1. On Possession</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="keysDetails">Keys Details</Label>
                      <Textarea
                        id="keysDetails"
                        placeholder="Enter keys details..."
                        value={keysDetails}
                        onChange={(e) => setKeysDetails(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otherDetails">If any other, add option</Label>
                      <Textarea
                        id="otherDetails"
                        placeholder="Add any other details..."
                        value={otherDetails}
                        onChange={(e) => setOtherDetails(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* On Handover Section */}
              {reportType === "on_handover" && (
                <div className="space-y-6 border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">2. On Handover</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="keysDetails">Keys Details</Label>
                      <Textarea
                        id="keysDetails"
                        placeholder="Enter keys details..."
                        value={keysDetails}
                        onChange={(e) => setKeysDetails(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otherDetails">If any other, add option</Label>
                      <Textarea
                        id="otherDetails"
                        placeholder="Add any other details..."
                        value={otherDetails}
                        onChange={(e) => setOtherDetails(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="report">Inspection Report *</Label>
                <Textarea
                  id="report"
                  placeholder="Enter the inspection report details as per the table format..."
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={submitting || !reportType || !report.trim()}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Submit Report
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

export default InspectionReport;
