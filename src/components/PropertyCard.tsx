import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface Property {
  id: string;
  title: string;
  price: string;
  location: string;
  image?: string;
  type: "sale" | "rent";
}

interface PropertyCardProps {
  property: Property;
  ctaLabel?: string;
  onAction?: (id: string) => void;
}

const PropertyCard = ({ property, ctaLabel = "View", onAction }: PropertyCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-elegant transition-shadow">
      <div className="aspect-[16/10] w-full bg-secondary" aria-hidden>
        {property.image ? (
          <img
            src={property.image}
            alt={`${property.title} in ${property.location}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <CardHeader>
        <CardTitle className="text-lg">{property.title}</CardTitle>
        <p className="text-muted-foreground">{property.location}</p>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="font-semibold">{property.price}</div>
        <Button variant="secondary" onClick={() => onAction?.(property.id)}>{ctaLabel}</Button>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
