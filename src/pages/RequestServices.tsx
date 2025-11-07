import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { serviceApi, Service, ServiceRequest } from "@/services/serviceApi";
import { auth } from "@/firebase";
import { User, onAuthStateChanged } from "firebase/auth";

const RequestServices = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [userRequests, setUserRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [message, setMessage] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servicesData, requestsData] = await Promise.all([
        serviceApi.getServices(),
        serviceApi.getServiceRequests(user!.uid)
      ]);
      setServices(servicesData);
      setUserRequests(requestsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load services",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = async (service: Service) => {
    if (!user) return;
    
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide a message with your service request",
        variant: "destructive"
      });
      return;
    }

    try {
      setRequesting(service.id);
      await serviceApi.createServiceRequest({
        userUID: user.uid,
        serviceId: service.id,
        propertyId: propertyId,
        message: message
      });

      toast({
        title: "Request Submitted Successfully",
        description: "One of our members will reach out to you soon!",
      });

      setShowRequestForm(false);
      setMessage("");
      setSelectedService(null);
      await loadData(); // Refresh requests
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit service request",
        variant: "destructive"
      });
    } finally {
      setRequesting(null);
    }
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setShowRequestForm(true);
    setMessage("");
  };

  const getStatusColor = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Wrench className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Request Services — Property Management</title>
        <meta name="description" content="Request maintenance and services for your property" />
      </Helmet>

      <div className="max-w-4xl mx-auto">
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
              <h1 className="text-3xl font-bold">Request Services</h1>
              <p className="text-lg text-muted-foreground">Request maintenance and services for Property ID: {propertyId}</p>
            </div>
          </div>
        </div>

        {/* Service Request Form Modal */}
        {showRequestForm && selectedService && (
          <Card className="mb-8 border-primary">
            <CardHeader>
              <CardTitle>Request Service: {selectedService.name}</CardTitle>
              <CardDescription>
                {selectedService.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Please describe your requirements, preferred timing, and any special instructions..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={() => handleRequestService(selectedService)}
                  disabled={requesting === selectedService.id || !message.trim()}
                >
                  {requesting === selectedService.id ? "Submitting..." : "Submit Request"}
                </Button>
                <Button variant="outline" onClick={() => setShowRequestForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Your Service Requests */}
        {userRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Service Requests</h2>
            <div className="space-y-4">
              {userRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{request.serviceName}</CardTitle>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{request.message}</p>
                    {request.adminNotes && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-blue-800">Admin Notes:</p>
                        <p className="text-sm text-blue-700">{request.adminNotes}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Requested on: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Services */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Available Services</h2>
          
          {/* Legal Services */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Legal Services - Consultation Free**</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.filter(s => s.category === 'legal').map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleServiceClick(service)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{service.code}</Badge>
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                    <Button className="w-full mt-4" variant="outline">
                      Request Service
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Other Related Services */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Other Related Services</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.filter(s => s.category === 'other').map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleServiceClick(service)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{service.code}</Badge>
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                    <Button className="w-full mt-4" variant="outline">
                      Request Service
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RequestServices;
