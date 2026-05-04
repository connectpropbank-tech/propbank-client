import { Link, NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, LogIn, ChevronDown, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { auth, signOutUser } from "@/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { API_BASE_URL } from "../utils/config";
import axios from "axios";

const SiteHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [userPhone, setUserPhone] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      // Skip user API call on admin page (unprotected route, no user needed)
      if (firebaseUser && location.pathname !== "/admin") {
        getUserData(firebaseUser.uid);
      } else {
        setUserPhone("");
        setUserEmail("");
      }
    });
    return () => unsubscribe();
  }, [location.pathname]);

  const getUserData = async (uid: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${uid}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        const data = response.data;
        if (data.user) {
          if (data.user.phoneNumber) setUserPhone(data.user.phoneNumber);
          if (data.user.email) setUserEmail(data.user.email);
        }
      }
    } catch (error) {

    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await signOutUser();
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 font-semibold">
          <span className="h-6 w-6 rounded-md bg-gradient-primary shadow-glow"></span>
          <span>Propbank</span>
        </Link>

        <div className="flex items-center gap-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto">

              <div className="flex flex-col gap-6 pt-6 pb-6 min-h-full">
                {user && (
                  <div className="flex items-start gap-4 p-4 bg-accent/30 rounded-xl border border-accent/50">
                    <img src={user.photoURL || "https://ui-avatars.com/api/?name=User"} alt="Profile"
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {user.displayName || "No Name"}
                      </div>
                      <div className="text-[10px] text-muted-foreground break-all leading-tight">
                        {user.email || userEmail}
                      </div>
                      {userPhone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                          <span className="text-green-600">📞</span>
                          <span className="font-medium">{userPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <nav className="flex flex-col gap-2">
                  {/* Manage Property */}
                  <NavLink to="/manage-property" onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-3 rounded-md transition-colors text-left flex items-center gap-3 ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`
                    }
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Manage Property
                  </NavLink>

                  {/* Visit Planner */}
                  <NavLink to="/visit-planner" onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-3 rounded-md transition-colors text-left flex items-center gap-3 ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`
                    }
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Visit Planner
                  </NavLink>

                  {/* Admin Portal */}
                  <NavLink to="/admin" onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-3 rounded-md transition-colors text-left flex items-center gap-3 ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`
                    }
                  >
                    <Shield className="w-5 h-5" />
                    Admin Portal
                  </NavLink>

                  {/* Contact Us */}
                  <a
                    href="mailto:connect@propbank.shop"
                    className="px-3 py-3 rounded-md transition-colors text-left flex items-center gap-3 hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    <Mail className="w-5 h-5" />
                    Contact Us
                  </a>

                  <div className="border-t pt-4 mt-4">
                    {user ? (
                      <Button variant="ghost" onClick={handleLogout}
                        className="w-full justify-start gap-3 px-3 py-3 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <LogOut className="h-5 w-5" /> Logout
                      </Button>)
                      :
                      (
                        <Button variant="ghost" asChild className="w-full justify-start gap-3 px-3 py-3">
                          <Link to="/auth" onClick={() => setIsOpen(false)}>
                            <LogIn className="h-5 w-5" /> Login
                          </Link>
                        </Button>
                      )}
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;