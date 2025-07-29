import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EnhancedVariableInput from "@/components/enhanced-variable-input";
import { Variable, StylingOptions } from "@shared/schema";

interface Section {
  title: string;
  variables: Variable[];
}

interface StepByStepFormProps {
  variables: Variable[];
  values: Record<string, any>;
  onChange: (variableId: string, value: any) => void;
  styling: StylingOptions;
  onComplete?: () => void;
  className?: string;
}

export default function StepByStepForm({
  variables,
  values,
  onChange,
  styling,
  onComplete,
  className = ""
}: StepByStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentVariables, setCurrentVariables] = useState<Variable[]>([]);

  // Group variables into sections or individual questions
  useEffect(() => {
    if (styling.showOneSectionAtTime) {
      // Group by section titles or create logical groups
      const sectionGroups: Record<string, Variable[]> = {};
      variables.forEach(variable => {
        // Use variable name prefix or a custom section field if available
        // For now, we'll group every 3-4 variables as a section
        const sectionIndex = Math.floor(variables.indexOf(variable) / 3);
        const sectionTitle = `Step ${sectionIndex + 1}`;
        
        if (!sectionGroups[sectionTitle]) {
          sectionGroups[sectionTitle] = [];
        }
        sectionGroups[sectionTitle].push(variable);
      });

      const newSections = Object.entries(sectionGroups).map(([title, vars]) => ({
        title,
        variables: vars
      }));
      
      setSections(newSections);
      setCurrentVariables(newSections[0]?.variables || []);
    } else if (styling.showOneQuestionAtTime) {
      // Each variable is its own step
      const newSections = variables.map((variable, index) => ({
        title: `Question ${index + 1}`,
        variables: [variable]
      }));
      
      setSections(newSections);
      setCurrentVariables(variables.length > 0 ? [variables[0]] : []);
    } else {
      // Show all variables at once (normal behavior)
      setSections([{ title: "All Questions", variables }]);
      setCurrentVariables(variables);
    }
  }, [variables, styling.showOneQuestionAtTime, styling.showOneSectionAtTime]);

  const canProceedToNext = () => {
    if (!styling.showOneQuestionAtTime && !styling.showOneSectionAtTime) {
      return true;
    }

    // Check if current step variables are answered
    return currentVariables.every(variable => {
      const value = values[variable.id];
      if (value === undefined || value === null || value === '') return false;
      
      // Additional validation based on variable type
      if (variable.type === 'multiple-choice' && Array.isArray(value)) {
        return value.length > 0;
      }
      
      return true;
    });
  };

  const handleNext = () => {
    if (!canProceedToNext()) return;

    if (styling.requireNextButtonClick || !canAutoAdvance()) {
      proceedToNext();
    }
  };

  const canAutoAdvance = () => {
    // Only auto-advance for simple input types
    const simpleTypes = ['text', 'number', 'checkbox', 'dropdown', 'select'];
    return currentVariables.every(variable => simpleTypes.includes(variable.type));
  };

  const proceedToNext = () => {
    const nextStep = currentStep + 1;
    if (nextStep < sections.length) {
      setCurrentStep(nextStep);
      setCurrentVariables(sections[nextStep].variables);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    const prevStep = currentStep - 1;
    if (prevStep >= 0) {
      setCurrentStep(prevStep);
      setCurrentVariables(sections[prevStep].variables);
    }
  };

  const handleVariableChange = (variableId: string, value: any) => {
    onChange(variableId, value);
    
    // Auto-advance if enabled and conditions are met
    if (!styling.requireNextButtonClick && canAutoAdvance()) {
      setTimeout(() => {
        if (canProceedToNext()) {
          proceedToNext();
        }
      }, 500); // Small delay for better UX
    }
  };

  const getAnimationClasses = () => {
    const baseClasses = "transition-all duration-500 ease-in-out";
    
    switch (styling.formAnimationStyle) {
      case 'slide':
        return `${baseClasses} transform`;
      case 'fade':
        return `${baseClasses} opacity-100`;
      case 'scale':
        return `${baseClasses} transform scale-100`;
      default:
        return "";
    }
  };

  const isStepByStep = styling.showOneQuestionAtTime || styling.showOneSectionAtTime;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress indicator */}
      {isStepByStep && sections.length > 1 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
          />
        </div>
      )}

      {/* Current step content */}
      <Card className={getAnimationClasses()}>
        <CardContent className="p-6">
          {isStepByStep && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">
                {sections[currentStep]?.title}
              </h3>
              <p className="text-sm text-gray-600">
                Step {currentStep + 1} of {sections.length}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {currentVariables.map((variable) => (
              <div key={variable.id} className="space-y-2">
                <EnhancedVariableInput
                  variable={variable}
                  value={values[variable.id]}
                  onChange={(value) => handleVariableChange(variable.id, value)}
                  styling={styling}
                  allVariables={variables}
                  currentValues={values}
                />
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          {isStepByStep && (
            <div className="flex justify-between items-center mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="text-sm text-gray-500">
                {currentStep + 1} / {sections.length}
              </div>

              {styling.requireNextButtonClick ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="flex items-center gap-2"
                  style={{ backgroundColor: styling.primaryColor }}
                >
                  {currentStep < sections.length - 1 ? (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    "Complete"
                  )}
                </Button>
              ) : (
                <div className="text-xs text-gray-400">
                  {canProceedToNext() ? "Will auto-advance..." : "Please answer to continue"}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}