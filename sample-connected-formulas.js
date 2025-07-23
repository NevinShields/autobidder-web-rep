// Sample formulas with connected variables for demonstration
// This shows how house washing and gutter cleaning can share common variables

const housePaintingFormula = {
  name: "House Painting",
  title: "Professional House Painting Service",
  variables: [
    {
      id: "house_sqft",
      name: "House Square Footage",
      type: "number",
      unit: "sq ft",
      connectionKey: "house_sqft", // Shared variable
      defaultValue: 2000
    },
    {
      id: "property_height",
      name: "Property Height",
      type: "dropdown",
      connectionKey: "property_height", // Shared variable
      options: [
        { label: "Single Story", value: "single", numericValue: 1 },
        { label: "Two Story", value: "two", numericValue: 1.3 },
        { label: "Three Story", value: "three", numericValue: 1.6 }
      ]
    },
    {
      id: "paint_quality",
      name: "Paint Quality",
      type: "dropdown",
      options: [
        { label: "Standard", value: "standard", numericValue: 1 },
        { label: "Premium", value: "premium", numericValue: 1.4 },
        { label: "Ultra Premium", value: "ultra", numericValue: 1.8 }
      ]
    }
  ],
  formula: "house_sqft * 4.5 * property_height * paint_quality"
};

const gutterCleaningFormula = {
  name: "Gutter Cleaning",
  title: "Professional Gutter Cleaning Service", 
  variables: [
    {
      id: "house_sqft_gutter",
      name: "House Square Footage", 
      type: "number",
      unit: "sq ft",
      connectionKey: "house_sqft", // Same connection key as house painting
      defaultValue: 2000
    },
    {
      id: "property_height_gutter",
      name: "Property Height",
      type: "dropdown", 
      connectionKey: "property_height", // Same connection key as house painting
      options: [
        { label: "Single Story", value: "single", numericValue: 1 },
        { label: "Two Story", value: "two", numericValue: 1.5 },
        { label: "Three Story", value: "three", numericValue: 2 }
      ]
    },
    {
      id: "gutter_condition",
      name: "Gutter Condition",
      type: "dropdown",
      options: [
        { label: "Clean/New", value: "clean", numericValue: 1 },
        { label: "Moderately Dirty", value: "moderate", numericValue: 1.2 },
        { label: "Very Dirty/Clogged", value: "dirty", numericValue: 1.5 }
      ]
    }
  ],
  formula: "(house_sqft_gutter / 100) * 35 * property_height_gutter * gutter_condition"
};

const windowCleaningFormula = {
  name: "Window Cleaning",
  title: "Professional Window Cleaning Service",
  variables: [
    {
      id: "property_height_windows", 
      name: "Property Height",
      type: "dropdown",
      connectionKey: "property_height", // Same connection key 
      options: [
        { label: "Single Story", value: "single", numericValue: 1 },
        { label: "Two Story", value: "two", numericValue: 1.4 },
        { label: "Three Story", value: "three", numericValue: 1.8 }
      ]
    },
    {
      id: "window_count",
      name: "Number of Windows",
      type: "number",
      unit: "windows",
      defaultValue: 20
    },
    {
      id: "window_type",
      name: "Window Type", 
      type: "dropdown",
      options: [
        { label: "Standard Windows", value: "standard", numericValue: 1 },
        { label: "Large/Bay Windows", value: "large", numericValue: 1.3 },
        { label: "French Doors/Sliding", value: "doors", numericValue: 1.2 }
      ]
    }
  ],
  formula: "window_count * 8 * property_height_windows * window_type"
};

console.log("Sample formulas with connected variables:");
console.log("- house_sqft: shared between House Painting and Gutter Cleaning");
console.log("- property_height: shared between all three services");
console.log("\nThis demonstrates how customers won't be asked the same questions multiple times when selecting multiple services.");