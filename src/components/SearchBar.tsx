import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

const SearchBar = () => {
  const [searchType, setSearchType] = useState("buy");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = async () => {
    // Check if user is authenticated
    const user = auth.currentUser;
    
    if (!user) {
      // Redirect to auth page if not authenticated
      navigate("/auth");
      return;
    }

    // Handle search functionality here for authenticated users
    // Navigate to search results page with query and type
    const searchParams = new URLSearchParams();
    if (searchQuery.trim()) searchParams.append('q', searchQuery.trim());
    if (searchType) searchParams.append('type', searchType);
    
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-0 rounded-lg border border-input bg-background shadow-sm overflow-hidden">
        <Select value={searchType} onValueChange={setSearchType}>
          <SelectTrigger className="w-32 border-0 border-r border-input rounded-none bg-muted/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="rent">Rent</SelectItem>
          </SelectContent>
        </Select>
        
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search properties by location, type, or features..."
          className="flex-1 border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        
        <Button 
          onClick={handleSearch}
          className="rounded-none px-4"
          variant="default"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;