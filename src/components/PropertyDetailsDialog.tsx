
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Property } from "@/services/propertyService";
import { Building2, MapPin, Home, Ruler, Calendar, Banknote } from "lucide-react";

interface PropertyDetailsDialogProps {
    property: Property;
}

const PropertyDetailsDialog = ({ property }: PropertyDetailsDialogProps) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    View Property
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">{property.title}</DialogTitle>
                    <DialogDescription className="flex items-center gap-1 text-sm mt-1">
                        <MapPin className="h-4 w-4" /> {property.address || property.city}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Main Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Configuration */}
                        {property.configuration && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Home className="h-4 w-4" />
                                    <span>Configuration</span>
                                </div>
                                <p className="font-medium text-sm">{property.configuration}</p>
                            </div>
                        )}

                        {/* Condition */}
                        {property.unitCondition && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Building2 className="h-4 w-4" />
                                    <span>Condition</span>
                                </div>
                                <p className="font-medium text-sm capitalize">{property.unitCondition}</p>
                            </div>
                        )}

                        {/* Carpet Area */}
                        {property.carpetArea && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Ruler className="h-4 w-4" />
                                    <span>Carpet Area</span>
                                </div>
                                <p className="font-medium text-sm">{property.carpetArea}</p>
                            </div>
                        )}

                        {/* Constructed/Built-up Area */}
                        {property.constructedArea && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Ruler className="h-4 w-4" />
                                    <span>Buildup Area</span>
                                </div>
                                <p className="font-medium text-sm">{property.constructedArea}</p>
                            </div>
                        )}

                        {/* Possession */}
                        {property.projectCondition && (
                            <div className="col-span-2 space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Calendar className="h-4 w-4" />
                                    <span>Possession Status</span>
                                </div>
                                <p className="font-medium text-sm">{property.projectCondition}</p>
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Banknote className="h-4 w-4" />
                                <span>Pricing</span>
                            </div>
                            {property.listingType === 'rent' && (
                                <div className="text-sm font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                                    For Rent
                                </div>
                            )}
                            {property.listingType === 'sell' && (
                                <div className="text-sm font-medium px-2 py-1 bg-green-50 text-green-700 rounded-full">
                                    For Sale
                                </div>
                            )}
                        </div>
                        <div className="group flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-primary">
                                ₹{
                                    property.price > 0
                                        ? property.price.toLocaleString('en-IN')
                                        : property.listingType === 'rent' && property.monthlyRent
                                            ? parseInt(property.monthlyRent).toLocaleString('en-IN')
                                            : property.listingType === 'sell' && property.sellingPrice
                                                ? parseInt(property.sellingPrice).toLocaleString('en-IN')
                                                : "0"
                                }
                            </span>
                            {property.listingType === 'rent' && <span className="text-muted-foreground">/month</span>}
                        </div>

                        {/* Availability Status */}
                        {property.rentalStatus && (
                            <div className="mt-3 flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Availability:</span>
                                <span className={`text-sm font-medium capitalize ${property.rentalStatus === 'available' ? 'text-green-600' : 'text-amber-600'
                                    }`}>
                                    {property.rentalStatus}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PropertyDetailsDialog;
