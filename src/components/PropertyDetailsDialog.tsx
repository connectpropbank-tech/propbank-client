
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
import { Building2, MapPin, Home, Ruler, Calendar, Banknote, Image as ImageIcon } from "lucide-react";

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
                        <div className="col-span-2 space-y-1">
                            {(property.projectCondition || property.possessionDate) && (
                                <>
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Calendar className="h-4 w-4" />
                                        <span>Possession Date</span>
                                    </div>
                                    <div className="flex flex-col">
                                        {property.projectCondition && (
                                            <span className="font-medium text-sm">{property.projectCondition}</span>
                                        )}
                                        {property.possessionDate && (
                                            <span className="text-sm font-medium">
                                                {new Date(property.possessionDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Internal Images */}
                    {property.internalImages && property.internalImages.length > 0 && (
                        <div className="border-t pt-4 mt-2">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                                <ImageIcon className="h-4 w-4" />
                                <span>Internal Images</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {property.internalImages.map((img, idx) => (
                                    <div key={idx} className="aspect-video rounded-md overflow-hidden bg-gray-100">
                                        <img src={img} alt={`Internal ${idx}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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

                    {/* Pre-leased Info */}
                    {property.isPreLeased && (
                        <div className="border-t pt-4 mt-2">
                            <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold mb-3">
                                <Building2 className="h-4 w-4" />
                                <span>Pre-leased Property Details</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                {property.preLeasedType && (
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Asset Type</span>
                                        <p className="text-sm font-medium capitalize">{property.preLeasedType}</p>
                                    </div>
                                )}
                                {property.rentalIncome && (
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Monthly Income</span>
                                        <p className="text-sm font-medium">₹{property.rentalIncome}</p>
                                    </div>
                                )}
                                {property.agreementTerm && (
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Agreement Term</span>
                                        <p className="text-sm font-medium">{property.agreementTerm}</p>
                                    </div>
                                )}
                                {property.lockInPeriodPreLeased && (
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Lock-in Period</span>
                                        <p className="text-sm font-medium">{property.lockInPeriodPreLeased}</p>
                                    </div>
                                )}
                                {property.escalation && (
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Escalation</span>
                                        <p className="text-sm font-medium">{property.escalation}</p>
                                    </div>
                                )}
                                {property.purpose && (
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Sale Purpose</span>
                                        <p className="text-sm font-medium capitalize">{property.purpose}</p>
                                    </div>
                                )}
                                {property.tenantDetails && (
                                    <div className="col-span-2 space-y-0.5 mt-1 pt-1 border-t border-blue-100">
                                        <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Tenant Details</span>
                                        <p className="text-sm font-medium">{property.tenantDetails}</p>
                                    </div>
                                )}
                                {property.specificRequirement && (
                                    <div className="col-span-2 space-y-0.5 mt-1 pt-1 border-t border-blue-100">
                                        <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Specific Requirements</span>
                                        <p className="text-sm font-medium italic">{property.specificRequirement}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
