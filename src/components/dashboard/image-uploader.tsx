
'use client';

import { useState, ChangeEvent, DragEvent, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, XCircle, Camera, VideoOff, Loader2 } from 'lucide-react';
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
        toast({ variant: 'destructive', title: 'Camera Error', description: noDeviceError });
        return;
      }
      
      let streamAttempt: MediaStream | null = null;
      try {
        streamAttempt = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch (rearCameraError) {
        console.warn("Failed to get rear camera, trying default:", rearCameraError);
        try {
          streamAttempt = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (anyCameraError) {
          const errorToReport = anyCameraError instanceof Error ? anyCameraError : (rearCameraError instanceof Error ? rearCameraError : new Error("Unknown camera error"));
          let description = 'Please enable camera permissions.';
          if (errorToReport.name === "NotAllowedError" || errorToReport.name === "PermissionDeniedError") {
              description = "Camera access denied. Enable permissions.";
          } else if (errorToReport.name === "NotFoundError" || errorToReport.name === "DevicesNotFoundError") {
              description = "No camera found.";
          }  else if (errorToReport.name === "OverconstrainedError") {
              description = "Could not satisfy camera constraints.";
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
        videoElement.onloadedmetadata = () => { videoElement.play().catch(console.error); };
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
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large (Max 5MB).');
        setSelectedFile(null); setPreviewUrl(null); return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setError('Invalid file type (JPG, PNG, GIF, WEBP).');
        setSelectedFile(null); setPreviewUrl(null); return;
      }
      setError(null); setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
      setShowCameraView(false); 
    }
  };

  const handleUpload = () => {
    if (selectedFile && previewUrl) onImageUpload(selectedFile, previewUrl);
  };

  const clearSelection = () => {
    setSelectedFile(null); setPreviewUrl(null); setError(null); setShowCameraView(false); 
    const fileInput = document.getElementById('chart-image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl); const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  };

  const handleCapturePhoto = async () => {
    if (videoRef.current && canvasRef.current && hasCameraPermission) {
      const video = videoRef.current; const canvas = canvasRef.current;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        try {
            const file = await dataUrlToFile(dataUrl, `webcam-${Date.now()}.jpg`);
            setSelectedFile(file); setPreviewUrl(dataUrl); setError(null); setShowCameraView(false); 
        } catch (fileError) {
            setError("Could not process captured image.");
            toast({ variant: 'destructive', title: 'Capture Error', description: 'Could not process captured image.' });
        }
      }
    } else {
        setError("Camera not ready or permission denied.");
        toast({ variant: 'destructive', title: 'Camera Not Ready', description: 'Camera not ready or permission denied.' });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="p-3 md:p-4"> {/* Simplified padding */}
        <CardTitle className="text-lg">Upload or Capture Chart</CardTitle> {/* Simplified font */}
        <CardDescription className="text-sm">Drag & drop, select file, or use webcam.</CardDescription>
      </CardHeader>
      <CardContent className="p-3 md:p-4 space-y-3"> {/* Simplified padding & spacing */}
        <div className="grid grid-cols-2 gap-2"> {/* Simplified gap */}
          <Button variant={!showCameraView ? "default" : "outline"} onClick={() => { clearSelection(); setShowCameraView(false);}} className="py-2 text-sm">
            <UploadCloud className="mr-2 h-4 w-4" /> Upload File
          </Button>
          <Button variant={showCameraView ? "default" : "outline"} onClick={() => { clearSelection(); setShowCameraView(true); }} className="py-2 text-sm">
            <Camera className="mr-2 h-4 w-4" /> Use Webcam
          </Button>
        </div>

        {showCameraView ? (
          <div className="space-y-2"> {/* Simplified spacing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="w-full aspect-[4/3] bg-muted rounded overflow-hidden relative flex items-center justify-center border"> {/* Simpler rounded */}
                <video ref={videoRef} className={`w-full h-full object-cover ${isCameraInitializing || hasCameraPermission === false || hasCameraPermission === null ? 'hidden' : ''}`} autoPlay playsInline muted />
                {isCameraInitializing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2"> {/* Simpler padding */}
                        <Loader2 className="w-6 h-6 animate-spin mb-1" /> {/* Smaller loader */}
                        <p className="text-sm">Initializing...</p> {/* Simplified text */}
                    </div>
                )}
                {!isCameraInitializing && hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                        <VideoOff className="w-8 h-8 mb-1" /> {/* Smaller icon */}
                        <p className="text-sm font-semibold">Camera Problem</p>
                        <p className="text-xs">{cameraError || "Could not access camera."}</p>
                    </div>
                )}
                 {!isCameraInitializing && hasCameraPermission === null && showCameraView && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                        <VideoOff className="w-8 h-8 mb-1" />
                        <p className="text-sm">Waiting for camera...</p>
                    </div>
                )}
            </div>
            
            {cameraError && hasCameraPermission === false && !isCameraInitializing && (
                 <Alert variant="destructive" className="text-xs p-2"> {/* Simplified padding */}
                    <VideoOff className="h-3.5 w-3.5" /> {/* Smaller icon */}
                    <AlertTitle className="text-sm">Camera Error</AlertTitle>
                    <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
            )}

            <Button 
              onClick={handleCapturePhoto} 
              disabled={!hasCameraPermission || isProcessing || isCameraInitializing} 
              className="w-full py-2 text-sm" // Simplified
            >
              <Camera className="mr-2 h-4 w-4" /> Capture Photo
            </Button>
          </div>
        ) : (
          <div
            className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded min-h-[150px]
              ${isDragging ? 'border-primary bg-accent' : 'border-border hover:border-primary/30'}
              ${error ? 'border-destructive bg-destructive/10' : ''}`} // Simplified styling
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {!previewUrl ? (
              <>
                <UploadCloud className={`w-10 h-10 mb-2 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} /> {/* Simplified */}
                <p className="mb-1 text-sm text-center">
                  <label htmlFor="chart-image-upload" className="font-semibold cursor-pointer hover:underline">
                    Click to upload
                  </label> or drag & drop
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP (Max 5MB)</p>
                <Input
                  id="chart-image-upload" type="file" accept="image/*" // Simpler accept
                  onChange={handleFileChange} className="sr-only" disabled={isProcessing}
                />
              </>
            ) : (
              <div className="relative w-full max-w-[250px] mx-auto text-center"> {/* Simplified */}
                <div className="overflow-hidden rounded border bg-muted">
                  <img
                    src={previewUrl} alt="Chart preview"
                    style={{ maxHeight: '180px', width: '100%', objectFit: 'contain' }} // Simplified
                    data-ai-hint="chart diagram"
                  />
                </div>
                <Button
                  variant="destructive" size="icon"
                  className="absolute -top-1.5 -right-1.5 rounded-full h-6 w-6" // Simplified
                  onClick={clearSelection} disabled={isProcessing} aria-label="Clear selection"
                >
                  <XCircle className="h-3.5 w-3.5" /> {/* Smaller icon */}
                </Button>
                 {selectedFile && <p className="text-xs text-muted-foreground mt-1 truncate">File: {selectedFile.name}</p>}
              </div>
            )}
          </div>
        )}

        {error && !showCameraView && <p className="text-sm text-destructive text-center mt-1">{error}</p>}

        {previewUrl && !showCameraView && ( 
          <div className="text-center mt-3"> {/* Simplified margin */}
            <Button 
              onClick={handleUpload} disabled={!selectedFile || isProcessing} 
              className="w-full sm:w-auto py-2 px-5 text-sm" // Simplified
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Analyze Chart"}
            </Button>
          </div>
        )}
         {!previewUrl && !showCameraView && !error && (
            <p className="text-center text-xs text-muted-foreground mt-1">
                Upload a financial chart image.
            </p>
        )}
      </CardContent>
    </Card>
  );
}
