import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, AlertCircle, Archive, CheckCircle2, Phone, Mail, User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8002";

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  propertyId: string;
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  // User details for property enquiry notifications
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  // Property details for property enquiry notifications
  propertyTitle?: string;
  propertyAddress?: string;
  propertyListingType?: string;
  // Service request specific fields
  serviceType?: string;
  serviceComment?: string;
  serviceImage?: string;
  timestamp: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

interface Property {
  id: string;
  title: string;
  propertyType: string;
  listingType: string;
  address: string;
  ownerName: string;
  ownerEmail: string;
  status: string;
  createdAt: string;
}

interface Agent {
  uid: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
}

const AdminPortal = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("service-requests");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "service-requests") {
        await fetchNotifications();
      } else if (activeTab === "properties") {
        await fetchAllProperties();
      } else if (activeTab === "agents") {
        await fetchAgents();
      } else if (activeTab === "archive") {
        await fetchArchivedNotifications();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications?unread=true`);
      if (response.ok) {
        const data = await response.json();
        // Filter for all notification types that are unread (isRead: false)
        // Double-check isRead is false as a safety measure
        const serviceRequests = Array.isArray(data) 
          ? data.filter((n: AdminNotification) => 
              (n.type === "want_to_sell" || n.type === "property_enquiry" || n.type === "service_request" || n.type === "review" || n.type === "legal_service_request" || n.type === "other_service_request" || n.type === "inspection_report" || n.type === "agreement_renewal" || n.type === "agreement_termination") && n.isRead === false
            )
          : [];
        console.log(`Found ${serviceRequests.length} unread service requests`);
        // Debug: Log service_request notifications to check user details
        const serviceRequestNotifications = serviceRequests.filter((n: AdminNotification) => n.type === "service_request");
        serviceRequestNotifications.forEach((n: AdminNotification) => {
          console.log("🔧 Service Request Notification - Full Data:", {
            id: n.id,
            type: n.type,
            userId: n.userId,
            userName: n.userName,
            userEmail: n.userEmail,
            userPhone: n.userPhone,
            serviceType: n.serviceType,
            serviceComment: n.serviceComment,
            fullNotification: n
          });
        });
        // Debug: Log property_enquiry notifications to check user details
        const enquiryNotifications = serviceRequests.filter((n: AdminNotification) => n.type === "property_enquiry");
        enquiryNotifications.forEach((n: AdminNotification) => {
          console.log("🔍 Property Enquiry Notification - Full Data:", {
            id: n.id,
            type: n.type,
            userId: n.userId,
            userName: n.userName,
            userEmail: n.userEmail,
            userPhone: n.userPhone,
            propertyId: n.propertyId,
            propertyTitle: n.propertyTitle,
            propertyAddress: n.propertyAddress,
            propertyListingType: n.propertyListingType,
            ownerName: n.ownerName,
            ownerEmail: n.ownerEmail,
            ownerPhone: n.ownerPhone,
            fullNotification: n
          });
        });
        setNotifications(serviceRequests);
      } else {
        console.error("Failed to fetch notifications:", response.status, response.statusText);
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    }
  };

  const fetchAllProperties = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties`);
      if (response.ok) {
        const data = await response.json();
        // Handle both response formats
        const props = data.properties || data.data || [];
        setProperties(props);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (response.ok) {
        const data = await response.json();
        // Filter for agents
        const agentUsers = data.data?.filter((u: Agent) => u.role === "agent") || [];
        setAgents(agentUsers);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  const fetchArchivedNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications`);
      if (response.ok) {
        const data = await response.json();
        // Filter for read/completed notifications
        const archived = Array.isArray(data) 
          ? data.filter((n: AdminNotification) => n.isRead && (n.type === "want_to_sell" || n.type === "property_enquiry" || n.type === "service_request" || n.type === "review" || n.type === "legal_service_request" || n.type === "other_service_request" || n.type === "inspection_report" || n.type === "agreement_renewal" || n.type === "agreement_termination"))
          : [];
        // Sort by timestamp, newest first
        archived.sort((a: AdminNotification, b: AdminNotification) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setNotifications(archived);
      }
    } catch (error) {
      console.error("Error fetching archived notifications:", error);
    }
  };

  const handleMarkComplete = async (notificationId: string, checked: boolean) => {
    setUpdating(notificationId);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications/${notificationId}/read`, {
        method: "PUT"
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: checked 
            ? "Request marked as complete and moved to archive" 
            : "Request marked as incomplete"
        });
        
        // Update local state immediately for better UX
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, isRead: checked }
              : n
          ).filter(n => {
            // In Active Service Requests tab, only show unread service requests
            // In Archive tab, show all
            if (activeTab === "service-requests") {
              return !n.isRead && (n.type === "want_to_sell" || n.type === "property_enquiry" || n.type === "service_request" || n.type === "review" || n.type === "legal_service_request" || n.type === "other_service_request" || n.type === "inspection_report" || n.type === "agreement_renewal" || n.type === "agreement_termination");
            }
            return true;
          })
        );
        
        // If we're in archive tab, also refresh to show the newly completed item
        if (activeTab === "archive") {
          await fetchArchivedNotifications();
        }
      } else {
        throw new Error("Failed to mark as complete");
      }
    } catch (error) {
      console.error("Error marking notification as complete:", error);
      toast({
        title: "Error",
        description: "Failed to mark request as complete. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Portal</h1>
        <p className="text-muted-foreground">Manage properties, agents, service requests, and more</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="service-requests" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Active Service Requests</span>
            <span className="sm:hidden">Requests</span>
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">All Properties</span>
            <span className="sm:hidden">Properties</span>
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Agents</span>
          </TabsTrigger>
          <TabsTrigger value="archive" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            <span>Archive</span>
          </TabsTrigger>
        </TabsList>

        {/* Active Service Requests Tab */}
        <TabsContent value="service-requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Service Requests</CardTitle>
              <CardDescription>
                Property sale requests and property enquiries - Owner/User details with Name, Email, Phone Number
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active service requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <Card key={notification.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div>
                              <h3 className="font-semibold text-lg">{notification.title}</h3>
                              {/* Only show message for notifications that don't have custom display */}
                              {notification.type !== "property_enquiry" && notification.type !== "service_request" && notification.type !== "review" && notification.type !== "legal_service_request" && notification.type !== "other_service_request" && notification.type !== "inspection_report" && (
                                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                              )}
                              {notification.type === "property_enquiry" && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  A user is interested in this property. See details below.
                                </p>
                              )}
                              {notification.type === "service_request" && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  A user has raised a service request. See details below.
                                </p>
                              )}
                              {notification.type === "review" && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  A review has been submitted for this property. See details below.
                                </p>
                              )}
                              {notification.type === "legal_service_request" && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  A legal service request has been submitted. See details below.
                                </p>
                              )}
                              {notification.type === "other_service_request" && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  An other service request has been submitted. See details below.
                                </p>
                              )}
                              {notification.type === "inspection_report" && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  An inspection report has been submitted. See details below.
                                </p>
                              )}
                            </div>
                            
                            {/* For Property Enquiry: Show User, Owner, and Property details in separate sections */}
                            {notification.type === "property_enquiry" ? (() => {
                              // Debug: Log the notification data to see what fields are present
                              console.log("🔍 Rendering Property Enquiry - Notification Data:", {
                                id: notification.id,
                                userId: notification.userId,
                                userName: notification.userName,
                                userEmail: notification.userEmail,
                                userPhone: notification.userPhone,
                                propertyId: notification.propertyId,
                                propertyTitle: notification.propertyTitle,
                                propertyAddress: notification.propertyAddress,
                                propertyListingType: notification.propertyListingType,
                                ownerName: notification.ownerName,
                                ownerEmail: notification.ownerEmail,
                                ownerPhone: notification.ownerPhone
                              });
                              
                              // Parse user details from message for backwards compatibility with old notifications
                              let parsedUserName = notification.userName;
                              let parsedUserEmail = notification.userEmail;
                              let parsedUserPhone = notification.userPhone;
                              
                              // If structured fields are missing or empty, try to parse from message for backwards compatibility
                              const message = notification.message || '';
                              
                              // Parse user name
                              if (!parsedUserName || parsedUserName.trim() === '') {
                                // Try format 1: "User {name} is interested"
                                let nameMatch = message.match(/User\s+([^\s]+(?:\s+[^\s]+)*?)\s+is interested/i);
                                if (nameMatch) {
                                  parsedUserName = nameMatch[1]?.trim();
                                }
                                
                                // Try format 2: "- Name: {name}"
                                if (!parsedUserName || parsedUserName.trim() === '') {
                                  nameMatch = message.match(/Name:\s*([^\n\-]+)/i);
                                  if (nameMatch) parsedUserName = nameMatch[1]?.trim();
                                }
                              }
                              
                              // Parse user email
                              if (!parsedUserEmail || parsedUserEmail.trim() === '') {
                                // Extract email from message - handle both formats: "Email: {email}" or "- Email: {email}"
                                const emailMatch = message.match(/Email:\s*([^\n\-]+)/i);
                                if (emailMatch) parsedUserEmail = emailMatch[1]?.trim();
                              }
                              
                              // Parse user phone
                              if (!parsedUserPhone || parsedUserPhone.trim() === '') {
                                // Extract phone from message - handle both formats: "Phone: {phone}" or "- Phone: {phone}"
                                const phoneMatch = message.match(/Phone:\s*([^\n\-]+)/i);
                                if (phoneMatch) parsedUserPhone = phoneMatch[1]?.trim();
                              }
                              
                              return (
                              <div className="space-y-4 mt-4">
                                {/* User Details Section (Person who enquired) */}
                                <div className="border rounded-lg p-4 bg-blue-50/50">
                                  <h4 className="font-semibold text-sm mb-3 text-blue-900">User Details (Person Who Enquired)</h4>
                                  {(parsedUserName || parsedUserEmail || parsedUserPhone) ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {parsedUserName && (
                                        <div className="flex items-center gap-2">
                                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm font-medium">{parsedUserName}</span>
                                        </div>
                                      )}
                                      {parsedUserEmail && (
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-4 w-4 text-muted-foreground" />
                                          <a 
                                            href={`mailto:${parsedUserEmail}`}
                                            className="text-sm text-blue-600 hover:underline"
                                          >
                                            {parsedUserEmail}
                                          </a>
                                        </div>
                                      )}
                                      {parsedUserPhone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-muted-foreground" />
                                          <a 
                                            href={`tel:${parsedUserPhone}`}
                                            className="text-sm text-blue-600 hover:underline"
                                          >
                                            {parsedUserPhone}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">
                                      User details not available.
                                    </div>
                                  )}
                                </div>

                                {/* Owner Details Section */}
                                <div className="border rounded-lg p-4 bg-green-50/50">
                                  <h4 className="font-semibold text-sm mb-3 text-green-900">Owner Details</h4>
                                  {(notification.ownerName || notification.ownerEmail || notification.ownerPhone) ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {notification.ownerName && (
                                        <div className="flex items-center gap-2">
                                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm font-medium">{notification.ownerName}</span>
                                        </div>
                                      )}
                                      {notification.ownerEmail && (
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-4 w-4 text-muted-foreground" />
                                          <a 
                                            href={`mailto:${notification.ownerEmail}`}
                                            className="text-sm text-blue-600 hover:underline"
                                          >
                                            {notification.ownerEmail}
                                          </a>
                                        </div>
                                      )}
                                      {notification.ownerPhone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-muted-foreground" />
                                          <a 
                                            href={`tel:${notification.ownerPhone}`}
                                            className="text-sm text-blue-600 hover:underline"
                                          >
                                            {notification.ownerPhone}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">
                                      Owner details not available.
                                    </div>
                                  )}
                                </div>

                                {/* Property Details Section - Always show if propertyId exists */}
                                {notification.propertyId && (
                                  <div className="border rounded-lg p-4 bg-purple-50/50">
                                    <h4 className="font-semibold text-sm mb-3 text-purple-900">Property Details</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-start gap-2">
                                        <span className="text-sm font-medium text-muted-foreground">Property ID:</span>
                                        <span className="text-sm font-mono">{notification.propertyId}</span>
                                      </div>
                                      {notification.propertyTitle ? (
                                        <div className="flex items-start gap-2">
                                          <span className="text-sm font-medium text-muted-foreground">Property Name:</span>
                                          <span className="text-sm">{notification.propertyTitle}</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-start gap-2">
                                          <span className="text-sm font-medium text-muted-foreground">Property Name:</span>
                                          <span className="text-sm text-muted-foreground italic">Not available</span>
                                        </div>
                                      )}
                                      {notification.propertyAddress ? (
                                        <div className="flex items-start gap-2">
                                          <span className="text-sm font-medium text-muted-foreground">Address:</span>
                                          <span className="text-sm">{notification.propertyAddress}</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-start gap-2">
                                          <span className="text-sm font-medium text-muted-foreground">Address:</span>
                                          <span className="text-sm text-muted-foreground italic">Not available</span>
                                        </div>
                                      )}
                                      {notification.propertyListingType ? (
                                        <div className="flex items-start gap-2">
                                          <span className="text-sm font-medium text-muted-foreground">Listing Type:</span>
                                          <span className="text-sm capitalize">{notification.propertyListingType}</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-start gap-2">
                                          <span className="text-sm font-medium text-muted-foreground">Listing Type:</span>
                                          <span className="text-sm text-muted-foreground italic">Not available</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              );
                            })() : notification.type === "review" ? (
                              /* For Review: Show reviewer and property details */
                              <div className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {notification.userName && (
                                    <div className="flex items-center gap-2">
                                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">Reviewer: {notification.userName}</span>
                                    </div>
                                  )}
                                  {notification.userEmail && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <a 
                                        href={`mailto:${notification.userEmail}`}
                                        className="text-sm text-blue-600 hover:underline"
                                      >
                                        {notification.userEmail}
                                      </a>
                                    </div>
                                  )}
                                  {notification.userPhone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <a 
                                        href={`tel:${notification.userPhone}`}
                                        className="text-sm text-blue-600 hover:underline"
                                      >
                                        {notification.userPhone}
                                      </a>
                                    </div>
                                  )}
                                </div>
                                {notification.propertyTitle && (
                                  <div className="mt-4 p-3 bg-gray-50 rounded">
                                    <p className="text-sm"><strong>Property:</strong> {notification.propertyTitle}</p>
                                    {notification.propertyAddress && (
                                      <p className="text-sm text-muted-foreground">{notification.propertyAddress}</p>
                                    )}
                                  </div>
                                )}
                                <div className="mt-4 p-3 bg-blue-50 rounded">
                                  <p className="text-sm font-medium">Review Details:</p>
                                  <p className="text-sm mt-1 whitespace-pre-line">{notification.message}</p>
                                </div>
                              </div>
                            ) : notification.type === "legal_service_request" || notification.type === "other_service_request" ? (
                              /* For Legal/Other Service Request: Show user details and service info */
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold mb-3">User Details (Who Raised the Request):</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  {notification.userName ? (
                                    <div className="flex items-center gap-2">
                                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">{notification.userName}</span>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">Name: Not available</div>
                                  )}
                                  {notification.userEmail ? (
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <a 
                                        href={`mailto:${notification.userEmail}`}
                                        className="text-sm text-blue-600 hover:underline"
                                      >
                                        {notification.userEmail}
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">Email: Not available</div>
                                  )}
                                  {notification.userPhone ? (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <a 
                                        href={`tel:${notification.userPhone}`}
                                        className="text-sm text-blue-600 hover:underline"
                                      >
                                        {notification.userPhone}
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">Phone: Not available</div>
                                  )}
                                </div>
                                {notification.serviceType && (
                                  <div className="mt-4 p-3 bg-blue-50 rounded">
                                    <p className="text-sm font-medium">Service Type:</p>
                                    <p className="text-sm mt-1">{notification.serviceType}</p>
                                  </div>
                                )}
                                {notification.serviceComment && (
                                  <div className="mt-4 p-3 bg-gray-50 rounded">
                                    <p className="text-sm font-medium">Service Details:</p>
                                    <p className="text-sm mt-1 whitespace-pre-line">{notification.serviceComment}</p>
                                  </div>
                                )}
                              </div>
                            ) : notification.type === "inspection_report" ? (
                              /* For Inspection Report: Show user and property details */
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold mb-3">Inspection Report Details:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  {notification.userName && (
                                    <div className="flex items-center gap-2">
                                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">{notification.userName}</span>
                                    </div>
                                  )}
                                  {notification.userEmail && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <a 
                                        href={`mailto:${notification.userEmail}`}
                                        className="text-sm text-blue-600 hover:underline"
                                      >
                                        {notification.userEmail}
                                      </a>
                                    </div>
                                  )}
                                  {notification.userPhone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <a 
                                        href={`tel:${notification.userPhone}`}
                                        className="text-sm text-blue-600 hover:underline"
                                      >
                                        {notification.userPhone}
                                      </a>
                                    </div>
                                  )}
                                </div>
                                {notification.propertyTitle && (
                                  <div className="mt-4 p-3 bg-gray-50 rounded">
                                    <p className="text-sm"><strong>Property:</strong> {notification.propertyTitle}</p>
                                    {notification.propertyAddress && (
                                      <p className="text-sm text-muted-foreground">{notification.propertyAddress}</p>
                                    )}
                                  </div>
                                )}
                                <div className="mt-4 p-3 bg-blue-50 rounded">
                                  <p className="text-sm font-medium">Report Message:</p>
                                  <p className="text-sm mt-1 whitespace-pre-line">{notification.message}</p>
                                </div>
                              </div>
                            ) : notification.type === "service_request" ? (
                              /* For Service Request: Show only who raised the request */
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold mb-3">User Details (Who Raised the Request):</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {notification.userName ? (
                                    <div className="flex items-center gap-2">
                                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">{notification.userName}</span>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">Name: Not available</div>
                                  )}
                                  {notification.userEmail ? (
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <a 
                                        href={`mailto:${notification.userEmail}`}
                                        className="text-sm text-blue-600 hover:underline"
                                      >
                                        {notification.userEmail}
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">Email: Not available</div>
                                  )}
                                  {notification.userPhone ? (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <a 
                                        href={`tel:${notification.userPhone}`}
                                        className="text-sm text-blue-600 hover:underline"
                                      >
                                        {notification.userPhone}
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">Phone: Not available</div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* For Want to Sell: Show only Owner details */
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">{notification.ownerName}</span>
                                </div>
                                
                                {notification.ownerEmail && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a 
                                      href={`mailto:${notification.ownerEmail}`}
                                      className="text-sm text-blue-600 hover:underline"
                                    >
                                      {notification.ownerEmail}
                                    </a>
                                  </div>
                                )}
                                
                                {notification.ownerPhone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <a 
                                      href={`tel:${notification.ownerPhone}`}
                                      className="text-sm text-blue-600 hover:underline"
                                    >
                                      {notification.ownerPhone}
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-2 mt-4">
                              <Badge variant={notification.priority === "high" ? "destructive" : "secondary"}>
                                {notification.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`complete-${notification.id}`}
                                checked={notification.isRead}
                                disabled={updating === notification.id}
                                onCheckedChange={(checked) => handleMarkComplete(notification.id, checked as boolean)}
                              />
                              <label
                                htmlFor={`complete-${notification.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {notification.isRead ? "Completed" : "Mark as Complete"}
                              </label>
                            </div>
                            {notification.isRead && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Properties Tab */}
        <TabsContent value="properties" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Properties</CardTitle>
              <CardDescription>View all properties in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No properties found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {properties.map((property) => (
                    <Card key={property.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{property.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{property.address}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{property.propertyType}</Badge>
                              <Badge variant="outline">{property.listingType}</Badge>
                              <Badge variant={property.status === "active" ? "default" : "secondary"}>
                                {property.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Owner: {property.ownerName} • {property.ownerEmail}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Agents</CardTitle>
              <CardDescription>Manage agents in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No agents found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <Card key={agent.uid}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{agent.name}</h3>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-muted-foreground">{agent.email}</span>
                              {agent.phoneNumber && (
                                <span className="text-sm text-muted-foreground">{agent.phoneNumber}</span>
                              )}
                            </div>
                          </div>
                          <Badge variant={agent.isActive ? "default" : "secondary"}>
                            {agent.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archive" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Archive</CardTitle>
              <CardDescription>Completed service requests and archived items</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No archived items</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <Card key={notification.id} className="border-l-4 border-l-gray-300 opacity-75">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <h3 className="font-semibold text-lg">{notification.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{notification.ownerName}</span>
                              </div>
                              {notification.ownerEmail && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{notification.ownerEmail}</span>
                                </div>
                              )}
                              {notification.ownerPhone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{notification.ownerPhone}</span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Completed: {new Date(notification.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPortal;

