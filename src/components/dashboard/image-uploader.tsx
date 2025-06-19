
'use client';

import { useState, ChangeEvent, DragEvent, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { UploadCloud, XCircle, Camera, Video, VideoOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onImageUpload: (file: File, dataUrl: string) => void;
  isProcessing: boolean;
}

export function ImageUploader({ onImageUpload, isProcessing }: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [showCameraView, setShowCameraView] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const videoElement = videoRef.current;

    const getCameraPermission = async () => {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const noDeviceError = 'Camera not available on this device/browser.';
        setCameraError(noDeviceError);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Error',
          description: noDeviceError,
        });
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        let description = 'Please enable camera permissions in your browser settings.';
        if (err instanceof Error && err.name === "NotAllowedError") {
            description = "Camera access was denied. Please enable permissions in your browser settings.";
        } else if (err instanceof Error && err.name === "NotFoundError") {
            description = "No camera was found. Please ensure a camera is connected and enabled.";
        } else if (err instanceof Error) {
            description = `Could not access camera: ${err.message}.`;
        }
        setCameraError(description);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: description,
        });
      }
    };

    if (showCameraView) {
      getCameraPermission();
    }

    return () => {
      if (videoElement && videoElement.srcObject) {
        const mediaStream = videoElement.srcObject as MediaStream;
        mediaStream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
      }
    };
  }, [showCameraView, toast]);

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
      setShowCameraView(false); // Switch back to file view if a file is selected
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
    setShowCameraView(false);
    setHasCameraPermission(null);
    setCameraError(null);
    if (videoRef.current && videoRef.current.srcObject) {
        const mediaStream = videoRef.current.srcObject as MediaStream;
        mediaStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
    const fileInput = document.getElementById('chart-image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  };

  const handleCapturePhoto = async () => {
    if (videoRef.current && canvasRef.current && hasCameraPermission) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        try {
          const file = await dataUrlToFile(dataUrl, `webcam-${Date.now()}.jpg`);
          setSelectedFile(file);
          setPreviewUrl(dataUrl);
          setError(null);
          setShowCameraView(false); // Switch to preview view
          if (videoRef.current && videoRef.current.srcObject) {
            const mediaStream = videoRef.current.srcObject as MediaStream;
            mediaStream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
          }
          setHasCameraPermission(null); // Reset camera permission status
        } catch (fileError) {
          console.error("Error creating file from data URL:", fileError);
          setError("Could not process captured image.");
        }
      }
    } else {
        setError("Camera not ready or permission denied.");
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Upload or Capture Chart Image</CardTitle>
        <CardDescription>Select, drag & drop, or use your webcam to capture a chart image.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 mb-4">
          <Button variant={!showCameraView ? "default" : "outline"} onClick={() => { clearSelection(); setShowCameraView(false);}} className="flex-1">
            <UploadCloud className="mr-2 h-4 w-4" /> Upload File
          </Button>
          <Button variant={showCameraView ? "default" : "outline"} onClick={() => { clearSelection(); setShowCameraView(true); }} className="flex-1">
            <Camera className="mr-2 h-4 w-4" /> Use Webcam
          </Button>
        </div>

        {showCameraView ? (
          <div className="space-y-4">
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="w-full aspect-video bg-muted rounded-md overflow-hidden relative flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              {!hasCameraPermission && hasCameraPermission !== null && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                    <VideoOff className="w-12 h-12 mb-2" />
                    <p className="text-center">{cameraError || "Camera permission denied or camera not found."}</p>
                 </div>
              )}
               {hasCameraPermission === null && !cameraError && ( // Loading state for camera
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                    <p>Initializing camera...</p>
                 </div>
              )}
            </div>
            
            {cameraError && !hasCameraPermission && (
                 <Alert variant="destructive">
                    <VideoOff className="h-4 w-4" />
                    <AlertTitle>Camera Error</AlertTitle>
                    <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
            )}

            <Button onClick={handleCapturePhoto} disabled={!hasCameraPermission || isProcessing} className="w-full">
              <Video className="mr-2 h-4 w-4" /> Capture Photo
            </Button>
          </div>
        ) : (
          // File Upload View
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
        )}

        {error && !showCameraView && <p className="text-sm text-destructive text-center">{error}</p>}

        {previewUrl && !showCameraView && ( // Show Analyze button only if there's a preview and not in camera view
          <div className="text-center">
            {selectedFile && <p className="text-sm text-muted-foreground truncate">Selected: {selectedFile.name}</p>}
            <Button onClick={handleUpload} disabled={!selectedFile || isProcessing} className="mt-4 w-full sm:w-auto">
              Analyze Chart
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
