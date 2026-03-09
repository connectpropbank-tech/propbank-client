import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, AlertCircle, Archive, CheckCircle2, Phone, Mail, User as UserIcon, X, Upload, ImageIcon, MessageSquare, Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadBase64Image } from "@/services/uploadService";

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
  // General inquiry specific fields
  inquiryType?: string;
  propertyType?: string;
  requestVisit?: boolean;
  visitDate?: string;
  visitTime?: string;
  timestamp: string;
  isRead: boolean;
  resolvedAt?: string; // Timestamp when marked as resolved
  priority: string;
  adminRemarks?: string;
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

interface SiteSettings {
  quote: string;
  quoteAuthor?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  announcementText?: string;
  isAnnouncementActive?: boolean;
  bannerImages?: string[];
}

const AdminPortal = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("service-requests");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Site settings state
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    quote: "Manage your properties and plan visits with ease",
    heroTitle: "Your Smart Hub for Property Management",
    heroSubtitle: "Manage, list your properties and find your dream house— all in one platform",
    bannerImages: [],
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  // Store pending banner images as base64 strings (not yet uploaded)
  const [pendingBannerImages, setPendingBannerImages] = useState<string[]>([]);

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
      } else if (activeTab === "settings") {
        await fetchSiteSettings();
      }
    } catch (error) {

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
            (n.type === "want_to_sell" || n.type === "want_to_sell_cancelled" || n.type === "property_enquiry" || n.type === "service_request" || n.type === "review" || n.type === "legal_service_request" || n.type === "other_service_request" || n.type === "inspection_report" || n.type === "agreement_renewal" || n.type === "agreement_termination" || n.type === "general_inquiry") && n.isRead === false
          )
          : [];

        setNotifications(serviceRequests);
      } else {

        setNotifications([]);
      }
    } catch (error) {

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

    }
  };

  const fetchArchivedNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications`);
      if (response.ok) {
        const data = await response.json();
        // Filter for read/completed notifications
        const archived = Array.isArray(data)
          ? data.filter((n: AdminNotification) => n.isRead && (n.type === "want_to_sell" || n.type === "want_to_sell_cancelled" || n.type === "property_enquiry" || n.type === "service_request" || n.type === "review" || n.type === "legal_service_request" || n.type === "other_service_request" || n.type === "inspection_report" || n.type === "agreement_renewal" || n.type === "agreement_termination" || n.type === "general_inquiry"))
          : [];
        // Sort by timestamp, newest first
        archived.sort((a: AdminNotification, b: AdminNotification) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setNotifications(archived);
      }
    } catch (error) {

    }
  };

  // Fetch site settings from backend
  const fetchSiteSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/site-settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setSiteSettings({
            quote: data.settings.quote || "Manage your properties and plan visits with ease",
            quoteAuthor: data.settings.quoteAuthor || "",
            heroTitle: data.settings.heroTitle || "Your Smart Hub for Property Management",
            heroSubtitle: data.settings.heroSubtitle || "Manage, list your properties and find your dream house— all in one platform",
            announcementText: data.settings.announcementText || "",
            isAnnouncementActive: data.settings.isAnnouncementActive || false,
            bannerImages: data.settings.bannerImages || [],
          });
        }
      }
    } catch (error) {

    }
  };

  // Update site settings
  const handleUpdateSiteSettings = async () => {
    setSavingSettings(true);
    try {
      let finalBannerImages = [...(siteSettings.bannerImages || [])];

      // Upload all pending banner images in one batch
      if (pendingBannerImages.length > 0) {
        setUploadingBanner(true);
        const uploadedUrls: string[] = [];

        // Upload all images
        for (let i = 0; i < pendingBannerImages.length; i++) {
          const url = await uploadBase64Image(pendingBannerImages[i], 'banners', `banner-${Date.now()}-${i}`);
          uploadedUrls.push(url);
        }

        finalBannerImages = [...finalBannerImages, ...uploadedUrls];
        setUploadingBanner(false);
      }

      // Prepare settings with uploaded banner images
      const settingsToSave = {
        ...siteSettings,
        bannerImages: finalBannerImages,
      };

      const response = await fetch(`${API_BASE_URL}/admin/site-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsToSave),
      });

      if (response.ok) {
        // Update local state with final banner images
        setSiteSettings(settingsToSave);
        // Clear pending images after successful save
        setPendingBannerImages([]);

        toast({
          title: "Settings Updated",
          description: pendingBannerImages.length > 0
            ? `Site settings updated. ${pendingBannerImages.length} banner image(s) uploaded.`
            : "Site settings have been updated successfully.",
        });
      } else {
        throw new Error("Failed to update settings");
      }
    } catch (error) {

      setUploadingBanner(false);
      toast({
        title: "Error",
        description: "Failed to update site settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle banner image selection (store locally, upload on save)
  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const newBase64Images: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newBase64Images.push(base64);
      }

      // Store as pending images (will be uploaded on save)
      setPendingBannerImages(prev => [...prev, ...newBase64Images]);

      toast({
        title: "Images Added",
        description: `${newBase64Images.length} image(s) added. Click Save Settings to upload and apply.`,
      });
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to read image files. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Reset input
      e.target.value = '';
    }
  };

  // Remove a banner image (either pending or already uploaded)
  const handleRemoveBannerImage = (indexToRemove: number, isPending: boolean) => {
    if (isPending) {
      setPendingBannerImages(prev => prev.filter((_, index) => index !== indexToRemove));
    } else {
      setSiteSettings(prev => ({
        ...prev,
        bannerImages: (prev.bannerImages || []).filter((_, index) => index !== indexToRemove)
      }));
    }
    toast({
      title: "Image Removed",
      description: isPending ? "Pending image removed." : "Banner image removed. Click Save Settings to apply changes.",
    });
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
              return !n.isRead && (n.type === "want_to_sell" || n.type === "want_to_sell_cancelled" || n.type === "property_enquiry" || n.type === "service_request" || n.type === "review" || n.type === "legal_service_request" || n.type === "other_service_request" || n.type === "inspection_report" || n.type === "agreement_renewal" || n.type === "agreement_termination");
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

      toast({
        title: "Error",
        description: "Failed to mark request as complete. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveRemarks = async (notificationId: string, remarks: string) => {
    setUpdating(notificationId);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications/${notificationId}/remarks`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ remarks }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Admin remarks updated successfully",
        });

        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, adminRemarks: remarks }
              : n
          )
        );
      } else {
        throw new Error("Failed to update remarks");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update remarks. Please try again.",
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
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Site Settings</span>
            <span className="sm:hidden">Settings</span>
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
                    <Card key={notification.id} className={`border-l-4 ${notification.type === "want_to_sell_cancelled" ? "border-l-red-500" : "border-l-blue-500"}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div>
                              <h3 className="font-semibold text-lg">{notification.title}</h3>
                              {/* Only show message for notifications that don't have custom display */}
                              {notification.type !== "property_enquiry" && notification.type !== "service_request" && notification.type !== "review" && notification.type !== "legal_service_request" && notification.type !== "other_service_request" && notification.type !== "inspection_report" && notification.type !== "general_inquiry" && notification.type !== "agreement_termination" && notification.type !== "agreement_renewal" && (
                                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                              )}
                              {(notification.type === "agreement_termination" || notification.type === "agreement_renewal") && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.type === "agreement_termination"
                                    ? "An agreement has been terminated. See details below."
                                    : "An agreement renewal request has been submitted. See details below."}
                                </p>
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
                              {notification.type === "general_inquiry" && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  A general inquiry has been submitted. See details below.
                                </p>
                              )}
                            </div>

                            {/* For Property Enquiry: Show User, Owner, and Property details in separate sections */}
                            {notification.type === "property_enquiry" ? (() => {
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
                              /* For Service Request: Show property details and who raised the request */
                              <div className="mt-4 space-y-4">
                                {/* Property Details */}
                                <div>
                                  <h4 className="text-sm font-semibold mb-3">Property Details:</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <div>
                                      <span className="text-xs text-muted-foreground">Property Name:</span>
                                      <p className="text-sm font-medium">{notification.propertyTitle || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-muted-foreground">Address:</span>
                                      <p className="text-sm font-medium">{notification.propertyAddress || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-muted-foreground">Listing Type:</span>
                                      <p className="text-sm font-medium capitalize">{notification.propertyListingType || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-muted-foreground">Property ID:</span>
                                      <p className="text-sm font-medium text-gray-500">{notification.propertyId || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* User Details */}
                                <div>
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

                                {/* Service Request Details */}
                                <div>
                                  <h4 className="text-sm font-semibold mb-3">Service Request Details:</h4>
                                  <div className="space-y-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                    {notification.serviceType && (
                                      <div>
                                        <span className="text-xs text-muted-foreground">Service Type:</span>
                                        <p className="text-sm font-medium">{notification.serviceType}</p>
                                      </div>
                                    )}
                                    {notification.serviceComment && (
                                      <div>
                                        <span className="text-xs text-muted-foreground">Comment:</span>
                                        <p className="text-sm mt-1 whitespace-pre-line">{notification.serviceComment}</p>
                                      </div>
                                    )}
                                    {notification.serviceImage && (
                                      <div>
                                        <span className="text-xs text-muted-foreground">Attached Image:</span>
                                        <div className="mt-2">
                                          <img
                                            src={notification.serviceImage}
                                            alt="Service request image"
                                            className="max-w-full h-auto max-h-64 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(notification.serviceImage, '_blank')}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Admin Remarks Section */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-blue-600" />
                                    Admin Remarks (Visible to Tenant)
                                  </h4>
                                  <div className="space-y-3">
                                    <textarea
                                      className="w-full min-h-[100px] p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y"
                                      placeholder="Add your remarks or solution here..."
                                      defaultValue={notification.adminRemarks || ""}
                                      id={`remarks-${notification.id}`}
                                    />
                                    <div className="flex justify-end">
                                      <Button
                                        size="sm"
                                        disabled={updating === notification.id}
                                        onClick={() => {
                                          const el = document.getElementById(`remarks-${notification.id}`) as HTMLTextAreaElement;
                                          handleSaveRemarks(notification.id, el.value);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        {updating === notification.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                          <Save className="h-4 w-4 mr-2" />
                                        )}
                                        Save Remarks
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : notification.type === "general_inquiry" ? (
                              /* For General Inquiry: Show inquiry details and user info */
                              <div className="mt-4 space-y-4">
                                {/* Inquiry Message */}
                                {notification.message && (
                                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-sm font-medium text-yellow-800">📝 {notification.message}</p>
                                  </div>
                                )}

                                {/* Inquiry Details */}
                                <div>
                                  <h4 className="text-sm font-semibold mb-3">Inquiry Details:</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-blue-50 rounded">
                                    <div>
                                      <span className="text-xs text-muted-foreground">Looking to:</span>
                                      <p className="text-sm font-medium capitalize">{notification.inquiryType || 'Not specified'}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-muted-foreground">Property Type:</span>
                                      <p className="text-sm font-medium capitalize">{notification.propertyType || 'Not specified'}</p>
                                    </div>
                                    {notification.requestVisit && (
                                      <div>
                                        <span className="text-xs text-muted-foreground">Visit Requested:</span>
                                        <p className="text-sm font-medium">{notification.visitDate} at {notification.visitTime}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* User Details */}
                                <div>
                                  <h4 className="text-sm font-semibold mb-3">Contact Details:</h4>
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
                              </div>
                            ) : (notification.type === "agreement_termination" || notification.type === "agreement_renewal") ? (
                              /* For Agreement Termination/Renewal: Show structured owner, tenant, and property details */
                              <div className="mt-4 space-y-4">
                                {/* Status Banner */}
                                <div className={`p-3 rounded-lg border ${notification.type === "agreement_termination" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                                  <p className={`text-sm font-semibold ${notification.type === "agreement_termination" ? "text-red-700" : "text-green-700"}`}>
                                    {notification.type === "agreement_termination"
                                      ? "🔴 Agreement Terminated - Property is now available for rent"
                                      : "🟢 Agreement Renewal Request Submitted"}
                                  </p>
                                </div>

                                {/* Property Details */}
                                <div>
                                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <span>📋</span> Property Details
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <div>
                                      <span className="text-xs text-muted-foreground">Property Name:</span>
                                      <p className="text-sm font-medium">{notification.propertyTitle || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-muted-foreground">Property ID:</span>
                                      <p className="text-sm font-medium text-gray-500">{notification.propertyId || 'N/A'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                      <span className="text-xs text-muted-foreground">Address:</span>
                                      <p className="text-sm font-medium">{notification.propertyAddress || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-muted-foreground">Listing Type:</span>
                                      <p className="text-sm font-medium capitalize">{notification.propertyListingType || 'Rent'}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Owner Details */}
                                <div>
                                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <span>👤</span> Owner Details
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                                    <div className="flex items-center gap-2">
                                      <UserIcon className="h-4 w-4 text-purple-600" />
                                      <span className="text-sm font-medium">{notification.ownerName || 'N/A'}</span>
                                    </div>
                                    {notification.ownerEmail && (
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-purple-600" />
                                        <a href={`mailto:${notification.ownerEmail}`} className="text-sm text-blue-600 hover:underline">
                                          {notification.ownerEmail}
                                        </a>
                                      </div>
                                    )}
                                    {notification.ownerPhone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-purple-600" />
                                        <a href={`tel:${notification.ownerPhone}`} className="text-sm text-blue-600 hover:underline">
                                          {notification.ownerPhone}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Tenant Details (for termination) */}
                                {notification.type === "agreement_termination" && (notification.userName || notification.userEmail || notification.userPhone) && (
                                  <div>
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                      <span>🏠</span> Tenant Details (Removed)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                      {notification.userName && (
                                        <div className="flex items-center gap-2">
                                          <UserIcon className="h-4 w-4 text-orange-600" />
                                          <span className="text-sm font-medium">{notification.userName}</span>
                                        </div>
                                      )}
                                      {notification.userEmail && (
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-4 w-4 text-orange-600" />
                                          <a href={`mailto:${notification.userEmail}`} className="text-sm text-blue-600 hover:underline">
                                            {notification.userEmail}
                                          </a>
                                        </div>
                                      )}
                                      {notification.userPhone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-orange-600" />
                                          <a href={`tel:${notification.userPhone}`} className="text-sm text-blue-600 hover:underline">
                                            {notification.userPhone}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
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

        {/* Site Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
              <CardDescription>
                Manage dynamic content displayed on the homepage - Quote, Hero Text, and Announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quote Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Homepage Quote
                      <span className="text-muted-foreground ml-2 font-normal">
                        (Shown above Manage Property and Visit Planner cards)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={siteSettings.quote}
                      onChange={(e) => setSiteSettings({ ...siteSettings, quote: e.target.value })}
                      placeholder="Enter quote text..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Current: "{siteSettings.quote}"
                    </p>
                  </div>

                  {/* Hero Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Hero Title
                      <span className="text-muted-foreground ml-2 font-normal">
                        (Main heading on homepage)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={siteSettings.heroTitle || ""}
                      onChange={(e) => setSiteSettings({ ...siteSettings, heroTitle: e.target.value })}
                      placeholder="Enter hero title..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Hero Subtitle */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Hero Subtitle
                      <span className="text-muted-foreground ml-2 font-normal">
                        (Sub-heading below the main title)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={siteSettings.heroSubtitle || ""}
                      onChange={(e) => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })}
                      placeholder="Enter hero subtitle..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Announcement Text */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Announcement Text
                      <span className="text-muted-foreground ml-2 font-normal">
                        (Optional banner announcement)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={siteSettings.announcementText || ""}
                      onChange={(e) => setSiteSettings({ ...siteSettings, announcementText: e.target.value })}
                      placeholder="Enter announcement text (leave empty to hide)..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Announcement Active Toggle */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="announcement-active"
                      checked={siteSettings.isAnnouncementActive || false}
                      onCheckedChange={(checked) =>
                        setSiteSettings({ ...siteSettings, isAnnouncementActive: checked === true })
                      }
                    />
                    <label htmlFor="announcement-active" className="text-sm font-medium">
                      Show Announcement Banner
                    </label>
                  </div>

                  {/* Banner Images Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Banner Images
                        <span className="text-muted-foreground ml-2 font-normal">
                          (Carousel images for homepage hero section - rotates every 30 seconds)
                        </span>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Upload multiple images to display as a rotating carousel. If no banner images are uploaded, the default hero image will be shown.
                      </p>
                    </div>

                    {/* Upload Button */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleBannerImageUpload}
                          className="hidden"
                          disabled={savingSettings}
                        />
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                          <Upload className="w-4 h-4" />
                          <span>Add Banner Images</span>
                        </div>
                      </label>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        {siteSettings.bannerImages && siteSettings.bannerImages.length > 0 && (
                          <span>{siteSettings.bannerImages.length} saved</span>
                        )}
                        {pendingBannerImages.length > 0 && (
                          <span className="text-orange-600">+ {pendingBannerImages.length} pending upload</span>
                        )}
                      </div>
                    </div>

                    {/* Uploaded Banner Images */}
                    {siteSettings.bannerImages && siteSettings.bannerImages.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-green-700">Saved Images:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {siteSettings.bannerImages.map((imageUrl, index) => (
                            <div key={`saved-${index}`} className="relative group">
                              <img
                                src={imageUrl}
                                alt={`Banner ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-green-200"
                              />
                              <button
                                onClick={() => handleRemoveBannerImage(index, false)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Remove image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <span className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">
                                {index + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending Banner Images (not yet uploaded) */}
                    {pendingBannerImages.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-orange-600">Pending Upload (will be uploaded on save):</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {pendingBannerImages.map((base64Image, index) => (
                            <div key={`pending-${index}`} className="relative group">
                              <img
                                src={base64Image}
                                alt={`Pending ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-orange-300 border-dashed"
                              />
                              <button
                                onClick={() => handleRemoveBannerImage(index, true)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Remove image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <span className="absolute bottom-1 left-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded">
                                New
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {(!siteSettings.bannerImages || siteSettings.bannerImages.length === 0) && pendingBannerImages.length === 0 && (
                      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">No banner images uploaded</p>
                        <p className="text-xs text-gray-400">Default hero image will be displayed</p>
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleUpdateSiteSettings}
                      disabled={savingSettings || uploadingBanner}
                      className="w-full sm:w-auto"
                    >
                      {savingSettings ? (
                        uploadingBanner ? "Uploading images..." : "Saving..."
                      ) : (
                        pendingBannerImages.length > 0
                          ? `Save Settings & Upload ${pendingBannerImages.length} Image(s)`
                          : "Save Settings"
                      )}
                    </Button>
                  </div>

                  {/* Preview Section */}
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Preview</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p className="font-bold text-lg">{siteSettings.heroTitle}</p>
                      <p className="text-muted-foreground">{siteSettings.heroSubtitle}</p>
                      <div className="pt-2 border-t mt-2">
                        <p className="text-muted-foreground italic">"{siteSettings.quote}"</p>
                      </div>
                    </div>
                  </div>
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

