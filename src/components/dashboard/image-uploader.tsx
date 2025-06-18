
'use client';

import { useState, ChangeEvent, DragEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { UploadCloud, XCircle } from 'lucide-react';

interface ImageUploaderProps {
  onImageUpload: (file: File, dataUrl: string) => void;
  isProcessing: boolean;
}

export function ImageUploader({ onImageUpload, isProcessing }: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | null | undefined) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File is too large. Maximum size is 5MB.');
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setError('Invalid file type. Please upload an image (JPG, PNG, GIF, WEBP).');
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }

      setError(null);
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile && previewUrl) {
      onImageUpload(selectedFile, previewUrl);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    // Reset the input field value to allow re-uploading the same file
    const fileInput = document.getElementById('chart-image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Upload Chart Image</CardTitle>
        <CardDescription>Select or drag & drop a chart image to analyze.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors
            ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/70'}
            ${error ? 'border-destructive' : ''}`}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {!previewUrl ? (
            <>
              <UploadCloud className={`w-12 h-12 mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP up to 5MB</p>
              <Input
                id="chart-image-upload"
                type="file"
                accept="image/png, image/jpeg, image/gif, image/webp"
                onChange={handleFileChange}
                className="sr-only"
                disabled={isProcessing}
              />
              <Button variant="outline" size="sm" className="mt-4" onClick={() => document.getElementById('chart-image-upload')?.click()} disabled={isProcessing}>
                Select Image
              </Button>
            </>
          ) : (
            <div className="relative w-full max-w-sm mx-auto">
              <Image
                src={previewUrl}
                alt="Chart preview"
                width={400}
                height={300}
                className="rounded-md object-contain max-h-[300px] w-auto"
                data-ai-hint="chart diagram"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/70 hover:bg-background rounded-full"
                onClick={clearSelection}
                disabled={isProcessing}
                aria-label="Clear selection"
              >
                <XCircle className="h-5 w-5 text-destructive" />
              </Button>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {selectedFile && previewUrl && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground truncate">Selected: {selectedFile.name}</p>
            <Button onClick={handleUpload} disabled={!selectedFile || isProcessing} className="mt-4 w-full sm:w-auto">
              Analyze Chart
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
