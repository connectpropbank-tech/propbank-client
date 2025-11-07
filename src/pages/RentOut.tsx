import { Helmet } from "react-helmet-async";
import { useState } from "react";
import PropertyTypeSelector from "@/components/PropertyTypeSelector";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const RentOut = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Rental listed", description: "Your rental property was created (demo)." });
      (e.target as HTMLFormElement).reset();
    }, 600);
  };

  if (!selectedType) {
    return (
      <>
        <Helmet>
          <title>Rent Out — ShoPROP Real Estate</title>
          <meta name="description" content="Rent out your property as a landlord on ShoPROP. Reach quality tenants fast." />
          <link rel="canonical" href="/rent-out" />
        </Helmet>
        <PropertyTypeSelector
          title="Rent Out Property"
          description="Choose the type of property you want to rent out"
          onSelect={setSelectedType}
        />
      </>
    );
  }

  return (
    <main className="container mx-auto py-10">
      <Helmet>
        <title>Rent Out — ShoPROP Real Estate</title>
        <meta name="description" content="Rent out your property as a landlord on ShoPROP. Reach quality tenants fast." />
        <link rel="canonical" href="/rent-out" />
      </Helmet>
      
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => setSelectedType(null)}
          className="mb-4"
        >
          ← Back to Property Types
        </Button>
        <h1 className="text-3xl font-bold mb-6">List a {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Rental</h1>
      </div>
      
      <form onSubmit={onSubmit} className="grid gap-6 max-w-2xl">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="e.g., Bright 2BR apartment" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rent">Monthly Rent</Label>
          <Input id="rent" name="rent" type="text" placeholder="$2,000/mo" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="City, State" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="beds">Beds</Label>
            <Input id="beds" name="beds" type="number" min={0} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="baths">Baths</Label>
            <Input id="baths" name="baths" type="number" min={0} required />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="image">Image (URL)</Label>
          <Input id="image" name="image" type="url" placeholder="https://..." />
        </div>
        <div className="flex gap-3">
          <Button type="submit" variant="hero" disabled={loading}>
            {loading ? "Saving..." : "Create Rental"}
          </Button>
          <Button type="reset" variant="outline">Reset</Button>
        </div>
      </form>
    </main>
  );
};

export default RentOut;
