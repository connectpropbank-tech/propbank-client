import { Link, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOutUser();
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 font-semibold">
          <span className="h-6 w-6 rounded-md bg-gradient-primary shadow-glow"></span>
          <span>ShoPROP</span>
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
                <div className="relative group flex items-center mx-2">
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

        {/* Mobile Login/Logout Button */}
        <div className="flex items-center gap-2 md:hidden">
          {user ? 
          (
            <Button variant="ghost" onClick={handleLogout} size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          ) 
          : 
          (
            <Button variant="ghost" asChild size="sm">
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
              </Link>
            </Button>
          )}
          
          {/* <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4">
                {allNavItemsFlat.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md transition-colors text-left ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                {user ? (
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="gap-2 justify-start"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    asChild
                    className="gap-2 justify-start"
                  >
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <LogIn className="h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet> */}
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;