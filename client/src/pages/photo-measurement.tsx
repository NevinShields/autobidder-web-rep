import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Camera, Upload, X, Ruler, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface MeasurementResult {
  value: number;
  unit: string;
  confidence: number;
  explanation: string;
  warnings: string[];
}

export default function PhotoMeasurement() {
  const [images, setImages] = useState<string[]>([]);
  const [useAutoDetect, setUseAutoDetect] = useState(true);
  const [referenceObject, setReferenceObject] = useState("");
  const [referenceMeasurement, setReferenceMeasurement] = useState("");
  const [referenceUnit, setReferenceUnit] = useState("feet");
  const [targetObject, setTargetObject] = useState("");
  const [measurementType, setMeasurementType] = useState<'area' | 'length' | 'width' | 'height' | 'perimeter'>("area");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MeasurementResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const availableSlots = 5 - images.length;
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
          setImages([...images, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    setError(null);
    setResult(null);

    if (images.length === 0) {
      setError("Please upload at least one image");
      return;
    }
    if (!targetObject) {
      setError("Please specify what to measure");
      return;
    }

    // Validate manual reference mode
    if (!useAutoDetect) {
      if (!referenceObject || !referenceMeasurement) {
        setError("Please provide reference object and measurement, or enable auto-detect");
        return;
      }
      const refMeasurement = parseFloat(referenceMeasurement);
      if (isNaN(refMeasurement) || refMeasurement <= 0) {
        setError("Reference measurement must be a positive number");
        return;
      }
    }

    setIsAnalyzing(true);

    try {
      const requestData: any = {
        images,
        targetObject,
        measurementType,
      };

      // Only include reference data if not in auto-detect mode
      if (!useAutoDetect && referenceObject && referenceMeasurement) {
        const refMeasurement = parseFloat(referenceMeasurement);
        requestData.referenceObject = referenceObject;
        requestData.referenceMeasurement = refMeasurement;
        requestData.referenceUnit = referenceUnit;
      }

      const response = await apiRequest(
        "POST",
        "/api/photo-measurement/analyze",
        requestData
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || "Failed to analyze images");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze images");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return "High Confidence";
    if (confidence >= 60) return "Medium Confidence";
    return "Low Confidence";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Camera className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Photo Measurement Tool</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Estimate measurements from photos using AI vision analysis
          </p>
        </div>

        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <strong>Proof of Concept Widget:</strong> This tool provides rough estimates for planning purposes. 
            Accuracy typically ranges ±10-20%. For best results, take photos perpendicular to the surface 
            and include a known reference object.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload & Configure
              </CardTitle>
              <CardDescription>
                Upload up to 5 photos and provide measurement details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Upload */}
              <div>
                <Label htmlFor="image-upload" className="text-base font-semibold mb-2 block">
                  Photos ({images.length}/5)
                </Label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        data-testid={`image-preview-${index}`}
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-remove-image-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {images.length < 5 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="input-image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click to upload images
                      </p>
                    </label>
                  </div>
                )}
              </div>

              {/* Auto-Detect Toggle */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="auto-detect-toggle" className="text-base font-semibold cursor-pointer flex items-center gap-2">
                      <Badge className="bg-blue-600">AI</Badge>
                      Auto-Detect Reference
                    </Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      AI automatically finds common objects (doors, windows, people) to establish scale
                    </p>
                  </div>
                  <Switch
                    id="auto-detect-toggle"
                    checked={useAutoDetect}
                    onCheckedChange={setUseAutoDetect}
                    data-testid="switch-auto-detect"
                  />
                </div>
              </div>

              {/* Reference Object - Only shown when auto-detect is off */}
              {!useAutoDetect && (
                <>
                  <div>
                    <Label htmlFor="reference-object" className="text-base font-semibold">
                      Reference Object
                    </Label>
                    <Input
                      id="reference-object"
                      placeholder="e.g., door, person, window"
                      value={referenceObject}
                      onChange={(e) => setReferenceObject(e.target.value)}
                      className="mt-2"
                      data-testid="input-reference-object"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      An object in the photo with a known measurement
                    </p>
                  </div>

                  {/* Reference Measurement */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="reference-measurement" className="text-base font-semibold">
                        Measurement
                      </Label>
                      <Input
                        id="reference-measurement"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 7"
                        value={referenceMeasurement}
                        onChange={(e) => setReferenceMeasurement(e.target.value)}
                        className="mt-2"
                        data-testid="input-reference-measurement"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reference-unit" className="text-base font-semibold">
                        Unit
                      </Label>
                      <Select value={referenceUnit} onValueChange={setReferenceUnit}>
                        <SelectTrigger className="mt-2" data-testid="select-reference-unit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="feet">Feet</SelectItem>
                          <SelectItem value="meters">Meters</SelectItem>
                          <SelectItem value="inches">Inches</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Target Object */}
              <div>
                <Label htmlFor="target-object" className="text-base font-semibold">
                  What to Measure
                </Label>
                <Input
                  id="target-object"
                  placeholder="e.g., house wall, deck, patio"
                  value={targetObject}
                  onChange={(e) => setTargetObject(e.target.value)}
                  className="mt-2"
                  data-testid="input-target-object"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The object you want to estimate measurements for
                </p>
              </div>

              {/* Measurement Type */}
              <div>
                <Label htmlFor="measurement-type" className="text-base font-semibold">
                  Measurement Type
                </Label>
                <Select
                  value={measurementType}
                  onValueChange={(value) => setMeasurementType(value as typeof measurementType)}
                >
                  <SelectTrigger className="mt-2" data-testid="select-measurement-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area">Area (sq ft)</SelectItem>
                    <SelectItem value="length">Length</SelectItem>
                    <SelectItem value="width">Width</SelectItem>
                    <SelectItem value="height">Height</SelectItem>
                    <SelectItem value="perimeter">Perimeter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full"
                size="lg"
                data-testid="button-analyze"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Ruler className="w-5 h-5 mr-2" />
                    Analyze Photos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Right Column - Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                Analysis Results
              </CardTitle>
              <CardDescription>
                AI-estimated measurements based on your photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription data-testid="text-error">{error}</AlertDescription>
                </Alert>
              )}

              {!result && !error && !isAnalyzing && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Ruler className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Upload photos and click "Analyze Photos" to get started</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-12">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Analyzing images with AI vision...
                  </p>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  {/* Main Result */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Estimated {measurementType}
                    </p>
                    <p className="text-5xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-measurement-value">
                      {result.value.toFixed(2)}
                    </p>
                    <p className="text-xl text-gray-700 dark:text-gray-300 mt-1" data-testid="text-measurement-unit">
                      {result.unit}
                    </p>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Confidence Level</span>
                      <Badge className={getConfidenceColor(result.confidence)} data-testid="badge-confidence">
                        {result.confidence}%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${getConfidenceColor(result.confidence)}`}
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {getConfidenceLabel(result.confidence)}
                    </p>
                  </div>

                  {/* Explanation */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      How it was calculated
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg" data-testid="text-explanation">
                      {result.explanation}
                    </p>
                  </div>

                  {/* Warnings */}
                  {result.warnings.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        Important Notes
                      </h4>
                      <ul className="space-y-2">
                        {result.warnings.map((warning, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg"
                            data-testid={`text-warning-${index}`}
                          >
                            • {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <h4 className="font-semibold mb-2">Upload Photos</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Take clear photos of the area you want to measure. Include a reference object with a known size.
                </p>
              </div>
              <div>
                <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">2</span>
                </div>
                <h4 className="font-semibold mb-2">Set Reference</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Identify an object in your photo with a known measurement (door, window, person, etc.).
                </p>
              </div>
              <div>
                <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">3</span>
                </div>
                <h4 className="font-semibold mb-2">Get Estimate</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  AI analyzes the photos and provides an estimated measurement with a confidence score.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
