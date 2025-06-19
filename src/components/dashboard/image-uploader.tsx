
'use client';

import { useState, ChangeEvent, DragEvent, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { UploadCloud, XCircle, Camera, Video, VideoOff, Loader2 } from 'lucide-react';
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
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const videoElement = videoRef.current;

    const getCameraPermission = async () => {
      setCameraError(null);
      setHasCameraPermission(null);
      setIsCameraInitializing(true);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const noDeviceError = 'Camera features are not supported by your browser or device.';
        setCameraError(noDeviceError);
        setHasCameraPermission(false);
        setIsCameraInitializing(false);
        toast({
          variant: 'destructive',
          title: 'Camera Error',
          description: noDeviceError,
        });
        return;
      }

      let streamAttempt: MediaStream | null = null;
      try {
        // Try rear camera first
        streamAttempt = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch (rearCameraError) {
        console.warn("Failed to get rear camera (environment), trying default camera:", rearCameraError);
        try {
          // Fallback to any camera (usually front)
          streamAttempt = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (anyCameraError) {
          console.error('Error accessing any camera:', anyCameraError);
          const errorToReport = anyCameraError instanceof Error ? anyCameraError : (rearCameraError instanceof Error ? rearCameraError : new Error("Unknown camera error"));
          let description = 'Please enable camera permissions in your browser settings.';
          if (errorToReport.name === "NotAllowedError" || errorToReport.name === "PermissionDeniedError") {
              description = "Camera access was denied. Please enable permissions in your browser settings.";
          } else if (errorToReport.name === "NotFoundError" || errorToReport.name === "DevicesNotFoundError") {
              description = "No camera was found. Please ensure a camera is connected and enabled.";
          }  else if (errorToReport.name === "OverconstrainedError") {
              description = "Could not satisfy camera constraints. Your device might not have a suitable camera matching the request (e.g. rear camera).";
          } else {
              description = `Could not access camera: ${errorToReport.message}.`;
          }
          setCameraError(description);
          setHasCameraPermission(false);
          setIsCameraInitializing(false);
          toast({ variant: 'destructive', title: 'Camera Access Failed', description });
          return;
        }
      }

      stream = streamAttempt;
      setHasCameraPermission(true);
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
            videoElement.play().catch(playError => {
                console.error("Error playing video:", playError);
                // Potentially notify user if autoplay fails, though 'muted' usually helps.
            });
        };
      }
      setIsCameraInitializing(false);
    };

    if (showCameraView) {
      getCameraPermission();
    } else {
      setIsCameraInitializing(false);
      if (videoElement && videoElement.srcObject) {
        const mediaStream = videoElement.srcObject as MediaStream;
        mediaStream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
      }
      setHasCameraPermission(null);
    }

    return () => {
      setIsCameraInitializing(false);
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
      setShowCameraView(false); 
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
    setShowCameraView(false); // This will trigger useEffect cleanup for camera
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
          setShowCameraView(false); // Switch to preview view, triggers useEffect cleanup
        } catch (fileError) {
          console.error("Error creating file from data URL:", fileError);
          setError("Could not process captured image.");
          toast({ variant: 'destructive', title: 'Capture Error', description: 'Could not process the captured image.' });
        }
      }
    } else {
        setError("Camera not ready or permission denied.");
        toast({ variant: 'destructive', title: 'Camera Not Ready', description: 'Camera is not ready or permission was denied.' });
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
                <video ref={videoRef} className={`w-full h-full object-cover ${isCameraInitializing || hasCameraPermission === false || hasCameraPermission === null ? 'hidden' : ''}`} autoPlay playsInline muted />

                {isCameraInitializing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4 rounded-md">
                        <Loader2 className="w-10 h-10 animate-spin mb-3 text-primary" />
                        <p className="font-medium">Initializing Camera...</p>
                        <p className="text-xs text-gray-300">Attempting to access rear camera first.</p>
                    </div>
                )}

                {!isCameraInitializing && hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/90 text-destructive-foreground p-4 rounded-md text-center">
                        <VideoOff className="w-12 h-12 mb-3" />
                        <p className="font-semibold text-lg">Camera Access Problem</p>
                        <p className="text-sm">{cameraError || "Could not access the camera. Please check permissions and ensure a camera is connected."}</p>
                    </div>
                )}
                {/* Fallback for when camera is simply not active yet, but view is selected */}
                 {!isCameraInitializing && hasCameraPermission === null && showCameraView && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 rounded-md">
                        <VideoOff className="w-12 h-12 mb-2" />
                        <p>Camera is not active. Waiting for permission or device.</p>
                    </div>
                )}
            </div>
            
            {/* Persistent alert if there was a camera error, might be useful even if overlay hides */}
            {cameraError && hasCameraPermission === false && !isCameraInitializing && (
                 <Alert variant="destructive">
                    <VideoOff className="h-4 w-4" />
                    <AlertTitle>Camera Error</AlertTitle>
                    <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
            )}

            <Button onClick={handleCapturePhoto} disabled={!hasCameraPermission || isProcessing || isCameraInitializing} className="w-full">
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

        {previewUrl && !showCameraView && ( 
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


    