'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

interface ImageUploaderProps {
  purpose: 'avatar' | 'property';
  imageUrls: string[];
  onChange: (imageUrls: string[]) => void;
  maxImages?: number;
}

interface SignedUpload {
  cloudName: string;
  apiKey: string;
  params: Record<string, string>;
  signature: string;
}

export default function ImageUploader({
  purpose,
  imageUrls,
  onChange,
  maxImages = 1,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setIsUploading(true);

    try {
      const chosenFiles = Array.from(files).slice(0, maxImages - imageUrls.length);
      const uploadedUrls: string[] = [];
      for (const file of chosenFiles) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5_000_000) {
          throw new Error('Choose a JPG, PNG, or WebP image under 5 MB.');
        }

        const signatureResponse = await fetch('/api/uploads/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purpose }),
        });
        const signed: SignedUpload | { message: string } = await signatureResponse.json();
        if (!signatureResponse.ok || !('signature' in signed)) {
          throw new Error('message' in signed ? signed.message : 'Could not authorize image upload.');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signed.apiKey);
        formData.append('signature', signed.signature);
        Object.entries(signed.params).forEach(([key, value]) => formData.append(key, value));

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
          { method: 'POST', body: formData }
        );
        const uploaded = await uploadResponse.json();
        if (!uploadResponse.ok || typeof uploaded.secure_url !== 'string') {
          throw new Error('The image could not be uploaded. Please try again.');
        }
        uploadedUrls.push(uploaded.secure_url);
      }
      onChange([...imageUrls, ...uploadedUrls].slice(0, maxImages));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {imageUrls.map((imageUrl) => (
          <div key={imageUrl} className="relative h-24 w-24 border border-black bg-neutral-100">
            <Image src={imageUrl} alt="Uploaded photo" fill sizes="96px" className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(imageUrls.filter((item) => item !== imageUrl))}
              aria-label="Remove photo"
              className="absolute right-1 top-1 bg-white p-1"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {imageUrls.length < maxImages && (
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-black bg-white text-xs font-semibold">
            <ImagePlus size={20} />
            {isUploading ? 'Uploading' : 'Add photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={maxImages > 1}
              disabled={isUploading}
              onChange={(event) => {
                void uploadFiles(event.target.files);
                event.currentTarget.value = '';
              }}
              className="sr-only"
            />
          </label>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-medium text-[#E11D48]">{error}</p>}
      <p className="mt-2 text-xs text-neutral-500">JPG, PNG, or WebP. Maximum 5 MB per photo.</p>
    </div>
  );
}