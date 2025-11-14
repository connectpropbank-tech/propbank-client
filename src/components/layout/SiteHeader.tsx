import { Link, NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, LogIn, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { auth, signOutUser } from "@/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { API_BASE_URL } from "../../utils/config";

const topLevelNavItems = [
  { to: "/manage-property", label: "Manage Property" },
  { to: "/day-planner", label: "My Day Planner" },
];

const realEstateItems = [
  { to: "/sell", label: "Sell", hasPropertyTypes: true },
  { to: "/buy", label: "Buy", hasPropertyTypes: true },
  { to: "/rent", label: "Find Rental", hasPropertyTypes: true },
  { to: "/rent-out", label: "Rent Out", hasPropertyTypes: true },
  { to: "/prelease", label: "Pre lease Property", hasPropertyTypes: true },
  { to: "/new-projects", label: "New Projects", hasPropertyTypes: false },
];

const propertyTypes = [
  { to: "/residential", label: "Residential" },
  { to: "/commercial", label: "Commercial" },
  { to: "/industrial", label: "Industrial" },
];

// Create flattened nav items for mobile
const getAllNavItemsFlat = () => {
  const items = [...topLevelNavItems];
  realEstateItems.forEach(item => {
    items.push(item);
  });
  return items;
};

const allNavItemsFlat = getAllNavItemsFlat();

const SiteHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [userPhone, setUserPhone] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        fetchUserPhone(firebaseUser.uid);
      } else {
        setUserPhone("");
      }
    });
    return () => unsubscribe();
  }, []);

  // Function to fetch user phone number
  const fetchUserPhone = async (uid: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.phoneNumber) {
          setUserPhone(data.user.phoneNumber);
        }
      }
    } catch (error) {
      console.error("Error fetching user phone:", error);
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
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-5">
          <NavigationMenu>
            <NavigationMenuList className="gap-6">
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <NavLink
                    to="/manage-property"
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md transition-colors ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`
                    }
                  >
                    Manage Property
                  </NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
             
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <NavLink
                    to="/visit-planner"
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md transition-colors ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`
                    }
                  >
                    Visit Planner
                  </NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
              {user && (
                <div className="relative group flex items-center mx-2" ref={dropdownRef}>
                  <button
                    className="rounded-full border-2 border-accent focus:outline-none transition-colors"
                    style={{ width: 40, height: 40, overflow: 'hidden', background: 'var(--gradient-primary)' }}
                    onClick={() => setIsOpen((open) => !open)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gradient-primary)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <img src={user.photoURL || "https://ui-avatars.com/api/?name=User"} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  </button>
                  {isOpen && (
                    <div className="absolute right-1 top-full mt-2 w-56 bg-white border rounded shadow-lg z-50">
                      <div className="p-4 border-b">
                        <div className="font-medium">{user.displayName || "No Name"}</div>
                        <div className="text-xs text-muted-foreground mt-1">{user.email}</div>
                      </div>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-accent">
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </NavigationMenuList>
          </NavigationMenu>
          {!user && (
            <Button variant="ghost" asChild className="gap-2 hover:bg-[#21405a]}">
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </nav>

        {/* Mobile Hamburger Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto">
              <div className="flex flex-col gap-6 pt-6 pb-6 min-h-full">
                {/* User Profile Section - Mobile */}
                {user && (
                  <div className="flex items-start gap-4 p-4 bg-accent/30 rounded-xl border border-accent/50">
                    <img 
                      src={user.photoURL || "https://ui-avatars.com/api/?name=User"} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {user.displayName || "No Name"}
                      </div>
                      <div className="text-[10px] text-muted-foreground break-all leading-tight">
                        {user.email}
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
                
                {/* Navigation Items */}
                <nav className="flex flex-col gap-2">
                  <div className="px-3 py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Main Menu
                  </div>
                  
                  {/* Manage Property */}
                  <NavLink
                    to="/manage-property"
                    onClick={() => setIsOpen(false)}
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
                  <NavLink
                    to="/visit-planner"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-3 rounded-md transition-colors text-left flex items-center gap-3 ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`
                    }
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Visit Planner
                  </NavLink>

                  {/* Property Actions Section */}
                  <div className="px-3 py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-4">
                    Property Actions
                  </div>

                  {/* Buy */}
                  <NavLink
                    to="/buy"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-3 rounded-md transition-colors text-left flex items-center gap-3 ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`
                    }
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                    Buy Property
                  </NavLink>

                  {/* Sell */}
                  <NavLink
                    to="/sell"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-3 rounded-md transition-colors text-left flex items-center gap-3 ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`
                    }
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sell Property
                  </NavLink>



                  {/* Rent Out */}
                  <NavLink
                    to="/rent-out"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-3 rounded-md transition-colors text-left flex items-center gap-3 ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`
                    }
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                    Rent Out Property
                  </NavLink>

                  {/* Pre-lease */}
                  <NavLink
                    to="/prelease"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-3 rounded-md transition-colors text-left flex items-center gap-3 ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`
                    }
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Pre-lease Property
                  </NavLink>

                  {/* Auth Section */}
                  <div className="border-t pt-4 mt-4">
                    {user ? (
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start gap-3 px-3 py-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="h-5 w-5" />
                        Logout
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        asChild
                        className="w-full justify-start gap-3 px-3 py-3"
                      >
                        <Link to="/auth" onClick={() => setIsOpen(false)}>
                          <LogIn className="h-5 w-5" />
                          Login
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