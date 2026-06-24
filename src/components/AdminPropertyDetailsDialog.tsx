import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    MapPin,
    Home,
    User,
    Phone,
    Mail,
    Calendar,
    Clock,
    FileText,
    Shield,
    IndianRupee,
    Maximize,
    Briefcase,
    Info,
    CheckCircle2,
    Users,
    Image as ImageIcon
} from "lucide-react";
import { Property } from "@/services/propertyService";

interface TenantInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    paymentDueDate: string;
    monthlyRent: string;
    leaseStartDate: string;
    leaseEndDate: string;
    noticePeriod: string;
    emergencyContact: string;
    previousAddress: string;
    employmentStatus: string;
    employer: string;
    monthlyIncome: string;
    isMarried: boolean;
    spouse?: any;
    rentSchedule?: any[];
    isActive: boolean;
}

interface AdminPropertyDetailsDialogProps {
    property: Property | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

const AdminPropertyDetailsDialog: React.FC<AdminPropertyDetailsDialogProps> = ({
    property,
    isOpen,
    onOpenChange,
}) => {
    if (!property) return null;

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    const SectionTitle = ({ title, icon: Icon }: { title: string, icon: any }) => (
        <div className="flex items-center gap-2 mb-4 mt-6 border-b pb-2 text-blue-700">
            <Icon className="w-5 h-5" />
            <h3 className="font-semibold text-lg">{title}</h3>
        </div>
    );

    const DataRow = ({ label, value, icon: Icon, className }: { label: string, value: string | number | undefined | null, icon?: any, className?: string }) => (
        <div className={`flex flex-col py-2 ${className || ''}`}>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                {Icon && <Icon className="w-3 h-3" />}
                <span>{label}</span>
            </div>
            <div className="text-sm font-medium break-all break-words whitespace-pre-wrap">{value || "N/A"}</div>
        </div>
    );

    const hasImages = (property.images && property.images.length > 0) || (property.internalImages && property.internalImages.length > 0);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 border-b">
                    <div className="flex justify-between items-start pr-8">
                        <div>
                            <DialogTitle className="text-2xl font-bold mb-1">{property.title}</DialogTitle>
                            <DialogDescription className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {property.location || property.address}, {property.city}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant={property.listingType === 'sell' ? 'default' : 'secondary'} className="capitalize">
                                For {property.listingType}
                            </Badge>
                            {property.listingType === 'rent' && (
                                <Badge variant={property.rentalStatus === 'rented' || property.isRented ? 'destructive' : 'outline'} className="capitalize">
                                    {property.rentalStatus === 'rented' || property.isRented ? 'Rented' : 'Available'}
                                </Badge>
                            )}
                            {property.listingType === 'sell' && (
                                <Badge variant={property.isSold ? 'destructive' : 'outline'} className="capitalize">
                                    {property.isSold ? 'Sold' : 'Available'}
                                </Badge>
                            )}
                            <Badge variant={property.status === 'active' ? 'default' : 'secondary'} className="bg-green-100 text-green-800 border-green-200">
                                {property.status}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">

                        {/* Basic Info */}
                        <div className="md:col-span-3">
                            <SectionTitle title="Core Details" icon={Info} />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                                <DataRow label="Property Type" value={property.propertyType} icon={Home} />
                                <DataRow label="Configuration" value={property.configuration} />
                                <DataRow label="Unit Status" value={property.unitCondition} icon={CheckCircle2} />
                                <DataRow label="Project Condition" value={property.projectCondition} />
                                <DataRow label="Unit Number" value={property.unitNumber} />
                                <DataRow label="Floor" value={property.floor} />
                                <DataRow label="Bedrooms" value={property.configuration} />
                                <DataRow label="Property ID" value={property.id} />
                            </div>
                        </div>

                        {/* Property Photos Section */}
                        {hasImages && (
                            <div className="md:col-span-3">
                                <SectionTitle title="Property Photos" icon={ImageIcon} />
                                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                    {property.images && property.images.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main Images</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {property.images.map((img, index) => (
                                                    <div 
                                                        key={`main-${index}`} 
                                                        className="rounded-lg overflow-hidden border bg-white relative h-28 flex items-center justify-center group cursor-pointer" 
                                                        onClick={() => window.open(img, '_blank')}
                                                    >
                                                        <img
                                                            src={img}
                                                            alt={`Main ${index + 1}`}
                                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {property.internalImages && property.internalImages.length > 0 && (
                                        <div className={property.images && property.images.length > 0 ? "pt-4 border-t border-gray-200" : ""}>
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Internal Images</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {property.internalImages.map((img, index) => (
                                                    <div 
                                                        key={`internal-${index}`} 
                                                        className="rounded-lg overflow-hidden border bg-white relative h-28 flex items-center justify-center group cursor-pointer" 
                                                        onClick={() => window.open(img, '_blank')}
                                                    >
                                                        <img
                                                            src={img}
                                                            alt={`Internal ${index + 1}`}
                                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Area Details */}
                        <div className="md:col-span-3">
                            <SectionTitle title="Area & Pricing" icon={Maximize} />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50/50 p-4 rounded-lg">
                                <DataRow label="Carpet Area" value={property.carpetArea} />
                                <DataRow label="Constructed Area" value={property.constructedArea} />
                                <DataRow label="Listing Type" value={property.listingType} className="capitalize" />
                                {property.listingType === 'sell' ? (
                                    <DataRow label="Selling Price" value={property.sellingPrice ? `₹${property.sellingPrice}` : "N/A"} icon={IndianRupee} />
                                ) : (
                                    <DataRow label="Monthly Rent" value={property.monthlyRent ? `₹${property.monthlyRent}` : "N/A"} icon={IndianRupee} />
                                )}
                            </div>
                        </div>

                        {/* Tenant/Owner Info */}
                        <div className="lg:col-span-1">
                            <SectionTitle title={property.ownerRole === "agent" ? "Agent Details" : "Owner Details"} icon={User} />
                            <div className="space-y-1 bg-gray-50/30 p-3 rounded-lg border">
                                <DataRow label="Name" value={property.ownerName} />
                                <DataRow label="Email" value={property.ownerEmail} icon={Mail} />
                                <DataRow label="Phone" value={property.ownerPhone} icon={Phone} />
                                <DataRow label={property.ownerRole === "agent" ? "Agent ID" : "Owner ID"} value={property.ownerUID} />
                            </div>
                        </div>

                        {/* Current Person Info (Tenant/Lead) */}
                        <div className="md:col-span-3">
                            <SectionTitle title="Primary Contact (Tenant/Person)" icon={Phone} />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-orange-50/30 p-4 rounded-lg">
                                <DataRow label="Person Name" value={property.personName || property.tenantName} />
                                <DataRow label="Mobile Number" value={property.mobileNumber} />
                                <DataRow label="Primary No" value={property.primaryNo} />
                                <DataRow label="Alt No" value={property.ultNo} />
                            </div>
                        </div>

                        {/* Tenants List */}
                        {property.tenants && property.tenants.length > 0 && (
                            <div className="md:col-span-3">
                                <SectionTitle title="All Registered Tenants" icon={Users} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {property.tenants.map((tenant, idx) => (
                                        <div key={idx} className="border rounded-lg p-4 bg-blue-50/30">
                                            <div className="flex justify-between items-start mb-3 border-b pb-2">
                                                <div>
                                                    <h4 className="font-semibold text-base">{tenant.firstName} {tenant.lastName}</h4>
                                                    {tenant.email && (
                                                        <p className="text-xs text-muted-foreground break-all mt-0.5 flex items-center gap-1">
                                                            <Mail className="w-3 h-3 flex-shrink-0" />
                                                            <span>{tenant.email}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge variant={tenant.isActive ? "default" : "secondary"}>
                                                    {tenant.isActive ? "Active" : "Past"}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                                <DataRow label="Phone" value={tenant.phone} icon={Phone} />
                                                <DataRow label="Rent" value={tenant.monthlyRent ? `₹${tenant.monthlyRent}` : "N/A"} />
                                                <DataRow label="Due Date" value={tenant.paymentDueDate} />
                                                <DataRow label="Start Date" value={formatDate(tenant.leaseStartDate)} />
                                                <DataRow label="End Date" value={formatDate(tenant.leaseEndDate)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pre-leased Info */}
                        {property.isPreLeased && (
                            <div className="md:col-span-3">
                                <SectionTitle title="Pre-leased Details" icon={Briefcase} />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50/50 p-4 rounded-lg">
                                    <DataRow label="Asset Type" value={property.preLeasedType} className="capitalize" />
                                    <DataRow label="Agreement Term" value={property.agreementTerm} />
                                    <DataRow label="Lock-in Period" value={property.lockInPeriodPreLeased} />
                                    <DataRow label="Monthly Income" value={property.rentalIncome ? `₹${property.rentalIncome}` : "N/A"} />
                                    <DataRow label="Escalation" value={property.escalation} />
                                    <DataRow label="Agreement Start" value={formatDate(property.agreementStartDate)} />
                                    <DataRow label="Purpose" value={property.purpose} className="capitalize" />
                                    <div className="col-span-2">
                                        <DataRow label="Tenant Details" value={property.tenantDetails} />
                                    </div>
                                    <div className="col-span-2">
                                        <DataRow label="Specific Requirements" value={property.specificRequirement} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Buyers List */}
                        {property.buyers && property.buyers.length > 0 && (
                            <div className="md:col-span-3">
                                <SectionTitle title="Interested Buyers" icon={Users} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {property.buyers.map((buyer, idx) => (
                                        <div key={idx} className="border rounded-lg p-4 bg-green-50/30">
                                            <div className="flex justify-between items-start mb-3 border-b pb-2">
                                                <div>
                                                    <h4 className="font-semibold text-base">{buyer.firstName} {buyer.lastName}</h4>
                                                    {buyer.email && (
                                                        <p className="text-xs text-muted-foreground break-all mt-0.5 flex items-center gap-1">
                                                            <Mail className="w-3 h-3 flex-shrink-0" />
                                                            <span>{buyer.email}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge variant={buyer.isActive ? "default" : "secondary"}>
                                                    {buyer.isActive ? "Active" : "Closed"}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                                <DataRow label="Phone" value={buyer.phone} icon={Phone} />
                                                <DataRow label="Offer" value={buyer.offerAmount ? `₹${buyer.offerAmount}` : "N/A"} />
                                                <DataRow label="Closing" value={formatDate(buyer.closingDate)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Agreement Details */}
                        {property.listingType === 'rent' && (
                            <div className="md:col-span-3">
                                <SectionTitle title="Agreement & Security" icon={Shield} />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-orange-50/50 p-4 rounded-lg">
                                    <DataRow label="Security Deposit" value={property.securityDeposit ? `₹${property.securityDeposit}` : "N/A"} />
                                    <DataRow label="Agreement Period" value={property.agreementPeriod} />
                                    <DataRow label="Start Date" value={formatDate(property.agreementStartDate)} icon={Calendar} />
                                    <DataRow label="End Date" value={formatDate(property.agreementEndDate)} icon={Calendar} />
                                    <DataRow label="Notice Period" value={property.noticePeriod} icon={Clock} />
                                    <DataRow label="Lock-in Period" value={property.lockInPeriod} />
                                    <DataRow label="Rent Due Date" value={property.paymentDueDate} />
                                    <DataRow label="Escalation" value={property.escalationPercentage ? `${property.escalationPercentage}%` : property.escalationAmount} />
                                </div>
                            </div>
                        )}

                        {/* Furnished Checklist */}
                        {property.furnishedChecklist && property.furnishedChecklist.length > 0 && (
                            <div className="md:col-span-3">
                                <SectionTitle title="Furnished Checklist" icon={CheckCircle2} />
                                <div className="flex flex-wrap gap-2">
                                    {property.furnishedChecklist.map((item: any, idx) => (
                                        <Badge key={idx} variant="outline" className="bg-white">
                                            {typeof item === 'string' ? item : item.name || JSON.stringify(item)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <div className="md:col-span-3">
                            <SectionTitle title="Specific Comments" icon={FileText} />
                            <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                                {property.specificComments || "No specific comments."}
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="md:col-span-3 mt-4 pt-4 border-t flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                            <span>Created: {formatDate(property.createdAt)}</span>
                            <span>Last Updated: {formatDate(property.updatedAt)}</span>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default AdminPropertyDetailsDialog;
