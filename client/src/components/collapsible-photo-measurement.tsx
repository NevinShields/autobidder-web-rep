import { useState, useCallback, memo } from 'react';
import { Camera, ChevronUp, ChevronDown, Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PhotoMeasurementSetup {
  objectDescription: string;
  measurementType: 'area' | 'length' | 'width' | 'height' | 'perimeter';
  referenceImages: Array<{
    image: string;
    description: string;
    measurement: string;
    unit: string;
  }>;
}

interface CollapsiblePhotoMeasurementProps {
  setup: PhotoMeasurementSetup;
  formulaName?: string;
  onMeasurementComplete: (measurement: { 
    value: number; 
    unit: string;
    fullData?: {
      setupConfig: PhotoMeasurementSetup;
      customerImageUrls: string[];
      estimatedValue: number;
      estimatedUnit: string;
      confidence: number;
      explanation: string;
      warnings: string[];
      formulaName?: string;
    }
  }) => void;
}

export const CollapsiblePhotoMeasurement = memo(function CollapsiblePhotoMeasurement({ 
  setup, 
  formulaName,
  onMeasurementComplete 
}: CollapsiblePhotoMeasurementProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    estimatedValue: number;
    estimatedUnit: string;
    confidence: number;
    explanation: string;
    warnings: string[];
  } | null>(null);
  const { toast } = useToast();

  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      toast({
        title: "Too many files",
        description: "Please select up to 5 photos",
        variant: "destructive"
      });
      return;
    }
    setSelectedFiles(files);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No photos selected",
        description: "Please select at least one photo",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Convert files to base64
      const imagePromises = selectedFiles.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const customerImages = await Promise.all(imagePromises);

      const response = await fetch('/api/photo-measurement/analyze-with-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setupConfig: setup,
          customerImages: customerImages
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Analysis failed');
      }

      const data = await response.json();
      setResult({
        estimatedValue: data.value,
        estimatedUnit: data.unit,
        confidence: data.confidence,
        explanation: data.explanation,
        warnings: data.warnings || []
      });

      onMeasurementComplete({
        value: data.value,
        unit: data.unit,
        fullData: {
          setupConfig: setup,
          customerImageUrls: customerImages,
          estimatedValue: data.value,
          estimatedUnit: data.unit,
          confidence: data.confidence,
          explanation: data.explanation,
          warnings: data.warnings || [],
          formulaName
        }
      });

      toast({
        title: "Analysis complete!",
        description: `Estimated ${setup.measurementType}: ${data.value} ${data.unit}`,
      });
    } catch (error) {
      console.error('Error analyzing photos:', error);
      toast({
        title: "Analysis failed",
        description: "Please try again or use different photos",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMeasurementTypeLabel = () => {
    const labels: Record<string, string> = {
      area: 'Area',
      length: 'Length',
      width: 'Width',
      height: 'Height',
      perimeter: 'Perimeter'
    };
    return labels[setup.measurementType] || 'Measurement';
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={toggleExpanded}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
        data-testid="button-toggle-photo-measurement"
      >
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">
            AI Measure Tool - {getMeasurementTypeLabel()}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        )}
      </button>
      
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-gray-700">
              <strong>What to photograph:</strong> {setup.customerInstructions || setup.objectDescription}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Upload 1-5 clear photos from different angles for best results
            </p>
          </div>

          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                multiple
                max={5}
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  Click to upload photos
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG, WEBP (up to 5 photos)
                </span>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Selected files ({selectedFiles.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="bg-gray-100 px-3 py-1 rounded-md text-xs text-gray-700">
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || selectedFiles.length === 0}
              className="w-full"
              data-testid="button-analyze-photos"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Analyze Photos
                </>
              )}
            </Button>
          </div>

          {result && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-green-700 uppercase tracking-wide font-medium mb-1">
                    Estimated {getMeasurementTypeLabel()}
                  </p>
                  <p className="text-4xl font-bold text-green-900 mb-2">
                    {result.estimatedValue} <span className="text-2xl font-semibold">{result.estimatedUnit}</span>
                  </p>
                  <p className="text-sm text-green-700">
                    Confidence: {result.confidence}%
                  </p>
                  <p className="text-base font-medium text-green-900 mt-3">
                    Estimated {getMeasurementTypeLabel()}: <span className="text-2xl font-bold">{result.estimatedValue} {result.estimatedUnit}</span>
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    {result.explanation}
                  </p>
                </div>
              </div>

              {result.warnings.length > 0 && (
                <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900">Notes:</p>
                    <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                      {result.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
