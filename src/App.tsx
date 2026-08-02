import { Toaster } from "@/ui/toaster";
import { Toaster as Sonner } from "@/ui/sonner";
import { TooltipProvider } from "@/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import SiteHeader from "@/features/navbar/SiteHeader";
import SiteFooter from "@/features/footer/SiteFooter";
import { SearchProvider } from "@/contexts/SearchContext";
import LandingPage from "./features/landing-page/LandingPage";
import NotFound from "./common components/NotFound";
import Auth from "./features/auth/Auth";
import ManageProperty from "./features/properties/ManageProperty";
import AddPropertyForm from "./features/properties/AddPropertyForm";
import SelectPropertyType from "./features/properties/SelectPropertyType";
import AddTenant from "./features/services/AddTenant";
import PropertyDetails from "./features/properties/PropertyDetails";
import RequestServices from "./features/services/RequestServices";
import InspectionReport from "./features/services/InspectionReport";
import Review from "./features/services/Review";
import LegalServices from "./features/services/LegalServices";
import OtherServices from "./features/services/OtherServices";
import AttachDocuments from "./features/services/AttachDocuments";
import RenewAgreement from "./features/services/RenewAgreement";
import TerminateAgreement from "./features/services/TerminateAgreement";
import EditProperty from "./features/properties/EditProperty";
import SearchResults from "./features/search/SearchResults";
import VisitPlanner from "./features/visit-planner/VisitPlanner";
import ArchivedProperties from "./features/properties/ArchivedProperties";
import AdminPortal from "./features/admin/AdminPortal";

import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/utils/config";

const queryClient = new QueryClient();

function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/auth" replace />;
}

function AdminRoute() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.uid}`);
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.role === "admin") {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            toast({
              title: "Access Denied",
              description: "You do not have administrative privileges.",
              variant: "destructive",
            });
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <SearchProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="flex flex-col min-h-screen">
              <SiteHeader />
              <main className="flex-1">
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/admin" element={<AdminPortal />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/manage-property" element={<ManageProperty />} />
                    <Route path="/select-property-type" element={<SelectPropertyType />} />
                    <Route path="/add-property" element={<AddPropertyForm />} />
                    <Route path="/property/:propertyId" element={<PropertyDetails />} />
                    <Route path="/edit-property/:propertyId" element={<EditProperty />} />
                    <Route path="/add-tenant/:propertyId" element={<AddTenant />} />
                    <Route path="/request-services/:propertyId" element={<RequestServices />} />
                    <Route path="/inspection-report/:propertyId" element={<InspectionReport />} />
                    <Route path="/review/:propertyId" element={<Review />} />
                    <Route path="/legal-services/:propertyId" element={<LegalServices />} />
                    <Route path="/other-services/:propertyId" element={<OtherServices />} />
                    <Route path="/attach-documents/:propertyId" element={<AttachDocuments />} />
                    <Route path="/renew-agreement/:propertyId" element={<RenewAgreement />} />
                    <Route path="/terminate-agreement/:propertyId" element={<TerminateAgreement />} />
                    <Route path="/visit-planner" element={<VisitPlanner />} />
                    <Route path="/archived-properties" element={<ArchivedProperties />} />
                  </Route>
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <SiteFooter />
            </div>
          </BrowserRouter>
        </SearchProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
