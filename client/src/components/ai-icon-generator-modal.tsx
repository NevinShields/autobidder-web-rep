import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Loader2, RefreshCw, Check, X, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processIconWithBackgroundRemoval } from "@/lib/background-removal";

interface AIIconGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIconGenerated: (iconDataUrl: string) => void;
  defaultPrompt?: string;
  title?: string;
}

type GenerationStatus = 'idle' | 'generating' | 'removing-bg' | 'success' | 'error';

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
  const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);
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
    // Reset file input
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
    generating: 'Creating your icon with AI...',
    'removing-bg': 'Making background transparent...',
    success: 'Icon ready!',
    error: errorMessage || 'Something went wrong'
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a description",
        variant: "destructive"
      });
      return;
    }

    setStatus('generating');
    setErrorMessage(null);
    setGeneratedIcon(null);

    try {
      // Step 1: Generate icon with AI
      const response = await fetch('/api/icons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          styleDescription: styleDescription.trim(),
          referenceImage: referenceImage || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate icon');
      }

      const data = await response.json();
      let iconDataUrl = `data:${data.mimeType};base64,${data.imageBase64}`;

      // Step 2: Remove background if enabled
      if (removeBackground) {
        setStatus('removing-bg');
        try {
          iconDataUrl = await processIconWithBackgroundRemoval(data.imageBase64, data.mimeType);
        } catch (bgError) {
          console.warn('Background removal failed, using original image:', bgError);
          // Continue with original image if background removal fails
        }
      }

      setGeneratedIcon(iconDataUrl);
      setStatus('success');
    } catch (error) {
      console.error('Icon generation error:', error);
      setErrorMessage((error as Error).message);
      setStatus('error');
      toast({
        title: "Generation failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleAccept = () => {
    if (generatedIcon) {
      onIconGenerated(generatedIcon);
      handleClose();
    }
  };

  const handleClose = () => {
    setPrompt(defaultPrompt);
    setStyleDescription('');
    setReferenceImage(null);
    setRemoveBackground(true);
    setStatus('idle');
    setGeneratedIcon(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleRegenerate = () => {
    setGeneratedIcon(null);
    setStatus('idle');
    handleGenerate();
  };

  const isGenerating = status === 'generating' || status === 'removing-bg';

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
          <div className="border rounded-lg p-4 min-h-[180px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
            {status === 'idle' && !generatedIcon && (
              <div className="text-center text-gray-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{statusMessages.idle}</p>
              </div>
            )}

            {isGenerating && (
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-purple-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{statusMessages[status]}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center text-red-500">
                <X className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">{statusMessages.error}</p>
              </div>
            )}

            {generatedIcon && status === 'success' && (
              <div className="text-center">
                <div
                  className="w-24 h-24 mx-auto mb-3 rounded-lg border-2 border-gray-200 overflow-hidden"
                  style={{
                    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                    backgroundSize: '10px 10px',
                    backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                  }}
                >
                  <img
                    src={generatedIcon}
                    alt="Generated icon"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-sm text-green-600 flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" />
                  {statusMessages.success}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
            Cancel
          </Button>

          {!generatedIcon ? (
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
              <Button variant="outline" onClick={handleRegenerate}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button onClick={handleAccept}>
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
