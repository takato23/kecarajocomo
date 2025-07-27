import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/services/logger';
import { 
  X, 
  Camera, 
  CameraOff, 
  Scan, 
  Package,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Simple toast function similar to the one in SimpleVoiceButton
function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } text-white p-4 rounded-lg shadow-lg z-50 max-w-sm`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const BarcodeScanner = React.memo<BarcodeScannerProps>(({
  isOpen,
  onClose,
  onScan,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Toast functionality handled by showToast function

  useEffect(() => {
    if (isOpen) {
      // Initialize code reader
      codeReaderRef.current = new BrowserMultiFormatReader();
      checkCameraPermission();
      
      return () => {
        // Cleanup
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
        }
        if (codeReaderRef.current) {
          codeReaderRef.current.reset();
        }
      };
    }
  }, [isOpen]);

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (error: unknown) {
      setHasPermission(false);
      showToast("Por favor permitir acceso a la cámara para escanear códigos", 'error');
    }
  };

  const startScanning = useCallback(() => {
    if (!webcamRef.current || !codeReaderRef.current) return;

    setIsScanning(true);
    let frameCount = 0;
    
    const scan = async () => {
      if (!isScanning) return;
      
      try {
        // Skip frames for performance (scan every 3rd frame)
        frameCount++;
        if (frameCount % 3 !== 0) {
          requestAnimationFrame(scan);
          return;
        }

        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc && codeReaderRef.current) {
          // Use createImageBitmap for better performance
          const response = await fetch(imageSrc);
          const blob = await response.blob();
          const bitmap = await createImageBitmap(blob);
          
          try {
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(bitmap, 0, 0);
              const result = await codeReaderRef.current!.decodeFromCanvas(canvas);
              
              if (result && result.getText() !== lastScanned) {
                const barcode = result.getText();
                setLastScanned(barcode);
                onScan(barcode);
                
                // Vibrate if available
                if ('vibrate' in navigator) {
                  navigator.vibrate(200);
                }
                
                showToast(`¡Código escaneado! ${barcode}`, 'success');
                
                // Stop scanning after successful scan
                stopScanning();
                return;
              }
            }
          } catch (error: unknown) {
            if (!(error instanceof NotFoundException)) {
              logger.error('Barcode scanning error:', 'BarcodeScanner', error);
            }
          } finally {
            bitmap.close();
          }
        }
      } catch (error: unknown) {
        logger.error('Screenshot error:', 'BarcodeScanner', error);
      }
      
      // Continue scanning
      if (isScanning) {
        requestAnimationFrame(scan);
      }
    };
    
    requestAnimationFrame(scan);
  }, [lastScanned, onScan, isScanning]);

  const stopScanning = () => {
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: { ideal: "environment" } // Use back camera on mobile
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-2xl"
        >
          <Card className="bg-card/95 backdrop-blur-lg border-primary/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Scan className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Scan Barcode</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {hasPermission === false && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Camera permission denied. Please enable camera access in your browser settings.
                  </AlertDescription>
                </Alert>
              )}

              {hasPermission && (
                <div className="relative">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-4 border-2 border-primary rounded-lg">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                      </div>
                      
                      {isScanning && (
                        <motion.div
                          initial={{ top: '1rem' }}
                          animate={{ top: 'calc(100% - 1rem)' }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            ease: 'linear'
                          }}
                          className="absolute left-4 right-4 h-1 bg-primary/50 rounded-full"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center gap-4">
                    {!isScanning ? (
                      <Button
                        onClick={startScanning}
                        className="gap-2"
                        size="lg"
                      >
                        <Camera className="h-5 w-5" />
                        Start Scanning
                      </Button>
                    ) : (
                      <Button
                        onClick={stopScanning}
                        variant="destructive"
                        className="gap-2"
                        size="lg"
                      >
                        <CameraOff className="h-5 w-5" />
                        Stop Scanning
                      </Button>
                    )}
                  </div>

                  {lastScanned && (
                    <Alert className="mt-4">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertDescription>
                        Last scanned: <strong>{lastScanned}</strong>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    <Package className="h-4 w-4 inline mr-1" />
                    Position the barcode within the frame to scan
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

BarcodeScanner.displayName = 'BarcodeScanner';