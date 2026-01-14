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
  businessOwnerId: string;
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
  businessOwnerId,
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
  const [usage, setUsage] = useState<{
    dailyLimit: number;
    used: number;
    remaining: number;
    plan: string;
    resetsAt: string;
  } | null>(null);
  const { toast } = useToast();

  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions to keep under 2MB target
          const maxDimension = 2048; // Max width or height
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          }, 'image/jpeg', 0.85); // 85% quality
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const combinedFiles = [...selectedFiles, ...files];

    if (combinedFiles.length > 5) {
      toast({
        title: "Too many files",
        description: `You can only upload up to 5 photos total. You currently have ${selectedFiles.length} photo(s) selected.`,
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }

    // Validate file sizes
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB before compression
        toast({
          title: "File too large",
          description: `${file.name} is too large. Please select images under 10MB.`,
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }
    }

    // Compress images
    try {
      const compressedFiles = await Promise.all(files.map(file => compressImage(file)));
      setSelectedFiles([...selectedFiles, ...compressedFiles]);
      setResult(null); // Clear old results
    } catch (error) {
      toast({
        title: "Compression failed",
        description: "Failed to process images. Please try different files.",
        variant: "destructive"
      });
    }

    e.target.value = '';
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
    setResult(null); // Clear old results when starting new analysis

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
          customerImages: customerImages,
          businessOwnerId: businessOwnerId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorTitle = "Analysis failed";
        let errorDescription = errorData.message || 'Please try again';

        // Provide specific error guidance
        if (response.status === 400) {
          errorTitle = "Configuration error";
          errorDescription = errorData.message || "This calculator may not be configured correctly";
        } else if (response.status === 404) {
          errorTitle = "Not found";
          errorDescription = errorData.message || "This calculator may be misconfigured";
        } else if (response.status === 429) {
          // Check if this is a daily limit error or rate limit error
          if (errorData.dailyLimit !== undefined) {
            // Daily limit reached (business owner's limit)
            errorTitle = "Daily limit reached";
            errorDescription = errorData.message || `This business has reached their daily photo measurement limit. Please try again tomorrow or contact the business owner.`;

            // Update usage state to show on UI
            if (errorData.dailyLimit && errorData.used !== undefined) {
              setUsage({
                dailyLimit: errorData.dailyLimit,
                used: errorData.used,
                remaining: 0,
                plan: errorData.plan,
                resetsAt: new Date().toISOString() // Will be corrected on next successful call
              });
            }
          } else {
            // Rate limit (too many requests in short time)
            errorTitle = "Too many requests";
            errorDescription = errorData.message || "Please wait a few minutes before trying again";
          }
        } else if (errorData.message?.includes('too large')) {
          errorTitle = "Image too large";
          errorDescription = errorData.message;
        } else if (errorData.message?.includes('service is not configured')) {
          errorTitle = "Service unavailable";
          errorDescription = "Photo measurement is temporarily unavailable";
        } else if (errorData.message?.includes('unreasonably large')) {
          errorTitle = "Invalid measurement";
          errorDescription = "Please try again with clearer photos showing more reference objects (doors, windows, etc.)";
        }

        // Show the error title in toast
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive"
        });

        throw new Error(errorDescription);
      }

      const data = await response.json();
      setResult({
        estimatedValue: data.value,
        estimatedUnit: data.unit,
        confidence: data.confidence,
        explanation: data.explanation,
        warnings: data.warnings || []
      });

      // Update usage information if provided
      if (data.usage) {
        setUsage(data.usage);
      }

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
        description: `Estimated ${setup.measurementType}: ${data.value} ${data.unit}${data.usage ? ` (${data.usage.remaining} remaining today)` : ''}`,
      });
    } catch (error) {
      console.error('Error analyzing photos:', error);
      // Error toast already shown in error handling above
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

          {usage && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">
                  Daily measurements: {usage.used} / {usage.dailyLimit}
                </p>
                <p className={`text-xs font-semibold ${usage.remaining > 5 ? 'text-green-600' : usage.remaining > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {usage.remaining} remaining
                </p>
              </div>
              {usage.remaining === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Daily limit reached. Upgrade your plan for more measurements.
                </p>
              )}
            </div>
          )}

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
              disabled={isAnalyzing || selectedFiles.length === 0 || (usage !== null && usage.remaining === 0)}
              className="w-full"
              data-testid="button-analyze-photos"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : usage !== null && usage.remaining === 0 ? (
                <>
                  Daily Limit Reached
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
                  <p className="text-sm text-green-700 mb-2">
                    Confidence: {result.confidence}%
                  </p>
                  <p className="text-sm text-gray-700">
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
