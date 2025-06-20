
'use client';

import { useState, ChangeEvent, DragEvent, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { UploadCloud, XCircle, Camera, Video, VideoOff, Loader2, Sparkles } from 'lucide-react';
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
        streamAttempt = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch (rearCameraError) {
        console.warn("Failed to get rear camera (environment), trying default camera:", rearCameraError);
        try {
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
    setShowCameraView(false); 
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
          setShowCameraView(false); 
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
    <Card className="w-full shadow-xl border border-border/20 overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="font-headline text-2xl text-foreground">Upload or Capture Chart</CardTitle>
        <CardDescription>Drag & drop, select a file, or use your webcam.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Button variant={!showCameraView ? "default" : "outline"} onClick={() => { clearSelection(); setShowCameraView(false);}} className="flex-1 py-3 text-sm">
            <UploadCloud className="mr-2 h-5 w-5" /> Upload File
          </Button>
          <Button variant={showCameraView ? "default" : "outline"} onClick={() => { clearSelection(); setShowCameraView(true); }} className="flex-1 py-3 text-sm">
            <Camera className="mr-2 h-5 w-5" /> Use Webcam
          </Button>
        </div>

        {showCameraView ? (
          <div className="space-y-4">
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden relative flex items-center justify-center border border-border">
                <video ref={videoRef} className={`w-full h-full object-cover ${isCameraInitializing || hasCameraPermission === false || hasCameraPermission === null ? 'hidden' : ''}`} autoPlay playsInline muted />

                {isCameraInitializing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm text-foreground p-4 rounded-lg">
                        <Loader2 className="w-10 h-10 animate-spin mb-3 text-primary" />
                        <p className="font-semibold text-lg">Initializing Camera...</p>
                        <p className="text-xs text-muted-foreground">Attempting to access camera.</p>
                    </div>
                )}

                {!isCameraInitializing && hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/90 text-destructive-foreground p-4 rounded-lg text-center">
                        <VideoOff className="w-12 h-12 mb-3" />
                        <p className="font-semibold text-lg">Camera Access Problem</p>
                        <p className="text-sm">{cameraError || "Could not access the camera."}</p>
                    </div>
                )}
                 {!isCameraInitializing && hasCameraPermission === null && showCameraView && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 text-muted-foreground p-4 rounded-lg">
                        <VideoOff className="w-12 h-12 mb-2" />
                        <p>Waiting for camera permission...</p>
                    </div>
                )}
            </div>
            
            {cameraError && hasCameraPermission === false && !isCameraInitializing && (
                 <Alert variant="destructive" className="mt-2">
                    <VideoOff className="h-4 w-4" />
                    <AlertTitle>Camera Error</AlertTitle>
                    <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
            )}

            <Button 
              onClick={handleCapturePhoto} 
              disabled={!hasCameraPermission || isProcessing || isCameraInitializing} 
              className="w-full py-3 text-base transition-all duration-300 ease-in-out hover:shadow-glow-primary-hover focus:shadow-glow-primary-focus"
            >
              <Camera className="mr-2 h-5 w-5" /> Capture Photo
            </Button>
          </div>
        ) : (
          // File Upload View
          <div
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-all duration-200 ease-in-out min-h-[200px]
              ${isDragging ? 'border-primary bg-primary/10 ring-2 ring-primary/50' : 'border-border hover:border-primary/70'}
              ${error ? 'border-destructive bg-destructive/5' : ''}`}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {!previewUrl ? (
              <>
                <UploadCloud className={`w-16 h-16 mb-4 animate-float ${isDragging ? 'text-primary' : 'text-muted-foreground/70'}`} />
                <p className="mb-2 text-md text-center text-foreground">
                  <label htmlFor="chart-image-upload" className="font-semibold text-primary cursor-pointer hover:underline">
                    Click to upload
                  </label> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP (Max 5MB)</p>
                <Input
                  id="chart-image-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                  disabled={isProcessing}
                />
              </>
            ) : (
              <div className="relative w-full max-w-xs mx-auto text-center">
                <div className="overflow-hidden rounded-lg border border-border shadow-md">
                  <img
                    src={previewUrl}
                    alt="Chart preview"
                    width={320}
                    height={240}
                    className="object-contain max-h-[240px] w-full bg-muted/20"
                    data-ai-hint="chart diagram"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-3 -right-3 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-full h-8 w-8 shadow-lg transition-all hover:scale-110"
                  onClick={clearSelection}
                  disabled={isProcessing}
                  aria-label="Clear selection"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
                 {selectedFile && <p className="text-xs text-muted-foreground mt-3 truncate">File: {selectedFile.name}</p>}
              </div>
            )}
          </div>
        )}

        {error && !showCameraView && <p className="text-sm text-destructive text-center mt-2">{error}</p>}

        {previewUrl && !showCameraView && ( 
          <div className="text-center mt-6">
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isProcessing} 
              className="w-full sm:w-auto py-3 px-8 text-base font-semibold transition-all duration-300 ease-in-out hover:shadow-glow-primary-hover focus:shadow-glow-primary-focus disabled:hover:shadow-none"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              Analyze Chart with AI
            </Button>
          </div>
        )}
         {!previewUrl && !showCameraView && !error && (
            <p className="text-center text-xs text-muted-foreground mt-4">
                Upload an image of a financial chart for AI analysis.
            </p>
        )}
      </CardContent>
    </Card>
  );
}
