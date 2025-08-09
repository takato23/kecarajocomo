"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { X, Camera, Loader2, AlertCircle } from "lucide-react";
import { logger } from '@/services/logger';

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      setHasPermission(true);
      
      // Stop the temporary stream
      stream.getTracks().forEach(track => track.stop());

      // Initialize the barcode reader
      readerRef.current = new BrowserMultiFormatReader();
      
      // Start scanning
      await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result, error) => {
          if (result) {
            const code = result.getText();

            onScan(code);
            stopScanner();
          }
          
          if (error && error.name !== 'NotFoundException') {
            logger.error('Barcode scan error:', 'BarcodeScanner', error);
          }
        }
      );
      
    } catch (err: unknown) {
      logger.error('Camera initialization error:', 'BarcodeScanner', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Se requiere permiso para acceder a la cámara');
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró una cámara disponible');
      } else {
        setError('Error al inicializar el escáner');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopScanner = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Escanear Código de Barras</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative">
          {isLoading && (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-gray-600">Iniciando cámara...</p>
              </div>
            </div>
          )}

          {!error && !isLoading && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover rounded-lg bg-black"
                autoPlay
                playsInline
                muted
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-32 border-2 border-primary rounded-lg relative">
                  {/* Corner indicators */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          {hasPermission === false && (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
              <Camera className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 text-center mb-4">
                Se requiere acceso a la cámara para escanear códigos de barras
              </p>
              <Button onClick={initializeScanner} size="sm">
                Solicitar Permiso
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Coloca el código de barras dentro del marco para escanearlo
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          {error && (
            <Button onClick={initializeScanner} className="flex-1">
              Reintentar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}