import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import PropertyTypeSelector from "@/components/PropertyTypeSelector";

const SelectPropertyType = () => {
  const navigate = useNavigate();

  const handlePropertyTypeSelect = (propertyType: string) => {
    navigate(`/add-property?type=${propertyType}`);
  };

  return (
    <main>
      <Helmet>
        <title>Select Property Type — Add Property</title>
        <meta name="description" content="Choose between residential, commercial, or industrial property types to add your property listing." />
        <link rel="canonical" href="/select-property-type" />
      </Helmet>

      <PropertyTypeSelector
        onSelect={handlePropertyTypeSelect}
        title="What kind of property would you like to add today?"
        description="Choose the type of property you want to include in your portfolio."
      />
    </main>
  );
};

export default SelectPropertyType;