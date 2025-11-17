import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface FurnishedItem {
  id: string;
  name: string;
  checked: boolean;
  category: 'basic' | 'kitchen' | 'bedroom' | 'living' | 'appliances' | 'semifurnished' | 'other';
}

interface FurnishedChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (checklist: FurnishedItem[]) => void;
  initialChecklist?: FurnishedItem[];
}

const defaultFurnishedItems: Omit<FurnishedItem, 'id' | 'checked'>[] = [
  // Semi Furnished Items (Based on your table)
  { name: 'Light', category: 'semifurnished' },
  { name: 'Fan', category: 'semifurnished' },
  { name: 'Kitchen cabinet', category: 'semifurnished' },
  { name: 'Geyser', category: 'semifurnished' },
  { name: 'Curtain Road', category: 'semifurnished' },
  { name: 'Mosquito net', category: 'semifurnished' },
  { name: 'Exhaust Fan', category: 'semifurnished' },
  { name: 'Chimeny (Optional)', category: 'semifurnished' },
  { name: 'Air Conditioners (Optional)', category: 'semifurnished' },
  { name: 'Wooden Cabinets (Optional)', category: 'semifurnished' },
  
  // Basic Items
  { name: 'Light fan', category: 'basic' },
  { name: 'Kitchen cabinet', category: 'basic' },
  { name: 'Geyser', category: 'basic' },
  { name: 'Curtain Road', category: 'basic' },
  { name: 'Mosquito net', category: 'basic' },
  { name: 'Exhaust Fan', category: 'basic' },
  { name: 'Chimeny (Optional)', category: 'basic' },
  { name: 'Air Conditioners', category: 'basic' },
  { name: 'Wooden Cabinets', category: 'basic' },
  
  // Kitchen Items  
  { name: 'Exhaust Fan', category: 'kitchen' },
  { name: 'Air Conditioners', category: 'kitchen' },
  { name: 'Sofa', category: 'kitchen' },
  { name: 'Refrigerator', category: 'kitchen' },
  { name: 'Microwave', category: 'kitchen' },
  { name: 'Chairs', category: 'kitchen' },
  { name: 'CCTV Camera', category: 'kitchen' },
  { name: 'Side tables', category: 'kitchen' },
  { name: 'Burner', category: 'kitchen' },
  { name: 'Dish washer', category: 'kitchen' },
  { name: 'cooking range', category: 'kitchen' },
  
  // Bedroom Items
  { name: 'Double Bed', category: 'bedroom' },
  { name: 'Single Bed', category: 'bedroom' },
  { name: 'Mattress', category: 'bedroom' },
  { name: 'Dressing unit', category: 'bedroom' },
  
  // Living Room Items
  { name: 'Sofa', category: 'living' },
  { name: 'Centre table', category: 'living' },
  { name: 'Dining with chairs', category: 'living' },
  { name: 'wall painting', category: 'living' },
  { name: 'Balcony table with chairs', category: 'living' },
  
  // Appliances
  { name: 'Refrigerator', category: 'appliances' },
  { name: 'Microwave', category: 'appliances' },
  { name: 'Washing Machine', category: 'appliances' },
];

export const FurnishedChecklistModal: React.FC<FurnishedChecklistModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialChecklist = []
}) => {
  const [checklist, setChecklist] = useState<FurnishedItem[]>(() => {
    if (initialChecklist.length > 0) {
      return initialChecklist;
    }
    
    return defaultFurnishedItems.map((item, index) => ({
      ...item,
      id: `item-${index}`,
      checked: false
    }));
  });

  const [customItems, setCustomItems] = useState<string[]>(['']);

  const handleItemToggle = (itemId: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
  };

  const addCustomItem = (itemName: string) => {
    if (itemName.trim()) {
      const newItem: FurnishedItem = {
        id: `custom-${Date.now()}`,
        name: itemName.trim(),
        checked: false,
        category: 'other'
      };
      setChecklist(prev => [...prev, newItem]);
    }
  };

  const removeCustomItem = (itemId: string) => {
    setChecklist(prev => prev.filter(item => item.id !== itemId));
  };

  const handleCustomItemChange = (index: number, value: string) => {
    const newCustomItems = [...customItems];
    newCustomItems[index] = value;
    setCustomItems(newCustomItems);
  };

  const addCustomItemInput = () => {
    setCustomItems(prev => [...prev, '']);
  };

  const removeCustomItemInput = (index: number) => {
    setCustomItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Add any pending custom items
    customItems.forEach(item => {
      if (item.trim()) {
        addCustomItem(item);
      }
    });
    
    onSave(checklist);
    onClose();
  };

  const groupedItems = checklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FurnishedItem[]>);

  const categoryTitles = {
    semifurnished: 'Semi Furnished Items',
    basic: 'Basic Furnishing',
    kitchen: 'Kitchen Items',
    bedroom: 'Bedroom Items', 
    living: 'Living Room Items',
    appliances: 'Appliances',
    other: 'Other Items'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Furnished Property Checklist</DialogTitle>
          <DialogDescription>
            Select all the items that are included with this furnished property
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(groupedItems).map(([category, items]) => (
              <Card key={category} className="border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {categoryTitles[category as keyof typeof categoryTitles]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={() => handleItemToggle(item.id)}
                      />
                      <Label 
                        htmlFor={item.id}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {item.name}
                      </Label>
                      {item.category === 'other' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomItem(item.id)}
                          className="text-destructive hover:text-destructive p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Custom Items Section */}
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Add Custom Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder="Enter custom item name..."
                    value={item}
                    onChange={(e) => handleCustomItemChange(index, e.target.value)}
                    onBlur={() => {
                      if (item.trim()) {
                        addCustomItem(item);
                        setCustomItems(prev => prev.filter((_, i) => i !== index));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (item.trim()) {
                          addCustomItem(item);
                          setCustomItems(prev => prev.filter((_, i) => i !== index));
                        }
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomItemInput(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addCustomItemInput}
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Item
              </Button>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium">
              Selected Items: {checklist.filter(item => item.checked).length} of {checklist.length}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Checklist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
