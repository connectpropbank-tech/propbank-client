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
  quantity: number;
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
  { name: 'Light', category: 'semifurnished', quantity: 1 },
  { name: 'Fan', category: 'semifurnished', quantity: 1 },
  { name: 'Kitchen cabinet', category: 'semifurnished', quantity: 1 },
  { name: 'Geyser', category: 'semifurnished', quantity: 1 },
  { name: 'Curtain Road', category: 'semifurnished', quantity: 1 },
  { name: 'Mosquito net', category: 'semifurnished', quantity: 1 },
  { name: 'Exhaust Fan', category: 'semifurnished', quantity: 1 },
  { name: 'Chimeny (Optional)', category: 'semifurnished', quantity: 1 },
  { name: 'Air Conditioners (Optional)', category: 'semifurnished', quantity: 1 },
  { name: 'Wooden Cabinets (Optional)', category: 'semifurnished', quantity: 1 },
  
  // Basic Items
  { name: 'Light fan', category: 'basic', quantity: 1 },
  { name: 'Kitchen cabinet', category: 'basic', quantity: 1 },
  { name: 'Geyser', category: 'basic', quantity: 1 },
  { name: 'Curtain Road', category: 'basic', quantity: 1 },
  { name: 'Mosquito net', category: 'basic', quantity: 1 },
  { name: 'Exhaust Fan', category: 'basic', quantity: 1 },
  { name: 'Chimeny (Optional)', category: 'basic', quantity: 1 },
  { name: 'Air Conditioners', category: 'basic', quantity: 1 },
  { name: 'Wooden Cabinets', category: 'basic', quantity: 1 },
  
  // Kitchen Items  
  { name: 'Exhaust Fan', category: 'kitchen', quantity: 1 },
  { name: 'Air Conditioners', category: 'kitchen', quantity: 1 },
  { name: 'Sofa', category: 'kitchen', quantity: 1 },
  { name: 'Refrigerator', category: 'kitchen', quantity: 1 },
  { name: 'Microwave', category: 'kitchen', quantity: 1 },
  { name: 'Chairs', category: 'kitchen', quantity: 1 },
  { name: 'CCTV Camera', category: 'kitchen', quantity: 1 },
  { name: 'Side tables', category: 'kitchen', quantity: 1 },
  { name: 'Burner', category: 'kitchen', quantity: 1 },
  { name: 'Dish washer', category: 'kitchen', quantity: 1 },
  { name: 'cooking range', category: 'kitchen', quantity: 1 },
  
  // Bedroom Items
  { name: 'Double Bed', category: 'bedroom', quantity: 1 },
  { name: 'Single Bed', category: 'bedroom', quantity: 1 },
  { name: 'Mattress', category: 'bedroom', quantity: 1 },
  { name: 'Dressing unit', category: 'bedroom', quantity: 1 },
  
  // Living Room Items
  { name: 'Sofa', category: 'living', quantity: 1 },
  { name: 'Centre table', category: 'living', quantity: 1 },
  { name: 'Dining with chairs', category: 'living', quantity: 1 },
  { name: 'wall painting', category: 'living', quantity: 1 },
  { name: 'Balcony table with chairs', category: 'living', quantity: 1 },
  
  // Appliances
  { name: 'Refrigerator', category: 'appliances', quantity: 1 },
  { name: 'Microwave', category: 'appliances', quantity: 1 },
  { name: 'Washing Machine', category: 'appliances', quantity: 1 },
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
      checked: false,
      quantity: 1
    }));
  });

  const [customItems, setCustomItems] = useState<string[]>(['']);

  const handleItemToggle = (itemId: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const qty = Math.max(1, Math.floor(quantity || 1));
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: qty } : item
    ));
  };

  const addCustomItem = (itemName: string) => {
    if (itemName.trim()) {
      const newItem: FurnishedItem = {
        id: `custom-${Date.now()}`,
        name: itemName.trim(),
        checked: false,
        quantity: 1,
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
    // Add any pending custom items before saving
    const itemsToAdd: string[] = [];
    customItems.forEach(item => {
      if (item.trim()) {
        itemsToAdd.push(item.trim());
      }
    });
    
    // Add all pending custom items first
    itemsToAdd.forEach(itemName => {
      const newItem: FurnishedItem = {
        id: `custom-${Date.now()}-${Math.random()}`,
        name: itemName,
        checked: false,
        quantity: 1,
        category: 'other'
      };
      setChecklist(prev => [...prev, newItem]);
    });
    
    // Clear custom items input
    setCustomItems(['']);
    
    // Save the checklist (including newly added custom items)
    setTimeout(() => {
      setChecklist(currentChecklist => {
        onSave(currentChecklist);
        return currentChecklist;
      });
      onClose();
    }, 50);
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
                    <div key={item.id} className="flex items-center space-x-3 gap-2">
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
                      {/* Quantity field - always visible for all items */}
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`qty-${item.id}`} className="text-xs text-muted-foreground whitespace-nowrap">
                          Qty:
                        </Label>
                        <Input
                          id={`qty-${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 h-8 text-sm"
                          onClick={(e) => e.stopPropagation()}
                          disabled={!item.checked}
                        />
                      </div>
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
          <Card className="border border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                Add Custom Items
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add your own custom furnished items that are not in the default list
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {customItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder="Enter custom item name (e.g., Smart TV, Coffee Table, etc.)..."
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
                  {customItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomItemInput(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addCustomItemInput}
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Custom Item
              </Button>
              {checklist.filter(item => item.category === 'other').length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    Custom items added: {checklist.filter(item => item.category === 'other').length}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium">
              Selected Items: {checklist.filter(item => item.checked).length} of {checklist.length}
            </p>
            {checklist.filter(item => item.checked).length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Total Quantity: {checklist.filter(item => item.checked).reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            )}
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
