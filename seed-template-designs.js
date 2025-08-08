import { neon } from '@neondatabase/serverless';

async function seedTemplateDesigns() {
  const sql = neon(process.env.DATABASE_URL);

  try {
    
    // Sample design themes for templates
    const modernTheme = {
      // Modern theme styling
      containerWidth: 700,
      containerHeight: 850,
      containerBorderRadius: 20,
      containerShadow: "xl",
      containerBorderWidth: 0,
      containerBorderColor: "#E5E7EB",
      backgroundColor: "#FFFFFF",
      fontFamily: "inter",
      fontSize: "base",
      fontWeight: "medium",
      textColor: "#1F2937",
      primaryColor: "#3B82F6",
      buttonStyle: "rounded",
      buttonBorderRadius: 12,
      buttonPadding: "lg",
      buttonFontWeight: "semibold",
      buttonShadow: "md",
      buttonBackgroundColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
      buttonBorderWidth: 0,
      buttonBorderColor: "#3B82F6",
      buttonHoverBackgroundColor: "#2563EB",
      buttonHoverTextColor: "#FFFFFF",
      buttonHoverBorderColor: "#2563EB",
      inputBorderRadius: 12,
      inputBorderWidth: 2,
      inputBorderColor: "#E5E7EB",
      inputFocusColor: "#3B82F6",
      inputPadding: "lg",
      inputBackgroundColor: "#F9FAFB",
      inputShadow: "sm",
      inputFontSize: "base",
      inputTextColor: "#1F2937",
      inputHeight: 48,
      inputWidth: "full",
      multiChoiceImageSize: "lg",
      multiChoiceImageShadow: "md",
      multiChoiceImageBorderRadius: 12,
      multiChoiceCardBorderRadius: 12,
      multiChoiceCardShadow: "md",
      multiChoiceCardPadding: 16,
      multiChoiceCardMargin: 8,
      multiChoiceCardBorderWidth: 2,
      multiChoiceCardBorderColor: "#E5E7EB",
      multiChoiceCardBackgroundColor: "#FFFFFF",
      multiChoiceCardActiveBackgroundColor: "#EFF6FF",
      multiChoiceCardActiveBorderColor: "#3B82F6",
      multiChoiceCardHoverBackgroundColor: "#F8FAFC",
      multiChoiceCardHoverBorderColor: "#CBD5E1",
      sliderTrackColor: "#E5E7EB",
      sliderThumbColor: "#3B82F6",
      sliderTrackHeight: 6,
      sliderThumbSize: 20,
      sliderBorderRadius: 12,
      dropdownBorderRadius: 12,
      dropdownBorderWidth: 2,
      dropdownBorderColor: "#E5E7EB",
      dropdownBackgroundColor: "#F9FAFB",
      dropdownShadow: "sm",
      dropdownPadding: 12,
      dropdownHeight: 48,
      pricingCardBorderRadius: 16,
      pricingCardShadow: "lg",
      pricingCardPadding: 24,
      pricingCardMargin: 16,
      pricingCardBorderWidth: 0,
      pricingCardBorderColor: "#E5E7EB",
      pricingCardBackgroundColor: "#FFFFFF",
      pricingPriceSize: "xl",
      pricingPriceColor: "#1F2937",
      pricingPriceWeight: "bold",
      pricingDescriptionSize: "sm",
      pricingDescriptionColor: "#6B7280",
      questionCardBorderRadius: 12,
      questionCardShadow: "md",
      questionCardPadding: 20,
      questionCardMargin: 12,
      questionCardBorderWidth: 0,
      questionCardBorderColor: "#E5E7EB",
      questionCardBackgroundColor: "#FFFFFF",
      questionTitleSize: "lg",
      questionTitleColor: "#1F2937",
      questionTitleWeight: "semibold",
      questionDescriptionSize: "sm",
      questionDescriptionColor: "#6B7280",
      formAnimationEnabled: true,
      formAnimationDuration: 300,
      formAnimationStyle: "slide"
    };

    const modernComponentStyles = {
      serviceSelector: {
        borderColor: "#E5E7EB",
        borderWidth: 2,
        backgroundColor: "#FFFFFF",
        activeBackgroundColor: "#EFF6FF",
        activeBorderColor: "#3B82F6",
        hoverBackgroundColor: "#F8FAFC",
        hoverBorderColor: "#CBD5E1",
        shadow: "md",
        height: 80,
        width: "full",
        padding: 16,
        margin: 8,
        borderRadius: 12,
        iconPosition: "top",
        iconSize: 32,
        showImage: true,
        fontSize: "base",
        textColor: "#1F2937",
        selectedTextColor: "#3B82F6"
      },
      textInput: {
        borderColor: "#E5E7EB",
        borderWidth: 2,
        backgroundColor: "#F9FAFB",
        shadow: "sm",
        height: 48,
        width: "full",
        padding: 12,
        margin: 8,
        borderRadius: 12,
        fontSize: "base",
        textColor: "#1F2937"
      },
      dropdown: {
        borderColor: "#E5E7EB",
        borderWidth: 2,
        backgroundColor: "#F9FAFB",
        shadow: "sm",
        height: 48,
        width: "full",
        padding: 12,
        margin: 8,
        borderRadius: 12,
        fontSize: "base",
        textColor: "#1F2937"
      },
      multipleChoice: {
        borderColor: "#E5E7EB",
        borderWidth: 2,
        backgroundColor: "#FFFFFF",
        activeBackgroundColor: "#EFF6FF",
        activeBorderColor: "#3B82F6",
        hoverBackgroundColor: "#F8FAFC",
        hoverBorderColor: "#CBD5E1",
        shadow: "md",
        height: 120,
        width: "200px",
        padding: 16,
        margin: 8,
        borderRadius: 12,
        showImage: true
      },
      pricingCard: {
        borderColor: "#E5E7EB",
        borderWidth: 0,
        backgroundColor: "#FFFFFF",
        shadow: "lg",
        height: 200,
        width: "full",
        padding: 24,
        margin: 16,
        borderRadius: 16
      }
    };

    // Update first template with modern blue theme
    await sql`
      UPDATE formula_templates 
      SET template_styling = ${JSON.stringify(modernTheme)}, template_component_styles = ${JSON.stringify(modernComponentStyles)} 
      WHERE id = 1
    `;
    
    console.log(`Updated template 1 with modern blue theme`);

    // Create a green theme for template 2
    const greenTheme = {
      ...modernTheme,
      primaryColor: "#10B981",
      buttonBackgroundColor: "#10B981",
      buttonBorderColor: "#10B981",
      buttonHoverBackgroundColor: "#059669",
      buttonHoverBorderColor: "#059669",
      inputFocusColor: "#10B981",
      multiChoiceCardActiveBorderColor: "#10B981",
      sliderThumbColor: "#10B981"
    };

    const greenComponentStyles = {
      ...modernComponentStyles,
      serviceSelector: {
        ...modernComponentStyles.serviceSelector,
        activeBorderColor: "#10B981",
        selectedTextColor: "#10B981"
      },
      multipleChoice: {
        ...modernComponentStyles.multipleChoice,
        activeBorderColor: "#10B981"
      }
    };

    await sql`
      UPDATE formula_templates 
      SET template_styling = ${JSON.stringify(greenTheme)}, template_component_styles = ${JSON.stringify(greenComponentStyles)} 
      WHERE id = 2
    `;
    
    console.log(`Updated template 2 with green theme`);

    // Create a purple theme for template 3
    const purpleTheme = {
      ...modernTheme,
      primaryColor: "#8B5CF6",
      buttonBackgroundColor: "#8B5CF6",
      buttonBorderColor: "#8B5CF6",
      buttonHoverBackgroundColor: "#7C3AED",
      buttonHoverBorderColor: "#7C3AED",
      inputFocusColor: "#8B5CF6",
      multiChoiceCardActiveBorderColor: "#8B5CF6",
      sliderThumbColor: "#8B5CF6"
    };

    const purpleComponentStyles = {
      ...modernComponentStyles,
      serviceSelector: {
        ...modernComponentStyles.serviceSelector,
        activeBorderColor: "#8B5CF6",
        selectedTextColor: "#8B5CF6"
      },
      multipleChoice: {
        ...modernComponentStyles.multipleChoice,
        activeBorderColor: "#8B5CF6"
      }
    };

    await sql`
      UPDATE formula_templates 
      SET template_styling = ${JSON.stringify(purpleTheme)}, template_component_styles = ${JSON.stringify(purpleComponentStyles)} 
      WHERE id = 3
    `;
    
    console.log(`Updated template 3 with purple theme`);

    console.log('Template design seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding template designs:', error);
  } finally {
    // No need to close neon connection
  }
}

// Run the seeding
seedTemplateDesigns().catch(console.error);