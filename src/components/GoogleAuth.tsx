import React, { useState, useEffect, useRef } from "react";
import { signInWithGoogle, signOutUser, auth } from "../firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "../utils/config";
import { AlertTriangle } from "lucide-react";

interface GoogleAuthProps { }

const GoogleAuth: React.FC<GoogleAuthProps> = () => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [showPhoneInput, setShowPhoneInput] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Refs to access latest state inside auth callback
  const phoneRef = useRef(phoneNumber);
  const roleRef = useRef(userRole);

  // Keep refs in sync with state
  useEffect(() => { phoneRef.current = phoneNumber; }, [phoneNumber]);
  useEffect(() => { roleRef.current = userRole; }, [userRole]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Check if user already has phone number in backend
        const hasPhone = await checkUserPhoneNumber(firebaseUser.uid);

        if (!hasPhone) {
          // Check if we have pre-filled data from the login form
          if (phoneRef.current && roleRef.current) {
            const savedUser = await saveUserToBackend(firebaseUser, phoneRef.current, roleRef.current);
            if (savedUser) {
              // Trust the successful save directly - skip redundant network check
              // Set cookie manually
              document.cookie = `userPhone=${savedUser.phoneNumber}; path=/; max-age=86400; SameSite=Strict`;

              setUserLoggedIn(true);
              syncUserData(firebaseUser);
              return;
            }
          }
          // If no pre-filled data or save failed, show manual input modal
          setShowPhoneInput(true);
        } else {
          setUserLoggedIn(true);
          // Sync basic user data (email, name, photo) to ensure backend is up to date
          syncUserData(firebaseUser);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Function to sync basic user data (email, name, photo) without requiring phone/role
  const syncUserData = async (firebaseUser: User) => {
    try {
      console.log("Debug: Syncing User Data. Firebase User:", firebaseUser);
      console.log("Debug: User Email:", firebaseUser.email);
      console.log("Debug: Provider Data:", firebaseUser.providerData);

      const email = firebaseUser.email || firebaseUser.providerData[0]?.email || "";
      console.log("Debug: Extracted Email:", email);

      const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User";

      // Store in cookies
      document.cookie = `userEmail=${email}; path=/; max-age=86400; SameSite=Strict`; // 1 day
      document.cookie = `userName=${name}; path=/; max-age=86400; SameSite=Strict`;

      const updateData = {
        email: email,
        name: name,
        photoURL: firebaseUser.photoURL,
      };

      await fetch(`${API_BASE_URL}/users/${firebaseUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
    } catch (error) {
      console.error("Error syncing user data:", error);
    }
  };

  useEffect(() => {
    setUserLoggedIn(!!user && !showPhoneInput);
  }, [user, showPhoneInput]);

  // Block navigation when registration is incomplete
  useEffect(() => {
    if (showPhoneInput && user) {
      // Block browser back/forward navigation
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
        alert("Please complete your registration before navigating away.");
      };

      // Block page unload/refresh
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "You have not completed your registration. Are you sure you want to leave?";
        return e.returnValue;
      };

      // Block keyboard shortcuts for navigation
      const handleKeyDown = (e: KeyboardEvent) => {
        // Block Alt+Left/Right (browser back/forward)
        if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          e.preventDefault();
        }
        // Block Ctrl/Cmd+W (close tab)
        if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
          e.preventDefault();
        }
      };

      // Push a state to prevent back navigation
      window.history.pushState(null, '', window.location.href);

      window.addEventListener('popstate', handlePopState);
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('keydown', handleKeyDown);

      // Disable body scroll when modal is open
      document.body.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [showPhoneInput, user]);

  // Function to check if user has completed registration (phone number AND role)
  const checkUserPhoneNumber = async (uid: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Both phone number and role must be present for complete registration
        const hasCompleteData = data.user &&
          data.user.phoneNumber &&
          data.user.phoneNumber.trim() !== "" &&
          data.user.role &&
          data.user.role.trim() !== "";

        if (hasCompleteData) {
          document.cookie = `userPhone=${data.user.phoneNumber}; path=/; max-age=86400; SameSite=Strict`;
          // Prefill local state so it shows in the UI
          setPhoneNumber(data.user.phoneNumber);
          setUserRole(data.user.role);
        }

        // console.log("User registration check:", {
        //   hasUser: !!data.user,
        //   hasPhone: !!(data.user?.phoneNumber),
        //   hasRole: !!(data.user?.role),
        //   isComplete: hasCompleteData
        // });

        return hasCompleteData;
      }
      return false;
    } catch (error) {

      return false;
    }
  };

  // Function to save user data to backend (creates new user or updates existing)
  const saveUserToBackend = async (firebaseUser: User, phone: string, role: string) => {
    try {
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || firebaseUser.providerData[0]?.email || "",
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User",
        photoURL: firebaseUser.photoURL,
        phoneNumber: phone,
        role: role,
      };


      // First try to update existing user
      let response = await fetch(`${API_BASE_URL}/users/${firebaseUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });


      const data = await response.json();

      if (data.success || response.ok) {
        // Return the user data if available (or construct it from input if simpler)
        return data.user || userData;
      } else {
        console.error("Failed to save user:", data);
        alert("Failed to save user data. Please try again.");
        return null;
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Error connecting to server. Please check your connection.");
      return null;
    }
  };

  const handlePhoneSubmit = async () => {
    // Prevent double submission
    if (isSubmitting) return;

    if (!phoneNumber.trim()) {
      alert("Phone number is required to complete registration");
      return;
    }

    if (!/^\d{10}$/.test(phoneNumber.trim())) {
      alert("Please enter a valid 10-digit phone number (numbers only)");
      return;
    }

    if (!userRole || userRole.trim() === "") {
      alert("Please select your role to continue");
      return;
    }

    if (user) {
      setIsSubmitting(true);

      try {

        const saveSuccess = await saveUserToBackend(user, phoneNumber, userRole);

        if (saveSuccess) {
          // Double-check that the data was actually saved by re-checking registration

          const isRegistrationComplete = await checkUserPhoneNumber(user.uid);

          if (isRegistrationComplete) {
            // Store phone in cookie
            document.cookie = `userPhone=${phoneNumber}; path=/; max-age=86400; SameSite=Strict`;
            setShowPhoneInput(false);
            setUserLoggedIn(true);

          } else {
            alert("Registration verification failed. Your data may not have been saved properly. Please try again.");
          }
        } else {
          // Keep the form open if save failed

          alert("Failed to save your registration data. Please check your connection and try again.");
        }
      } catch (error) {

        alert("An unexpected error occurred during registration. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      // user state will update via onAuthStateChanged
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      setUserLoggedIn(false);

    } catch (error: any) {

      alert(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!userLoggedIn ? (
        showPhoneInput && user ? (
          /* Full-screen blocking overlay for mandatory registration */
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            {/* Prevent any clicks from passing through */}
            <div
              className="absolute inset-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                // Block Escape key
                if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            />
            <Card className="w-full max-w-md mx-auto relative z-10 shadow-2xl border-2">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold text-gray-800 mb-2">
                  Welcome, {user?.displayName}!
                </CardTitle>
                <p className="text-gray-600 mt-2">{user?.email}</p>
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <p className="text-sm text-amber-800 font-semibold">
                      Complete Registration Required
                    </p>
                  </div>
                  <p className="text-xs text-amber-700">
                    You must complete your registration to access PropBank. Both your role and phone number are mandatory fields that cannot be skipped.
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                    Select Your Role <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={setUserRole} value={userRole}>
                    <SelectTrigger className={`w-full mt-1 ${!userRole ? 'border-red-300 focus:border-red-500' : 'border-green-300'}`}>
                      <SelectValue placeholder="Choose your role" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="individual">
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">Individual</span>
                          <span className="text-xs text-gray-500">Property owner, buyer, or tenant</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="agent">
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">Real Estate Agent</span>
                          <span className="text-xs text-gray-500">Professional property agent or broker</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {!userRole && (
                    <p className="text-xs text-red-500 mt-1">Please select your role</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your 10-digit phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className={`mt-1 ${phoneNumber.length === 10 ? 'border-green-300' : phoneNumber.length > 0 ? 'border-red-300' : ''}`}
                    maxLength={10}
                  />
                  {phoneNumber.length > 0 && phoneNumber.length !== 10 && (
                    <p className="text-xs text-red-500 mt-1">Please enter a valid 10-digit phone number</p>
                  )}
                  {!phoneNumber && (
                    <p className="text-xs text-red-500 mt-1">Phone number is required</p>
                  )}
                </div>

                {/* Validation summary */}
                <div className={`p-3 rounded-lg ${(!phoneNumber || !userRole || phoneNumber.length !== 10) ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`text-xs font-medium ${(!phoneNumber || !userRole || phoneNumber.length !== 10) ? 'text-red-700' : 'text-green-700'}`}>
                    {(!phoneNumber || !userRole || phoneNumber.length !== 10)
                      ? '⚠️ Please complete all required fields to continue'
                      : '✅ All fields completed. You can now register!'}
                  </p>
                </div>

                <Button
                  onClick={handlePhoneSubmit}
                  className="w-full mt-6"
                  disabled={!phoneNumber || !userRole || phoneNumber.length !== 10 || isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Completing Registration...
                    </div>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500 mt-2">
                  You cannot proceed without completing registration
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-3 text-gray-900">
                  Sign in or Create an Account
                </h1>
                <p className="text-gray-600 text-sm">
                  Join Propbank to manage your properties and connect with tenants, buyers, and agents.
                </p>
              </div>

              <div className="space-y-4">
                {/* Pre-Login Role Selection */}
                <div>
                  <Label htmlFor="main-role" className="text-sm font-medium text-gray-700">
                    Select Your Role <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={setUserRole} value={userRole}>
                    <SelectTrigger id="main-role" className={`w-full mt-1 ${!userRole ? 'border-gray-300' : 'border-green-300'}`}>
                      <SelectValue placeholder="Choose your role" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="individual">
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">Individual</span>
                          <span className="text-xs text-gray-500">Property owner, buyer, or tenant</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="agent">
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">Real Estate Agent</span>
                          <span className="text-xs text-gray-500">Professional property agent or broker</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pre-Login Phone Input */}
                <div>
                  <Label htmlFor="main-phone" className="text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="main-phone"
                    type="tel"
                    placeholder="Enter your 10-digit phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className={`mt-1 ${phoneNumber.length === 10 ? 'border-green-300' : 'border-gray-300'}`}
                    maxLength={10}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleSignIn}
                    disabled={!phoneNumber || !userRole || phoneNumber.length !== 10}
                    className="w-full bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-3 py-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign In with Google
                  </Button>
                  {(!phoneNumber || !userRole) && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                      Please enter your details to sign in
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6 pb-6 text-center">
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Welcome back, {user?.displayName}!
              </h2>
              <p className="text-gray-600 text-sm">{user?.email}</p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                ✓ Account Verified
              </div>
            </div>

            <div className="space-y-4">
              {/* Display Pre-filled User Details */}
              <div className="text-left">
                <Label className="text-sm font-medium text-gray-700">Your Role</Label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md mt-1 capitalize text-gray-800 font-medium">
                  {userRole === 'agent' ? 'Real Estate Agent' : 'Individual'}
                </div>
              </div>

              <div className="text-left">
                <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md mt-1 text-gray-800 font-medium">
                  {phoneNumber}
                </div>
              </div>

              <p className="text-gray-700 mt-4">
                Ready to start your property management journey! 🏠
              </p>
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 transition-colors py-3"
              >
                Go to Home Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleAuth;
