import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Loader2, RefreshCw, Check, X, Upload, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processIconWithBackgroundRemoval } from "@/lib/background-removal";
import { cn } from "@/lib/utils";

interface AIIconGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIconGenerated: (iconDataUrl: string) => void;
  defaultPrompt?: string;
  title?: string;
}

type GenerationStatus = 'idle' | 'generating' | 'removing-bg' | 'refining' | 'success' | 'error';

interface GeneratedImage {
  imageBase64: string;
  mimeType: string;
  processedDataUrl?: string;
}

export default function AIIconGeneratorModal({
  isOpen,
  onClose,
  onIconGenerated,
  defaultPrompt = '',
  title = 'Generate Icon with AI'
}: AIIconGeneratorModalProps) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [styleDescription, setStyleDescription] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [generatedIcons, setGeneratedIcons] = useState<GeneratedImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleReferenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Please select an image file", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Image must be smaller than 5MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const statusMessages: Record<GenerationStatus, string> = {
    idle: 'Enter a description for your icon',
    generating: 'Creating 4 variations with AI...',
    'removing-bg': 'Processing backgrounds...',
    refining: 'Refining based on feedback...',
    success: 'Select your favorite!',
    error: errorMessage || 'Something went wrong'
  };

  const processImages = async (images: Array<{ imageBase64: string; mimeType: string }>) => {
    if (removeBackground) {
      setStatus('removing-bg');
      const processed = await Promise.all(
        images.map(async (img) => {
          try {
            const processedUrl = await processIconWithBackgroundRemoval(img.imageBase64, img.mimeType);
            return { ...img, processedDataUrl: processedUrl };
          } catch {
            return { ...img, processedDataUrl: `data:${img.mimeType};base64,${img.imageBase64}` };
          }
        })
      );
      return processed;
    }
    return images.map(img => ({
      ...img,
      processedDataUrl: `data:${img.mimeType};base64,${img.imageBase64}`
    }));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Please enter a description", variant: "destructive" });
      return;
    }

    setStatus('generating');
    setErrorMessage(null);
    setGeneratedIcons([]);
    setSelectedIndex(0);
    setRefinementPrompt('');

    try {
      const response = await fetch('/api/icons/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: prompt.trim(),
          styleDescription: styleDescription.trim(),
          referenceImage: referenceImage || undefined
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to generate icons');
        } else {
          throw new Error(`Server error (${response.status}): Please try again or check that you're logged in.`);
        }
      }

      const data = await response.json();
      const processed = await processImages(data.images);
      setGeneratedIcons(processed);
      setStatus('success');
    } catch (error) {
      console.error('Icon generation error:', error);
      setErrorMessage((error as Error).message);
      setStatus('error');
      toast({ title: "Generation failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleRefine = async () => {
    if (!refinementPrompt.trim() || generatedIcons.length === 0) return;

    const selectedIcon = generatedIcons[selectedIndex];
    setStatus('refining');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/icons/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          baseIconData: selectedIcon.imageBase64,
          refinementPrompt: refinementPrompt.trim(),
          originalStyleDescription: styleDescription.trim(),
          originalReferenceImage: referenceImage || undefined
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to refine icon');
        } else {
          throw new Error(`Server error (${response.status}): Please try again.`);
        }
      }

      const data = await response.json();
      const processed = await processImages(data.images);
      setGeneratedIcons(processed);
      setSelectedIndex(0);
      setRefinementPrompt('');
      setStatus('success');
    } catch (error) {
      console.error('Icon refinement error:', error);
      setErrorMessage((error as Error).message);
      setStatus('error');
      toast({ title: "Refinement failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleAccept = () => {
    const selectedIcon = generatedIcons[selectedIndex];
    if (selectedIcon?.processedDataUrl) {
      onIconGenerated(selectedIcon.processedDataUrl);
      handleClose();
    }
  };

  const handleClose = () => {
    setPrompt(defaultPrompt);
    setStyleDescription('');
    setReferenceImage(null);
    setRemoveBackground(true);
    setStatus('idle');
    setGeneratedIcons([]);
    setSelectedIndex(0);
    setRefinementPrompt('');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleRegenerate = () => {
    setGeneratedIcons([]);
    setSelectedIndex(0);
    setRefinementPrompt('');
    setStatus('idle');
    handleGenerate();
  };

  const isGenerating = status === 'generating' || status === 'removing-bg' || status === 'refining';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Describe the icon you want to generate. AI will create it for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Icon Description</Label>
            <Input
              id="prompt"
              placeholder="e.g., A hammer for construction services"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isGenerating && !generatedIcon) {
                  handleGenerate();
                }
              }}
            />
          </div>

          {/* Style Description */}
          <div className="space-y-2">
            <Label htmlFor="style">Style Description (optional)</Label>
            <Input
              id="style"
              placeholder="e.g., flat minimalist, 3D realistic, cartoon style, line art..."
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500">Describe the visual style you want for your icon</p>
          </div>

          {/* Reference Image Upload */}
          <div className="space-y-2">
            <Label>Reference Icon (optional)</Label>
            <div className="flex items-center gap-3">
              {referenceImage ? (
                <div className="relative group">
                  <img
                    src={referenceImage}
                    alt="Reference"
                    className="w-12 h-12 object-cover rounded-lg border-2 border-purple-200"
                  />
                  <button
                    type="button"
                    onClick={removeReferenceImage}
                    disabled={isGenerating}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className={`w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Upload className="w-5 h-5 text-gray-400" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReferenceUpload}
                    disabled={isGenerating}
                    className="hidden"
                  />
                </label>
              )}
              <div className="flex-1">
                <p className="text-xs text-gray-500">
                  Upload an existing icon to match its style
                </p>
              </div>
            </div>
          </div>

          {/* Remove Background Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="remove-bg">Remove Background</Label>
              <p className="text-xs text-gray-500">Make background transparent</p>
            </div>
            <Switch
              id="remove-bg"
              checked={removeBackground}
              onCheckedChange={setRemoveBackground}
              disabled={isGenerating}
            />
          </div>

          {/* Preview Area */}
          <div className="border rounded-lg p-4 min-h-[200px] bg-gray-50 dark:bg-gray-800">
            {status === 'idle' && generatedIcons.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[180px] text-gray-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{statusMessages.idle}</p>
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center h-[180px]">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-purple-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{statusMessages[status]}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center justify-center h-[180px] text-red-500">
                <X className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">{statusMessages.error}</p>
              </div>
            )}

            {generatedIcons.length > 0 && status === 'success' && (
              <div className="space-y-3">
                <p className="text-sm text-center text-green-600 flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" />
                  {statusMessages.success}
                </p>

                {/* 4-Icon Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {generatedIcons.map((icon, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={cn(
                        "relative aspect-square rounded-lg border-2 overflow-hidden transition-all",
                        selectedIndex === index
                          ? "border-purple-500 ring-2 ring-purple-200"
                          : "border-gray-200 hover:border-purple-300"
                      )}
                      style={{
                        backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                        backgroundSize: '8px 8px',
                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                      }}
                    >
                      <img
                        src={icon.processedDataUrl}
                        alt={`Variation ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                      {selectedIndex === index && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Refinement Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Refine: e.g., 'make it larger', 'change color to blue'"
                    value={refinementPrompt}
                    onChange={(e) => setRefinementPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && refinementPrompt.trim()) {
                        handleRefine();
                      }
                    }}
                    className="flex-1 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefine}
                    disabled={!refinementPrompt.trim()}
                  >
                    <Wand2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
            Cancel
          </Button>

          {generatedIcons.length === 0 ? (
            <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleRegenerate} disabled={isGenerating}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button onClick={handleAccept} disabled={isGenerating}>
                <Check className="w-4 h-4 mr-2" />
                Accept
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
