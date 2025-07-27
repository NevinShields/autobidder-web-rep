import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Image as ImageIcon, FileWarning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  maxImages?: number;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  label?: string;
  description?: string;
  helperText?: string;
  required?: boolean;
  onImagesChange?: (images: File[]) => void;
  onUploadComplete?: (urls: string[]) => void;
  disabled?: boolean;
}

interface UploadedImage {
  file: File;
  preview: string;
  uploading: boolean;
  progress: number;
  uploaded: boolean;
  url?: string;
  error?: string;
}

export default function ImageUpload({
  maxImages = 5,
  maxFileSize = 10,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  label = 'Upload Images',
  description = 'Please upload relevant images to help us provide an accurate quote',
  helperText = 'Upload clear photos showing the area or items that need service. This helps us provide more accurate pricing.',
  required = false,
  onImagesChange,
  onUploadComplete,
  disabled = false,
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed. Please use: ${allowedTypes.join(', ')}`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }
    
    return null;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    if (fileArray.length > remainingSlots) {
      toast({
        title: 'Too many files',
        description: `You can only upload ${remainingSlots} more images`,
        variant: 'destructive',
      });
      return;
    }

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        invalidFiles.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: 'Some files were rejected',
        description: invalidFiles.join('\n'),
        variant: 'destructive',
      });
    }

    if (validFiles.length > 0) {
      const newImages: UploadedImage[] = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        progress: 0,
        uploaded: false,
      }));

      setImages(prev => [...prev, ...newImages]);
      onImagesChange?.(validFiles);

      // Start uploading files
      uploadFiles(newImages);
    }
  };

  const uploadFiles = async (imagesToUpload: UploadedImage[]) => {
    for (const image of imagesToUpload) {
      await uploadSingleFile(image);
    }
  };

  const uploadSingleFile = async (image: UploadedImage) => {
    // Set uploading state
    setImages(prev => prev.map(img => 
      img.file === image.file 
        ? { ...img, uploading: true, progress: 0 }
        : img
    ));

    try {
      const formData = new FormData();
      formData.append('image', image.file);

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setImages(prev => prev.map(img => 
            img.file === image.file 
              ? { ...img, progress }
              : img
          ));
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setImages(prev => prev.map(img => 
            img.file === image.file 
              ? { ...img, uploading: false, uploaded: true, url: response.url }
              : img
          ));
        } else {
          setImages(prev => prev.map(img => 
            img.file === image.file 
              ? { ...img, uploading: false, error: 'Upload failed' }
              : img
          ));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        setImages(prev => prev.map(img => 
          img.file === image.file 
            ? { ...img, uploading: false, error: 'Upload failed' }
            : img
        ));
      });

      xhr.open('POST', '/api/upload-image');
      xhr.send(formData);

    } catch (error) {
      setImages(prev => prev.map(img => 
        img.file === image.file 
          ? { ...img, uploading: false, error: 'Upload failed' }
          : img
      ));
    }
  };

  const removeImage = (imageToRemove: UploadedImage) => {
    setImages(prev => {
      const updated = prev.filter(img => img.file !== imageToRemove.file);
      URL.revokeObjectURL(imageToRemove.preview);
      return updated;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const canUploadMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{description}</p>
        <p className="text-xs text-gray-500">{helperText}</p>
      </div>

      {/* Upload Area */}
      {canUploadMore && (
        <Card 
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            isDragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <CardContent className="p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Drop images here or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Up to {maxImages} images, max {maxFileSize}MB each
              </p>
              <p className="text-xs text-gray-500">
                Supports: JPG, PNG, WebP
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={image.preview}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Remove button */}
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 w-6 h-6 p-0"
                  onClick={() => removeImage(image)}
                  disabled={image.uploading}
                >
                  <X className="w-3 h-3" />
                </Button>

                {/* Upload status overlay */}
                {image.uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center space-y-2">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <div className="text-xs">{image.progress}%</div>
                    </div>
                  </div>
                )}

                {/* Upload success indicator */}
                {image.uploaded && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full" />
                  </div>
                )}

                {/* Upload error indicator */}
                {image.error && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                    <div className="text-white text-center">
                      <FileWarning className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-xs">Failed</div>
                    </div>
                  </div>
                )}
              </div>
              
              <CardContent className="p-2">
                <p className="text-xs text-gray-600 truncate">
                  {image.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(image.file.size / 1024 / 1024).toFixed(1)}MB
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Summary */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span>
              {images.filter(img => img.uploaded).length} of {images.length} uploaded
            </span>
          </div>
          <div>
            {images.length} / {maxImages} images
          </div>
        </div>
      )}
    </div>
  );
}