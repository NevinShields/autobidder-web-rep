import React, { useState, useRef } from 'react';
import type { ImageFile } from '../types';
import { generateIcon, refineIcon } from '../services/geminiService';
import ImageUploader from './ImageUploader';
import Spinner from './Spinner';

// Utility to turn a solid black background into transparency
const forgeTransparency = (base64Data: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(`data:image/png;base64,${base64Data}`);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Threshold for what we consider "black" background
      // AI images on "black" backgrounds sometimes have very slight noise
      const threshold = 20; 

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // If pixel is near pure black, make it transparent
        if (r < threshold && g < threshold && b < threshold) {
          data[i + 3] = 0; // Set Alpha to 0
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = `data:image/png;base64,${base64Data}`;
  });
};

const fileToImageFile = (file: File): Promise<ImageFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        const mimeType = base64.substring(5, base64.indexOf(';'));
        const data = base64.substring(base64.indexOf(',') + 1);
        resolve({ base64, mimeType, data });
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

function IconGenerator() {
  const [stylePrompt, setStylePrompt] = useState<string>('');
  const [styleImage, setStyleImage] = useState<ImageFile | null>(null);
  const [contentPrompt, setContentPrompt] = useState<string>('');
  const [contentImage, setContentImage] = useState<ImageFile | null>(null);

  const [generatedImages, setGeneratedImages] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedImageForRefinement, setSelectedImageForRefinement] = useState<string | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');
  
  const refinementSectionRef = useRef<HTMLDivElement>(null);
  const contentSectionRef = useRef<HTMLDivElement>(null);

  const processImages = async (base64Images: string[]) => {
    const processed = await Promise.all(base64Images.map(img => forgeTransparency(img)));
    setGeneratedImages(processed);
  };

  const handleStyleImageUpload = async (file: File) => {
    const imageFile = await fileToImageFile(file);
    setStyleImage(imageFile);
  };

  const handleContentImageUpload = async (file: File) => {
    const imageFile = await fileToImageFile(file);
    setContentImage(imageFile);
  };
  
  const handleSelectIcon = (imageData: string) => {
    setSelectedImageForRefinement(imageData);
    setRefinementPrompt('');
    setTimeout(() => {
        refinementSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentPrompt && !contentImage) {
      setError("Please describe the icon's subject or upload a reference image.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages(null);
    setSelectedImageForRefinement(null);

    try {
      const rawImages = await generateIcon(stylePrompt, styleImage, contentPrompt, contentImage);
      await processImages(rawImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementPrompt || !selectedImageForRefinement) {
        setError("Please enter your refinement comments.");
        return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
        const rawSelectedData = selectedImageForRefinement.split(',')[1];
        const refinedRaw = await refineIcon(rawSelectedData, refinementPrompt, stylePrompt, styleImage);
        await processImages(refinedRaw);
        setSelectedImageForRefinement(null);
        setRefinementPrompt('');
    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleStartFresh = () => {
    setStylePrompt('');
    setStyleImage(null);
    setContentPrompt('');
    setContentImage(null);
    setGeneratedImages(null);
    setIsLoading(false);
    setError(null);
    setSelectedImageForRefinement(null);
    setRefinementPrompt('');
  };

  const handleKeepStyleStartFresh = () => {
    setContentPrompt('');
    setContentImage(null);
    setGeneratedImages(null);
    setIsLoading(false);
    setError(null);
    setSelectedImageForRefinement(null);
    setRefinementPrompt('');
    // Notice: stylePrompt and styleImage are NOT reset
  };

  const isFormDisabled = isLoading || !!generatedImages;

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset disabled={isFormDisabled}>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-opacity duration-500 ${isFormDisabled ? 'opacity-50' : 'opacity-100'}`}>
            {/* Style Section */}
            <div className="bg-stone-800/70 backdrop-blur-sm p-6 rounded-lg border border-stone-700 shadow-lg shadow-black/30">
              <h2 className="font-display text-2xl font-semibold mb-4 text-cyan-300">1. Define the Style</h2>
              <div className="space-y-4">
                <textarea
                  value={stylePrompt}
                  onChange={(e) => setStylePrompt(e.target.value)}
                  placeholder="e.g., Frosted glassmorphism, hyper-realistic 3D, minimal flat vector, cyberpunk neon, isometric gold..."
                  className="w-full h-24 p-3 bg-stone-900/70 border border-stone-600 rounded-md focus:ring-2 focus:ring-cyan-400 focus:outline-none transition"
                />
                <p className="text-center text-stone-500 font-bold uppercase text-xs tracking-widest">- OR -</p>
                <ImageUploader
                  id="style-uploader"
                  label="Upload Style Reference"
                  onImageUpload={handleStyleImageUpload}
                  onImageClear={() => setStyleImage(null)}
                  image={styleImage}
                />
              </div>
            </div>
            {/* Subject Section */}
            <div ref={contentSectionRef} className="bg-stone-800/70 backdrop-blur-sm p-6 rounded-lg border border-stone-700 shadow-lg shadow-black/30">
              <h2 className="font-display text-2xl font-semibold mb-4 text-orange-300">2. Define the Subject</h2>
              <div className="space-y-4">
                <textarea
                  value={contentPrompt}
                  onChange={(e) => setContentPrompt(e.target.value)}
                  placeholder="e.g., A rocket ship, a futuristic smartphone, a detailed dragon head... (Icons only, no text will be rendered)"
                  className="w-full h-24 p-3 bg-stone-900/70 border border-stone-600 rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
                  required
                />
                <p className="text-center text-stone-500 font-bold uppercase text-xs tracking-widest">- OR -</p>
                 <ImageUploader
                  id="content-uploader"
                  label="Upload Shape Reference"
                  onImageUpload={handleContentImageUpload}
                  onImageClear={() => setContentImage(null)}
                  image={contentImage}
                />
              </div>
            </div>
          </div>
        </fieldset>

        <div className="text-center">
            {!generatedImages && (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full max-w-md bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center mx-auto shadow-lg shadow-black/30 border border-cyan-900/30"
              >
                {isLoading ? <><Spinner /> Rendering...</> : 'Generate Professional Icons'}
              </button>
            )}
        </div>
      </form>

      {/* Results Section */}
      <div className="mt-8">
        {isLoading && !generatedImages && (
          <div className="text-center text-stone-300 animate-pulse">
            <p className="text-lg">Synthesizing high-fidelity assets... strictly following your style.</p>
          </div>
        )}
        {error && (
          <div className="bg-red-900/70 border border-red-600 text-red-200 p-4 rounded-lg text-center my-4 backdrop-blur-sm">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}
        {generatedImages && generatedImages.length > 0 && (
          <div className="bg-stone-800/70 backdrop-blur-sm p-6 rounded-lg border border-stone-700 shadow-lg shadow-black/30 text-center">
            <h2 className="font-display text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-orange-400">Generation Complete</h2>
            <p className="text-stone-300/80 mb-6 -mt-4">Isolated on transparent backgrounds. Click an icon to refine details.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {generatedImages.map((imageData, index) => (
                <div key={index} className={`flex flex-col items-center space-y-4 transition-all duration-300 ${selectedImageForRefinement && selectedImageForRefinement !== imageData ? 'opacity-30' : 'opacity-100'}`}>
                  <button
                    onClick={() => handleSelectIcon(imageData)}
                    className={`checkerboard p-4 rounded-xl w-full aspect-square flex items-center justify-center transition-all duration-300 border-2 ${selectedImageForRefinement === imageData ? 'border-cyan-400 bg-cyan-900/20' : 'border-stone-700 hover:border-cyan-300'} focus:outline-none overflow-hidden shadow-2xl`}
                  >
                    <img
                      src={imageData}
                      alt={`Generated asset ${index + 1}`}
                      className="max-w-full max-h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                    />
                  </button>
                  <a
                    href={imageData}
                    download={`icon-${index + 1}.png`}
                    className="w-full bg-stone-700 hover:bg-stone-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-transform transform hover:scale-105 shadow-lg text-center"
                  >
                    Download PNG
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button
                type="button"
                onClick={handleKeepStyleStartFresh}
                className="w-full sm:w-auto bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-md border border-cyan-500/30"
              >
               New Batch (Keep Style)
              </button>
              <button
                type="button"
                onClick={handleStartFresh}
                className="w-full sm:w-auto bg-stone-600 hover:bg-stone-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-md border border-stone-500/30"
              >
               Clear All & Start Fresh
              </button>
            </div>
            
          </div>
        )}
      </div>

      {/* Refinement Section */}
      {selectedImageForRefinement && (
        <div ref={refinementSectionRef} className="mt-8 bg-stone-800/70 backdrop-blur-sm p-6 rounded-lg border-2 border-cyan-500/50 animate-fade-in shadow-xl shadow-black/50">
             <h2 className="font-display text-2xl font-semibold mb-4 text-cyan-300 text-center">Tweak the Design</h2>
            <form onSubmit={handleRefineSubmit} className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                    <div className="checkerboard p-4 rounded-lg w-32 h-32 flex items-center justify-center shadow-inner shadow-black border border-stone-700">
                        <img 
                            src={selectedImageForRefinement} 
                            alt="Selected for refinement"
                            className="max-w-full max-h-full object-contain drop-shadow-lg"
                        />
                    </div>
                </div>
                <div className="w-full flex-grow space-y-4">
                    <textarea 
                        value={refinementPrompt}
                        onChange={(e) => setRefinementPrompt(e.target.value)}
                        placeholder="e.g., Make it shinier, add a blue glow to the edges, simplify the shape... (No text allowed)"
                        className="w-full h-24 p-3 bg-stone-900/70 border border-stone-600 rounded-md focus:ring-2 focus:ring-cyan-400 focus:outline-none transition"
                        required
                    />
                    <div className="flex items-center justify-end gap-4">
                        <button 
                            type="button"
                            onClick={() => setSelectedImageForRefinement(null)}
                            className="bg-stone-600 hover:bg-stone-700 text-white font-bold py-2 px-6 rounded-lg transition"
                        >
                            Cancel
                        </button>
                         <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
                          >
                            {isLoading ? <><Spinner /> Refinement in progress...</> : 'Apply Changes'}
                          </button>
                    </div>
                </div>
            </form>
        </div>
      )}
    </div>
  );
}

export default IconGenerator;