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

interface TenantData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: string;
  securityDeposit: string;
  previousAddress: string;
  employmentStatus: string;
  employer: string;
  monthlyIncome: string;
  notes: string;
}

const AddTenant = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [existingTenants, setExistingTenants] = useState<TenantData[]>([]);
  const [propertyTitle, setPropertyTitle] = useState<string>('');

  const [tenants, setTenants] = useState<TenantData[]>([
    {
      id: '1',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      emergencyContact: '',
      leaseStartDate: '',
      leaseEndDate: '',
      monthlyRent: '',
      securityDeposit: '',
      previousAddress: '',
      employmentStatus: '',
      employer: '',
      monthlyIncome: '',
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
          
          // Set existing tenants if any
          if (property.tenants && property.tenants.length > 0) {
            setExistingTenants(property.tenants.map((tenant: any) => ({
              id: tenant.id,
              firstName: tenant.firstName,
              lastName: tenant.lastName,
              email: tenant.email,
              phone: tenant.phone,
              emergencyContact: tenant.emergencyContact,
              leaseStartDate: tenant.leaseStartDate,
              leaseEndDate: tenant.leaseEndDate,
              monthlyRent: tenant.monthlyRent,
              securityDeposit: tenant.securityDeposit,
              previousAddress: tenant.previousAddress,
              employmentStatus: tenant.employmentStatus,
              employer: tenant.employer,
              monthlyIncome: tenant.monthlyIncome,
              notes: tenant.notes
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching property data:', error);
      }
    };

    fetchPropertyData();
  }, [propertyId]);



  const handleInputChange = (tenantId: string, field: keyof TenantData, value: string) => {
    setTenants(prev => 
      prev.map(tenant => 
        tenant.id === tenantId ? { ...tenant, [field]: value } : tenant
      )
    );
  };

  const addTenant = () => {
    const newTenant: TenantData = {
      id: Date.now().toString(),
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      emergencyContact: '',
      leaseStartDate: '',
      leaseEndDate: '',
      monthlyRent: '',
      securityDeposit: '',
      previousAddress: '',
      employmentStatus: '',
      employer: '',
      monthlyIncome: '',
      notes: ''
    };
    setTenants(prev => [...prev, newTenant]);
  };

  const removeTenant = (tenantId: string) => {
    if (tenants.length === 1) {
      toast({
        title: "Error",
        description: "You must have at least one tenant",
        variant: "destructive"
      });
      return;
    }
    setTenants(prev => prev.filter(tenant => tenant.id !== tenantId));
  };

  const validateTenant = (tenant: TenantData) => {
    return tenant.firstName && tenant.lastName && tenant.email && tenant.phone;
  };



  const handleSubmit = async () => {
    // Validate all tenants
    const invalidTenants = tenants.filter(tenant => !validateTenant(tenant));
    
    if (invalidTenants.length > 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Name, Email, Phone) for all tenants",
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
      
      // Prepare tenant data for property update
      const newTenantInfos = tenants.map(({ id, ...tenant }) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Generate unique ID
        ...tenant,
        isActive: true
        // Let backend handle createdAt and updatedAt timestamps
      }));

      // Get existing tenants or initialize empty array
      const existingTenants = property.tenants || [];
      const updatedTenants = [...existingTenants, ...newTenantInfos];

      // Update property with new tenants using property update API
      const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...property, // Include all existing property data
          tenants: updatedTenants // Add the new tenants
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: `${tenants.length} tenant(s) added successfully`
        });

        // Navigate back to manage property page
        setTimeout(() => {
          navigate("/manage-property");
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to add tenants",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error adding tenants:', error);
      toast({
        title: "Error",
        description: "Failed to add tenants. Please try again.",
        variant: "destructive"
      });
    }
  };



  return (
    <main className="container mx-auto py-8 px-4 pb-20">
      <Helmet>
        <title>Add Tenant — Property Management</title>
        <meta name="description" content="Add tenant information for rental property" />
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
                {existingTenants.length > 0 ? 'Tenant Management' : 'Add Tenants'}
              </h1>
              <p className="text-lg text-muted-foreground">
                {propertyTitle ? `${propertyTitle} - ` : ''}Property ID: {propertyId}
              </p>
            </div>
          </div>
        </div>

        {/* Existing Tenants Section */}
        {existingTenants.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5" />
              <h2 className="text-2xl font-bold">Current Tenants ({existingTenants.length})</h2>
            </div>
            <div className="grid gap-4">
              {existingTenants.map((tenant, index) => (
                <Card key={tenant.id} className="border-2 border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {tenant.firstName} {tenant.lastName}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Active Tenant
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Email</label>
                        <p>{tenant.email}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Phone</label>
                        <p>{tenant.phone}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Monthly Rent</label>
                        <p className="font-semibold">₹{Number(tenant.monthlyRent).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Lease Start</label>
                        <p>{tenant.leaseStartDate ? new Date(tenant.leaseStartDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Lease End</label>
                        <p>{tenant.leaseEndDate ? new Date(tenant.leaseEndDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Employment</label>
                        <p className="capitalize">{tenant.employmentStatus}</p>
                      </div>
                    </div>
                    {tenant.employer && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Employer</label>
                        <p className="text-sm">{tenant.employer}</p>
                      </div>
                    )}
                    {tenant.emergencyContact && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Emergency Contact</label>
                        <p className="text-sm">{tenant.emergencyContact}</p>
                      </div>
                    )}
                    {tenant.notes && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Notes</label>
                        <p className="text-sm">{tenant.notes}</p>
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
                {existingTenants.length > 0 ? 'Add New Tenants' : 'Tenant Information'}
              </h2>
              <p className="text-muted-foreground">
                {existingTenants.length > 0 
                  ? 'Add additional tenants to this property'
                  : 'Enter tenant details for this property'
                }
              </p>
            </div>
            <Button onClick={addTenant} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              {existingTenants.length > 0 ? 'Add Another Tenant' : 'Add New Tenant'}
            </Button>
          </div>

          {/* Tenant Forms */}
          {tenants.map((tenant, index) => (
            <Card key={tenant.id} className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Tenant {index + 1}
                  </CardTitle>
                  <CardDescription>
                    Enter tenant details below
                  </CardDescription>
                </div>
                {tenants.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTenant(tenant.id)}
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
                      <Label htmlFor={`firstName-${tenant.id}`}>First Name *</Label>
                      <Input
                        id={`firstName-${tenant.id}`}
                        value={tenant.firstName}
                        onChange={(e) => handleInputChange(tenant.id, 'firstName', e.target.value)}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`lastName-${tenant.id}`}>Last Name *</Label>
                      <Input
                        id={`lastName-${tenant.id}`}
                        value={tenant.lastName}
                        onChange={(e) => handleInputChange(tenant.id, 'lastName', e.target.value)}
                        placeholder="Enter last name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`email-${tenant.id}`}>Email *</Label>
                      <Input
                        id={`email-${tenant.id}`}
                        type="email"
                        value={tenant.email}
                        onChange={(e) => handleInputChange(tenant.id, 'email', e.target.value)}
                        placeholder="tenant@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`phone-${tenant.id}`}>Phone *</Label>
                      <Input
                        id={`phone-${tenant.id}`}
                        value={tenant.phone}
                        onChange={(e) => handleInputChange(tenant.id, 'phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`emergencyContact-${tenant.id}`}>Emergency Contact</Label>
                      <Input
                        id={`emergencyContact-${tenant.id}`}
                        value={tenant.emergencyContact}
                        onChange={(e) => handleInputChange(tenant.id, 'emergencyContact', e.target.value)}
                        placeholder="Emergency contact name and phone"
                      />
                    </div>
                  </div>
                </div>

                {/* Lease Information */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Lease Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`leaseStartDate-${tenant.id}`}>Lease Start Date</Label>
                      <Input
                        id={`leaseStartDate-${tenant.id}`}
                        type="date"
                        value={tenant.leaseStartDate}
                        onChange={(e) => handleInputChange(tenant.id, 'leaseStartDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`leaseEndDate-${tenant.id}`}>Lease End Date</Label>
                      <Input
                        id={`leaseEndDate-${tenant.id}`}
                        type="date"
                        value={tenant.leaseEndDate}
                        onChange={(e) => handleInputChange(tenant.id, 'leaseEndDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`monthlyRent-${tenant.id}`}>Monthly Rent</Label>
                      <Input
                        id={`monthlyRent-${tenant.id}`}
                        value={tenant.monthlyRent}
                        onChange={(e) => handleInputChange(tenant.id, 'monthlyRent', e.target.value)}
                        placeholder="2500"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`securityDeposit-${tenant.id}`}>Security Deposit</Label>
                      <Input
                        id={`securityDeposit-${tenant.id}`}
                        value={tenant.securityDeposit}
                        onChange={(e) => handleInputChange(tenant.id, 'securityDeposit', e.target.value)}
                        placeholder="5000"
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
                      <Label htmlFor={`previousAddress-${tenant.id}`}>Previous Address</Label>
                      <Textarea
                        id={`previousAddress-${tenant.id}`}
                        value={tenant.previousAddress}
                        onChange={(e) => handleInputChange(tenant.id, 'previousAddress', e.target.value)}
                        placeholder="Enter previous address"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`employmentStatus-${tenant.id}`}>Employment Status</Label>
                        <Select 
                          value={tenant.employmentStatus} 
                          onValueChange={(value) => handleInputChange(tenant.id, 'employmentStatus', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employed">Employed</SelectItem>
                            <SelectItem value="self-employed">Self-Employed</SelectItem>
                            <SelectItem value="unemployed">Unemployed</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`employer-${tenant.id}`}>Employer/Company</Label>
                        <Input
                          id={`employer-${tenant.id}`}
                          value={tenant.employer}
                          onChange={(e) => handleInputChange(tenant.id, 'employer', e.target.value)}
                          placeholder="Company name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`monthlyIncome-${tenant.id}`}>Monthly Income</Label>
                      <Input
                        id={`monthlyIncome-${tenant.id}`}
                        value={tenant.monthlyIncome}
                        onChange={(e) => handleInputChange(tenant.id, 'monthlyIncome', e.target.value)}
                        placeholder="5000"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`notes-${tenant.id}`}>Additional Notes</Label>
                      <Textarea
                        id={`notes-${tenant.id}`}
                        value={tenant.notes}
                        onChange={(e) => handleInputChange(tenant.id, 'notes', e.target.value)}
                        placeholder="Any additional notes about the tenant"
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
              Add Tenant{tenants.length > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AddTenant;
