import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Profile = () => {
  const onSubmit = (role: string) => (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({ title: `${role} profile saved`, description: "Your profile details were updated (demo)." });
  };

  return (
    <main className="container mx-auto py-10">
      <Helmet>
        <title>User Profiles — ShoPROP Real Estate</title>
        <meta name="description" content="Manage your seller/landlord and buyer/tenant profiles in ShoPROP." />
        <link rel="canonical" href="/profile" />
      </Helmet>

      <h1 className="text-3xl font-bold mb-6">Your Profiles</h1>
      <Tabs defaultValue="seller" className="max-w-3xl">
        <TabsList>
          <TabsTrigger value="seller">Seller / Landlord</TabsTrigger>
          <TabsTrigger value="buyer">Buyer / Tenant</TabsTrigger>
        </TabsList>
        <TabsContent value="seller" className="mt-6">
          <form className="grid gap-6" onSubmit={onSubmit("Seller/Landlord")}>
            <div className="grid gap-2">
              <Label htmlFor="sl-name">Full Name</Label>
              <Input id="sl-name" name="name" placeholder="Your name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sl-email">Email</Label>
              <Input id="sl-email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sl-phone">Phone</Label>
              <Input id="sl-phone" name="phone" type="tel" placeholder="(555) 555-5555" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sl-company">Company (optional)</Label>
              <Input id="sl-company" name="company" placeholder="Agency or company" />
            </div>
            <Button type="submit" variant="hero">Save Seller/Landlord Profile</Button>
          </form>
        </TabsContent>
        <TabsContent value="buyer" className="mt-6">
          <form className="grid gap-6" onSubmit={onSubmit("Buyer/Tenant")}>
            <div className="grid gap-2">
              <Label htmlFor="bt-name">Full Name</Label>
              <Input id="bt-name" name="name" placeholder="Your name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bt-email">Email</Label>
              <Input id="bt-email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bt-phone">Phone</Label>
              <Input id="bt-phone" name="phone" type="tel" placeholder="(555) 555-5555" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bt-budget">Budget</Label>
                <Input id="bt-budget" name="budget" placeholder="$2,500/mo or $550,000" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bt-location">Preferred Location</Label>
                <Input id="bt-location" name="location" placeholder="City, State" />
              </div>
            </div>
            <Button type="submit" variant="secondary">Save Buyer/Tenant Profile</Button>
          </form>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Profile;
