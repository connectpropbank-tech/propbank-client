import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { SearchProvider } from "@/contexts/SearchContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Buy from "./pages/Buy";
import Rent from "./pages/Rent";
import Sell from "./pages/Sell";
import RentOut from "./pages/RentOut";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ManageProperty from "./pages/ManageProperty";
import AddPropertyForm from "./pages/AddPropertyForm";
import SelectPropertyType from "./pages/SelectPropertyType";
import AddTenant from "./pages/AddTenant";
import AddBuyer from "./pages/AddBuyer";
import PropertyDetails from "./pages/PropertyDetails";
import RequestServices from "./pages/RequestServices";
import EditProperty from "./pages/EditProperty";
import DayPlanner from "./pages/DayPlanner";
import Prelease from "./pages/Prelease";
import SearchResults from "./pages/SearchResults";
import GoogleAuth from "./components/GoogleAuth";

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
            <SiteHeader />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route element={<ProtectedRoute />}>
              <Route path="/buy" element={<Buy />} />
              <Route path="/rent" element={<Rent />} />
              <Route path="/sell" element={<Sell />} />
              <Route path="/rent-out" element={<RentOut />} />
              <Route path="/prelease" element={<Prelease />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/manage-property" element={<ManageProperty/>} />
              <Route path="/select-property-type" element={<SelectPropertyType />} />
              <Route path="/add-property" element={<AddPropertyForm />} />
              <Route path="/property/:propertyId" element={<PropertyDetails />} />
              <Route path="/edit-property/:propertyId" element={<EditProperty />} />
              <Route path="/add-tenant/:propertyId" element={<AddTenant />} />
              <Route path="/add-buyer/:propertyId" element={<AddBuyer />} />
              <Route path="/request-services/:propertyId" element={<RequestServices />} />
              <Route path="/visit-planner" element={<DayPlanner />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SiteFooter />
        </BrowserRouter>
        </SearchProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
