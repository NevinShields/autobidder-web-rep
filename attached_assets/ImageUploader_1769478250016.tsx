
import React from 'react';
import type { ImageFile } from '../types';

interface ImageUploaderProps {
  id: string;
  label: string;
  onImageUpload: (file: File) => void;
  onImageClear: () => void;
  image: ImageFile | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, onImageUpload, onImageClear, image }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  return (
    <div className="w-full h-48 bg-stone-900/70 border-2 border-dashed border-stone-600 rounded-lg flex items-center justify-center relative transition hover:border-cyan-400">
      {image ? (
        <>
          <img src={image.base64} alt="Preview" className="max-w-full max-h-full object-contain rounded-md p-2" />
          <button
            type="button"
            onClick={onImageClear}
            className="absolute top-2 right-2 bg-red-800 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg hover:bg-red-900 transition transform hover:scale-110"
            aria-label="Remove image"
          >
            &times;
          </button>
        </>
      ) : (
        <label htmlFor={id} className="cursor-pointer text-center text-stone-400 p-4 w-full h-full flex flex-col items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1.5l2.4 7.4h7.8l-6.3 4.6 2.4 7.4-6.3-4.6-6.3 4.6 2.4-7.4-6.3-4.6h7.8z"/>
          </svg>
          <span className="font-semibold text-stone-300">{label}</span>
          <input
            type="file"
            id={id}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
          />
        </label>
      )}
    </div>
  );
};

export default ImageUploader;