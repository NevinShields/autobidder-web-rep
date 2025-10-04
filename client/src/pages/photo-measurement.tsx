import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, X, Ruler, AlertCircle, CheckCircle2, Loader2, Settings, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ReferenceImage {
  image: string;
  description: string;
  measurement: string;
  unit: string;
}

interface SetupConfig {
  objectDescription: string; // Context and average dimensions
  referenceImages: ReferenceImage[]; // Up to 5 training examples
}

interface MeasurementResult {
  value: number;
  unit: string;
  confidence: number;
  explanation: string;
  warnings: string[];
}

export default function PhotoMeasurement() {
  const [activeView, setActiveView] = useState<"setup" | "customer">("setup");
  
  // Setup View State
  const [setupConfig, setSetupConfig] = useState<SetupConfig>({
    objectDescription: "",
    referenceImages: [],
  });

  // Customer View State
  const [customerImages, setCustomerImages] = useState<string[]>([]);
  const [measurementType, setMeasurementType] = useState<'area' | 'length' | 'width' | 'height' | 'perimeter'>("area");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MeasurementResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Setup View Handlers
  const handleSetupImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const availableSlots = 5 - setupConfig.referenceImages.length;
    const filesToProcess = Array.from(files).slice(0, availableSlots);
    
    if (filesToProcess.length === 0) return;

    const newRefImages: ReferenceImage[] = [];
    let processed = 0;

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newRefImages.push({
            image: event.target.result as string,
            description: "",
            measurement: "",
            unit: "feet",
          });
        }
        processed++;
        if (processed === filesToProcess.length) {
          setSetupConfig(prev => ({
            ...prev,
            referenceImages: [...prev.referenceImages, ...newRefImages],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSetupImage = (index: number) => {
    setSetupConfig(prev => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((_, i) => i !== index),
    }));
  };

  const updateReferenceImage = (index: number, field: keyof ReferenceImage, value: string) => {
    setSetupConfig(prev => ({
      ...prev,
      referenceImages: prev.referenceImages.map((img, i) => 
        i === index ? { ...img, [field]: value } : img
      ),
    }));
  };

  // Customer View Handlers
  const handleCustomerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const availableSlots = 5 - customerImages.length;
    const filesToProcess = Array.from(files).slice(0, availableSlots);
    
    if (filesToProcess.length === 0) return;

    const newImages: string[] = [];
    let processed = 0;

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
        }
        processed++;
        if (processed === filesToProcess.length) {
          setCustomerImages([...customerImages, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeCustomerImage = (index: number) => {
    setCustomerImages(customerImages.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    setError(null);
    setResult(null);

    // Validation
    if (customerImages.length === 0) {
      setError("Please upload at least one image of the object");
      return;
    }

    if (!setupConfig.objectDescription.trim()) {
      setError("Please configure the Setup View first with an object description");
      return;
    }

    if (setupConfig.referenceImages.length === 0) {
      setError("Please add at least one reference image in the Setup View");
      return;
    }

    // Validate all reference images have required fields
    for (let i = 0; i < setupConfig.referenceImages.length; i++) {
      const ref = setupConfig.referenceImages[i];
      if (!ref.description.trim() || !ref.measurement.trim()) {
        setError(`Reference image ${i + 1} is missing description or measurement`);
        return;
      }
      const measurement = parseFloat(ref.measurement);
      if (isNaN(measurement) || measurement <= 0) {
        setError(`Reference image ${i + 1} measurement must be a positive number`);
        return;
      }
    }

    setIsAnalyzing(true);

    try {
      const response = await apiRequest(
        "POST",
        "/api/photo-measurement/analyze-with-setup",
        {
          setupConfig,
          customerImages,
          measurementType,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || "Failed to analyze images");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <Ruler className="w-8 h-8" />
              Photo-Based Measurement Tool
            </CardTitle>
            <CardDescription className="text-blue-100">
              Setup training data and test customer measurement flow
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "setup" | "customer")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="setup" className="flex items-center gap-2" data-testid="tab-setup">
                  <Settings className="w-4 h-4" />
                  Setup View (Business Owner)
                </TabsTrigger>
                <TabsTrigger value="customer" className="flex items-center gap-2" data-testid="tab-customer">
                  <User className="w-4 h-4" />
                  Customer View
                </TabsTrigger>
              </TabsList>

              {/* SETUP VIEW */}
              <TabsContent value="setup" className="space-y-6">
                <Alert>
                  <AlertDescription>
                    <strong>Setup View:</strong> Configure the AI training for a specific object type (e.g., house, deck, patio).
                    Add context, average dimensions, and reference images with measurements.
                  </AlertDescription>
                </Alert>

                {/* Object Description */}
                <div>
                  <Label htmlFor="object-description" className="text-base font-semibold">
                    Object Description & Context
                  </Label>
                  <Textarea
                    id="object-description"
                    placeholder="e.g., House exterior for washing. Average single-story house is 1,500-2,000 sq ft. Two-story homes are typically 2,500-3,500 sq ft. Include details about siding type, height, etc."
                    value={setupConfig.objectDescription}
                    onChange={(e) => setSetupConfig(prev => ({ ...prev, objectDescription: e.target.value }))}
                    className="mt-2 min-h-[120px]"
                    data-testid="textarea-object-description"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Describe the object type and include average dimensions to help the AI understand what it's measuring
                  </p>
                </div>

                {/* Reference Images */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Training Reference Images ({setupConfig.referenceImages.length}/5)
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                    Upload example images with known measurements. Each image should show the object with clear reference points.
                  </p>

                  {/* Reference Image Grid */}
                  <div className="space-y-4">
                    {setupConfig.referenceImages.map((refImg, index) => (
                      <Card key={index} className="p-4 bg-purple-50 dark:bg-purple-950/20 border-purple-200">
                        <div className="flex gap-4">
                          {/* Image Preview */}
                          <div className="relative flex-shrink-0">
                            <img
                              src={refImg.image}
                              alt={`Reference ${index + 1}`}
                              className="w-32 h-32 object-cover rounded-lg border-2 border-purple-300"
                              data-testid={`setup-image-preview-${index}`}
                            />
                            <button
                              onClick={() => removeSetupImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              data-testid={`button-remove-setup-image-${index}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Image Details */}
                          <div className="flex-1 space-y-3">
                            <div>
                              <Label htmlFor={`ref-desc-${index}`} className="text-sm font-semibold">
                                Description
                              </Label>
                              <Input
                                id={`ref-desc-${index}`}
                                placeholder="e.g., Single-story ranch house with vinyl siding"
                                value={refImg.description}
                                onChange={(e) => updateReferenceImage(index, 'description', e.target.value)}
                                className="mt-1"
                                data-testid={`input-ref-description-${index}`}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor={`ref-measure-${index}`} className="text-sm font-semibold">
                                  Measurement
                                </Label>
                                <Input
                                  id={`ref-measure-${index}`}
                                  type="number"
                                  step="0.1"
                                  placeholder="e.g., 1800"
                                  value={refImg.measurement}
                                  onChange={(e) => updateReferenceImage(index, 'measurement', e.target.value)}
                                  className="mt-1"
                                  data-testid={`input-ref-measurement-${index}`}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`ref-unit-${index}`} className="text-sm font-semibold">
                                  Unit
                                </Label>
                                <Select 
                                  value={refImg.unit} 
                                  onValueChange={(value) => updateReferenceImage(index, 'unit', value)}
                                >
                                  <SelectTrigger className="mt-1" data-testid={`select-ref-unit-${index}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="sqft">Square Feet</SelectItem>
                                    <SelectItem value="feet">Feet</SelectItem>
                                    <SelectItem value="meters">Meters</SelectItem>
                                    <SelectItem value="sqm">Square Meters</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Upload Button */}
                  {setupConfig.referenceImages.length < 5 && (
                    <div className="mt-4 border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                      <input
                        id="setup-image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleSetupImageUpload}
                        className="hidden"
                        data-testid="input-setup-image-upload"
                      />
                      <label htmlFor="setup-image-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto text-purple-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Click to upload reference images
                        </p>
                      </label>
                    </div>
                  )}
                </div>

                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Setup configured! Switch to Customer View to test how users will upload images and get measurements.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              {/* CUSTOMER VIEW */}
              <TabsContent value="customer" className="space-y-6">
                <Alert>
                  <AlertDescription>
                    <strong>Customer View:</strong> This is what your customers see. Upload 1-5 images of the object from different angles.
                  </AlertDescription>
                </Alert>

                {/* Customer Image Upload */}
                <div>
                  <Label htmlFor="customer-image-upload" className="text-base font-semibold mb-2 block">
                    Upload Photos ({customerImages.length}/5)
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Upload images from different angles for better accuracy
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {customerImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Customer upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          data-testid={`customer-image-preview-${index}`}
                        />
                        <button
                          onClick={() => removeCustomerImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-remove-customer-image-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {customerImages.length < 5 && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                      <input
                        id="customer-image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleCustomerImageUpload}
                        className="hidden"
                        data-testid="input-customer-image-upload"
                      />
                      <label htmlFor="customer-image-upload" className="cursor-pointer">
                        <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Click to upload images
                        </p>
                      </label>
                    </div>
                  )}
                </div>

                {/* Measurement Type */}
                <div>
                  <Label htmlFor="measurement-type" className="text-base font-semibold">
                    What do you want to measure?
                  </Label>
                  <Select value={measurementType} onValueChange={(value) => setMeasurementType(value as any)}>
                    <SelectTrigger className="mt-2" data-testid="select-measurement-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="area">Total Area (sq ft)</SelectItem>
                      <SelectItem value="length">Length</SelectItem>
                      <SelectItem value="width">Width</SelectItem>
                      <SelectItem value="height">Height</SelectItem>
                      <SelectItem value="perimeter">Perimeter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || customerImages.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 text-lg"
                  data-testid="button-analyze"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing Images...
                    </>
                  ) : (
                    <>
                      <Ruler className="w-5 h-5 mr-2" />
                      Get Measurement Estimate
                    </>
                  )}
                </Button>

                {/* Error Display */}
                {error && (
                  <Alert variant="destructive" data-testid="alert-error">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Results Display */}
                {result && (
                  <Card className="bg-green-50 dark:bg-green-950/20 border-green-200" data-testid="card-result">
                    <CardHeader>
                      <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6" />
                        Measurement Estimate
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Value</p>
                          <p className="text-3xl font-bold text-green-700 dark:text-green-300" data-testid="text-result-value">
                            {result.value.toFixed(2)} {result.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Confidence Score</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-green-500 h-3 rounded-full transition-all"
                                style={{ width: `${result.confidence}%` }}
                              />
                            </div>
                            <span className="text-lg font-semibold text-green-700 dark:text-green-300" data-testid="text-result-confidence">
                              {result.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Explanation:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-result-explanation">
                          {result.explanation}
                        </p>
                      </div>

                      {result.warnings && result.warnings.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                            Important Notes:
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            {result.warnings.map((warning, index) => (
                              <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
