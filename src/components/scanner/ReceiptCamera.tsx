"use client";

import { useRef, useState, useCallback } from "react";
import { 
  Camera, 
  Upload, 
  X, 
  RotateCcw, 
  Check, 
  AlertCircle,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReceiptCameraProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  isProcessing: boolean;
}

export default function ReceiptCamera({ onCapture, onClose, isProcessing }: ReceiptCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
      
    } catch (err: unknown) {
      console.error('Camera error:', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Se requiere permiso para acceder a la cámara');
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró una cámara disponible');
      } else {
        setError('Error al acceder a la cámara');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataURL);
    
    // Stop camera
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (!capturedImage) return;
    
    // Convert data URL to file
    const byteString = atob(capturedImage.split(',')[1]);
    const mimeString = capturedImage.split(',')[0].split(':')[1].split(';')[0];
    
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
    
    onCapture(file);
  }, [capturedImage, onCapture]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onCapture(file);
    }
  }, [onCapture]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Escanear Ticket</h3>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={isProcessing}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isProcessing && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-gray-600">Procesando ticket...</p>
          </div>
        )}

        {!isProcessing && (
          <>
            {/* Camera View */}
            {isStreaming && !capturedImage && (
              <div className="relative mb-4">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover rounded-lg bg-black"
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Camera overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4/5 h-3/4 border-2 border-white rounded-lg relative">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                    Alinea el ticket dentro del marco
                  </p>
                </div>
              </div>
            )}

            {/* Captured Image Preview */}
            {capturedImage && (
              <div className="mb-4">
                <img
                  src={capturedImage}
                  alt="Ticket capturado"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            {/* No Camera / Initial State */}
            {!isStreaming && !capturedImage && hasPermission !== false && (
              <div className="text-center py-8 mb-4">
                <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">
                  Usa la cámara para escanear tu ticket de compra
                </p>
                <Button onClick={startCamera} className="w-full mb-4">
                  <Camera className="mr-2 h-4 w-4" />
                  Abrir Cámara
                </Button>
              </div>
            )}

            {/* No Permission */}
            {hasPermission === false && (
              <div className="text-center py-8 mb-4">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
                <p className="text-gray-600 mb-4">
                  No se puede acceder a la cámara
                </p>
                <Button onClick={startCamera} variant="outline" className="w-full mb-4">
                  Intentar Nuevamente
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {isStreaming && !capturedImage && (
                <Button onClick={capturePhoto} className="w-full" size="lg">
                  <Camera className="mr-2 h-5 w-5" />
                  Tomar Foto
                </Button>
              )}

              {capturedImage && (
                <div className="flex gap-2">
                  <Button onClick={retakePhoto} variant="outline" className="flex-1">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Repetir
                  </Button>
                  <Button onClick={confirmPhoto} className="flex-1">
                    <Check className="mr-2 h-4 w-4" />
                    Confirmar
                  </Button>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">o</span>
                </div>
              </div>

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
                disabled={isProcessing}
              >
                <Upload className="mr-2 h-4 w-4" />
                Subir Imagen
              </Button>
            </div>

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Tips */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Consejos para mejores resultados:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Asegúrate de que el ticket esté bien iluminado</li>
                  <li>• Mantén el ticket plano y sin arrugas</li>
                  <li>• Incluye todo el contenido del ticket</li>
                  <li>• Evita sombras sobre el texto</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}