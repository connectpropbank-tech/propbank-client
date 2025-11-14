import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, User, FileText, MapPin, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "../firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { API_BASE_URL } from "../utils/config";

interface BuyerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  offerAmount: string;
  financingType: string;
  preApprovalAmount: string;
  closingDate: string;
  currentAddress: string;
  employmentStatus: string;
  employer: string;
  annualIncome: string;
  agentName: string;
  agentPhone: string;
  notes: string;
}

const AddBuyer = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
    const [user, setUser] = useState<FirebaseUser | null>(null);
  const [existingBuyers, setExistingBuyers] = useState<BuyerData[]>([]);
  const [propertyTitle, setPropertyTitle] = useState<string>('');

  const [buyers, setBuyers] = useState<BuyerData[]>([
    {
      id: Date.now().toString(),
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      emergencyContact: '',
      offerAmount: '',
      financingType: '',
      preApprovalAmount: '',
      closingDate: '',
      currentAddress: '',
      employmentStatus: '',
      employer: '',
      annualIncome: '',
      agentName: '',
      agentPhone: '',
      notes: ''
    }
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!propertyId) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`);
        const data = await response.json();
        
        if (data.success) {
          const property = data.property;
          setPropertyTitle(property.title);
          
          // Set existing buyers if any
          if (property.buyers && property.buyers.length > 0) {
            setExistingBuyers(property.buyers.map((buyer: any) => ({
              id: buyer.id,
              firstName: buyer.firstName,
              lastName: buyer.lastName,
              email: buyer.email,
              phone: buyer.phone,
              emergencyContact: buyer.emergencyContact,
              offerAmount: buyer.offerAmount,
              financingType: buyer.financingType,
              preApprovalAmount: buyer.preApprovalAmount,
              closingDate: buyer.closingDate,
              currentAddress: buyer.currentAddress,
              employmentStatus: buyer.employmentStatus,
              employer: buyer.employer,
              annualIncome: buyer.annualIncome,
              agentName: buyer.agentName,
              agentPhone: buyer.agentPhone,
              notes: buyer.notes
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching property data:', error);
      }
    };

    fetchPropertyData();
  }, [propertyId]);

  const validateBuyer = (buyer: BuyerData): boolean => {
    return buyer.firstName.trim() !== '' && 
           buyer.lastName.trim() !== '' && 
           buyer.email.trim() !== '' && 
           buyer.phone.trim() !== '';
  };

  const addBuyer = () => {
    const newBuyer: BuyerData = {
      id: Date.now().toString(),
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      emergencyContact: '',
      offerAmount: '',
      financingType: '',
      preApprovalAmount: '',
      closingDate: '',
      currentAddress: '',
      employmentStatus: '',
      employer: '',
      annualIncome: '',
      agentName: '',
      agentPhone: '',
      notes: ''
    };
    setBuyers([...buyers, newBuyer]);
  };

  const removeBuyer = (buyerId: string) => {
    if (buyers.length > 1) {
      setBuyers(buyers.filter(buyer => buyer.id !== buyerId));
    }
  };

  const handleInputChange = (buyerId: string, field: keyof BuyerData, value: string) => {
    setBuyers(buyers.map(buyer => 
      buyer.id === buyerId 
        ? { ...buyer, [field]: value }
        : buyer
    ));
  };

  const handleSubmit = async () => {
    // Validate all buyers
    const invalidBuyers = buyers.filter(buyer => !validateBuyer(buyer));
    
    if (invalidBuyers.length > 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Name, Email, Phone) for all buyers",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, get the current property data
      const propertyResponse = await fetch(`${API_BASE_URL}/properties/${propertyId}`);
      const propertyData = await propertyResponse.json();
      
      if (!propertyData.success) {
        throw new Error("Failed to get property data");
      }

      const property = propertyData.property;
      
      // Prepare buyer data for property update
      const newBuyerInfos = buyers.map(({ id, ...buyer }) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Generate unique ID
        ...buyer,
        isActive: true
        // Let backend handle createdAt and updatedAt timestamps
      }));

      // Get existing buyers or initialize empty array
      const existingBuyers = property.buyers || [];
      const updatedBuyers = [...existingBuyers, ...newBuyerInfos];

      // Update property with new buyers using property update API
      const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...property, // Include all existing property data
          buyers: updatedBuyers // Add the new buyers
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: `${buyers.length} buyer(s) added successfully`
        });

        // Navigate back to manage property page
        setTimeout(() => {
          navigate("/manage-property");
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to add buyers",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error adding buyers:', error);
      toast({
        title: "Error",
        description: "An error occurred while adding buyers",
        variant: "destructive"
      });
    }
  };

  return (
    <main className="container mx-auto py-8 px-4 pb-20">
      <Helmet>
        <title>Add Buyer Info — Property Management</title>
        <meta name="description" content="Add buyer information for property sale" />
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
              <UserPlus className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {existingBuyers.length > 0 ? 'Buyer Management' : 'Add Buyers'}
              </h1>
              <p className="text-lg text-muted-foreground">
                {propertyTitle ? `${propertyTitle} - ` : ''}Property ID: {propertyId}
              </p>
            </div>
          </div>
        </div>

        {/* Existing Buyers Section */}
        {existingBuyers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5" />
              <h2 className="text-2xl font-bold">Interested Buyers ({existingBuyers.length})</h2>
            </div>
            <div className="grid gap-4">
              {existingBuyers.map((buyer, index) => (
                <Card key={buyer.id} className="border-2 border-green-200 bg-green-50/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {buyer.firstName} {buyer.lastName}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Interested Buyer
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Email</label>
                        <p>{buyer.email}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Phone</label>
                        <p>{buyer.phone}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Offer Amount</label>
                        <p className="font-semibold">₹{Number(buyer.offerAmount).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Financing Type</label>
                        <p className="capitalize">{buyer.financingType}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Pre-approval</label>
                        <p>₹{Number(buyer.preApprovalAmount).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Expected Closing</label>
                        <p>{buyer.closingDate ? new Date(buyer.closingDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    {buyer.agentName && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Real Estate Agent</label>
                        <p className="text-sm">{buyer.agentName} {buyer.agentPhone && `- ${buyer.agentPhone}`}</p>
                      </div>
                    )}
                    {buyer.currentAddress && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Current Address</label>
                        <p className="text-sm">{buyer.currentAddress}</p>
                      </div>
                    )}
                    {buyer.notes && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Notes</label>
                        <p className="text-sm">{buyer.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {existingBuyers.length > 0 ? 'Add New Buyers' : 'Buyer Information'}
              </h2>
              <p className="text-muted-foreground">
                {existingBuyers.length > 0 
                  ? 'Add additional buyers interested in this property'
                  : 'Enter buyer details for this property'
                }
              </p>
            </div>
            <Button onClick={addBuyer} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              {existingBuyers.length > 0 ? 'Add Another Buyer' : 'Add New Buyer'}
            </Button>
          </div>

          {/* Buyer Forms */}
          {buyers.map((buyer, index) => (
            <Card key={buyer.id} className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Buyer {index + 1}
                  </CardTitle>
                  <CardDescription>
                    Enter buyer details below
                  </CardDescription>
                </div>
                {buyers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBuyer(buyer.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`firstName-${buyer.id}`}>First Name *</Label>
                      <Input
                        id={`firstName-${buyer.id}`}
                        value={buyer.firstName}
                        onChange={(e) => handleInputChange(buyer.id, 'firstName', e.target.value)}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`lastName-${buyer.id}`}>Last Name *</Label>
                      <Input
                        id={`lastName-${buyer.id}`}
                        value={buyer.lastName}
                        onChange={(e) => handleInputChange(buyer.id, 'lastName', e.target.value)}
                        placeholder="Enter last name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`email-${buyer.id}`}>Email *</Label>
                      <Input
                        id={`email-${buyer.id}`}
                        type="email"
                        value={buyer.email}
                        onChange={(e) => handleInputChange(buyer.id, 'email', e.target.value)}
                        placeholder="buyer@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`phone-${buyer.id}`}>Phone *</Label>
                      <Input
                        id={`phone-${buyer.id}`}
                        value={buyer.phone}
                        onChange={(e) => handleInputChange(buyer.id, 'phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`emergencyContact-${buyer.id}`}>Emergency Contact</Label>
                      <Input
                        id={`emergencyContact-${buyer.id}`}
                        value={buyer.emergencyContact}
                        onChange={(e) => handleInputChange(buyer.id, 'emergencyContact', e.target.value)}
                        placeholder="Emergency contact name and phone"
                      />
                    </div>
                  </div>
                </div>

                {/* Purchase Information */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Purchase Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`offerAmount-${buyer.id}`}>Offer Amount</Label>
                      <Input
                        id={`offerAmount-${buyer.id}`}
                        value={buyer.offerAmount}
                        onChange={(e) => handleInputChange(buyer.id, 'offerAmount', e.target.value)}
                        placeholder="500000"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`financingType-${buyer.id}`}>Financing Type</Label>
                      <Select 
                        value={buyer.financingType} 
                        onValueChange={(value) => handleInputChange(buyer.id, 'financingType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select financing type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="conventional">Conventional Loan</SelectItem>
                          <SelectItem value="fha">FHA Loan</SelectItem>
                          <SelectItem value="va">VA Loan</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`preApprovalAmount-${buyer.id}`}>Pre-approval Amount</Label>
                      <Input
                        id={`preApprovalAmount-${buyer.id}`}
                        value={buyer.preApprovalAmount}
                        onChange={(e) => handleInputChange(buyer.id, 'preApprovalAmount', e.target.value)}
                        placeholder="600000"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`closingDate-${buyer.id}`}>Expected Closing Date</Label>
                      <Input
                        id={`closingDate-${buyer.id}`}
                        type="date"
                        value={buyer.closingDate}
                        onChange={(e) => handleInputChange(buyer.id, 'closingDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Background Information */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Background Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`currentAddress-${buyer.id}`}>Current Address</Label>
                      <Textarea
                        id={`currentAddress-${buyer.id}`}
                        value={buyer.currentAddress}
                        onChange={(e) => handleInputChange(buyer.id, 'currentAddress', e.target.value)}
                        placeholder="Enter current address"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`employmentStatus-${buyer.id}`}>Employment Status</Label>
                        <Select 
                          value={buyer.employmentStatus} 
                          onValueChange={(value) => handleInputChange(buyer.id, 'employmentStatus', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employed">Employed</SelectItem>
                            <SelectItem value="self-employed">Self-Employed</SelectItem>
                            <SelectItem value="unemployed">Unemployed</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`employer-${buyer.id}`}>Employer/Company</Label>
                        <Input
                          id={`employer-${buyer.id}`}
                          value={buyer.employer}
                          onChange={(e) => handleInputChange(buyer.id, 'employer', e.target.value)}
                          placeholder="Company name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`annualIncome-${buyer.id}`}>Annual Income</Label>
                      <Input
                        id={`annualIncome-${buyer.id}`}
                        value={buyer.annualIncome}
                        onChange={(e) => handleInputChange(buyer.id, 'annualIncome', e.target.value)}
                        placeholder="80000"
                      />
                    </div>

                    {/* Agent Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`agentName-${buyer.id}`}>Real Estate Agent (Optional)</Label>
                        <Input
                          id={`agentName-${buyer.id}`}
                          value={buyer.agentName}
                          onChange={(e) => handleInputChange(buyer.id, 'agentName', e.target.value)}
                          placeholder="Agent name"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`agentPhone-${buyer.id}`}>Agent Phone</Label>
                        <Input
                          id={`agentPhone-${buyer.id}`}
                          value={buyer.agentPhone}
                          onChange={(e) => handleInputChange(buyer.id, 'agentPhone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`notes-${buyer.id}`}>Additional Notes</Label>
                      <Textarea
                        id={`notes-${buyer.id}`}
                        value={buyer.notes}
                        onChange={(e) => handleInputChange(buyer.id, 'notes', e.target.value)}
                        placeholder="Any additional notes about the buyer"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <Button onClick={handleSubmit} size="lg" className="px-8">
              <UserPlus className="h-4 w-4 mr-2" />
              Add {buyers.length} Buyer{buyers.length > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AddBuyer;
