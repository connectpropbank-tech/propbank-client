import React, { useState, useEffect } from "react";
import { signInWithGoogle, signOutUser, auth } from "../firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GoogleAuthProps {}

const GoogleAuth: React.FC<GoogleAuthProps> = () => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [showPhoneInput, setShowPhoneInput] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Check if user already has phone number in backend
        const hasPhone = await checkUserPhoneNumber(firebaseUser.uid);
        if (!hasPhone) {
          setShowPhoneInput(true);
        } else {
          setUserLoggedIn(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setUserLoggedIn(!!user && !showPhoneInput);
  }, [user, showPhoneInput]);

  // Function to check if user already has phone number
  const checkUserPhoneNumber = async (uid: string) => {
    try {
      const response = await fetch(`http://localhost:8002/users/${uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.user && data.user.phoneNumber;
      }
      return false;
    } catch (error) {
      console.error("Error checking user phone number:", error);
      return false;
    }
  };

  // Function to save user data to backend
  const saveUserToBackend = async (firebaseUser: User, phone: string, role: string) => {
    try {
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        phoneNumber: phone,
        role: role,
      };

      console.log("Sending user data to backend:", userData);

      const response = await fetch('http://localhost:8002/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      if (data.success) {
        console.log("✅ User saved to backend successfully:", data);
      } else {
        console.error("❌ Failed to save user to backend:", data.message);
        alert("Failed to save user data. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error saving user to backend:", error);
      alert("Error connecting to server. Please check your connection.");
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      alert("Please enter your phone number");
      return;
    }

    if (!/^\d{10}$/.test(phoneNumber.trim())) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    if (!userRole) {
      alert("Please select your role");
      return;
    }

    if (user) {
      await saveUserToBackend(user, phoneNumber, userRole);
      setShowPhoneInput(false);
      setUserLoggedIn(true);
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
      console.log("✅ User signed out successfully");
    } catch (error: any) {
      console.error("❌ Error signing out:", error);
      alert(error.message);
    }
  };

  console.log("Current user in GoogleAuth:", user);
  console.log("User logged in status:", userLoggedIn);

  return (
    <div className="flex flex-col items-center gap-4">
      {!userLoggedIn ? (
        showPhoneInput && user ? (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold text-gray-800 mb-2">
                Welcome, {user.displayName}!
              </CardTitle>
              <p className="text-gray-600 mt-2">{user.email}</p>
              <p className="text-sm text-gray-600 mt-2">
                Complete your registration by selecting your role and providing your phone number. 
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Select Your Role *
                </Label>
                <Select onValueChange={setUserRole} value={userRole}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
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

              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your 10-digit phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="mt-1"
                  maxLength={10}
                />
              </div>
              
              <Button
                onClick={handlePhoneSubmit}
                className="w-full mt-6"
                disabled={!phoneNumber || !userRole || phoneNumber.length !== 10}
              >
                Complete Registration
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-3 text-gray-900">
                  Sign in or Create an Account
                </h1>
                <p className="text-gray-600 text-sm">
                  Join ShoPROP to manage your properties and connect with tenants, buyers, and agents.
                </p>
              </div>
              
              <Button
                onClick={handleSignIn}
                className="w-full bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-3 py-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign In with Google
              </Button>
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
              <p className="text-gray-700">
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
