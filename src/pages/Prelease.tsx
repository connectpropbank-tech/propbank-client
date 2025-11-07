import { Helmet } from "react-helmet-async";
import { useState } from "react";
import PropertyTypeSelector from "@/components/PropertyTypeSelector";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Prelease = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Pre-lease listing created", description: "Your pre-lease property was listed successfully (demo)." });
      (e.target as HTMLFormElement).reset();
    }, 600);
  };

  if (!selectedType) {
    return (
      <>
        <Helmet>
          <title>Pre lease Property — ShoPROP Real Estate</title>
          <meta name="description" content="Pre-lease your property on ShoPROP. Get tenants before construction is complete." />
          <link rel="canonical" href="/prelease" />
        </Helmet>
        <PropertyTypeSelector
          title="Pre lease Property"
          description="Choose the type of property you want to pre-lease"
          onSelect={setSelectedType}
        />
      </>
    );
  }

  return (
    <main className="container mx-auto py-10">
      <Helmet>
        <title>Pre lease Property — ShoPROP Real Estate</title>
        <meta name="description" content="Pre-lease your property on ShoPROP. Get tenants before construction is complete." />
        <link rel="canonical" href="/prelease" />
      </Helmet>
      
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => setSelectedType(null)}
          className="mb-4"
        >
          ← Back to Property Types
        </Button>
        <h1 className="text-3xl font-bold">List a {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Property for Pre-lease</h1>
      </div>
      
      <form onSubmit={onSubmit} className="grid gap-6 max-w-2xl">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="e.g., New luxury apartment complex" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rent">Expected Monthly Rent</Label>
          <Input id="rent" name="rent" type="text" placeholder="$2,500/mo" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="City, State" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="completion">Expected Completion Date</Label>
          <Input id="completion" name="completion" type="date" required />
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
          <Label htmlFor="image">Rendering/Image (URL)</Label>
          <Input id="image" name="image" type="url" placeholder="https://..." />
        </div>
        <div className="flex gap-3">
          <Button type="submit" variant="hero" disabled={loading}>
            {loading ? "Saving..." : "Create Pre-lease Listing"}
          </Button>
          <Button type="reset" variant="outline">Reset</Button>
        </div>
      </form>
    </main>
  );
};

export default Prelease;