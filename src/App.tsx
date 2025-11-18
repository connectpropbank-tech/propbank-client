import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SearchProvider } from "@/contexts/SearchContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ManageProperty from "./pages/ManageProperty";
import AddPropertyForm from "./pages/AddPropertyForm";
import SelectPropertyType from "./pages/SelectPropertyType";
import AddTenant from "./pages/AddTenant";
import PropertyDetails from "./pages/PropertyDetails";
import RequestServices from "./pages/RequestServices";
import EditProperty from "./pages/EditProperty";
import SearchResults from "./pages/SearchResults";
import VisitPlanner from "./pages/VisitPlanner";

const queryClient = new QueryClient();

function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("ProtectedRoute - Auth state changed:", currentUser);
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  //console.log("ProtectedRoute - Loading:", loading, "User:", user);

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



const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <SearchProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <SiteHeader />
              <main className="flex-1">
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<Index />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/manage-property" element={<ManageProperty />} />
                    <Route path="/select-property-type" element={<SelectPropertyType />} />
                    <Route path="/add-property" element={<AddPropertyForm />} />
                    <Route path="/property/:propertyId" element={<PropertyDetails />} />
                    <Route path="/edit-property/:propertyId" element={<EditProperty />} />
                    <Route path="/add-tenant/:propertyId" element={<AddTenant />} />
                    <Route path="/request-services/:propertyId" element={<RequestServices />} />
                    <Route path="/visit-planner" element={<VisitPlanner />} />
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
