"use client";

import { useState, useCallback } from "react";
import { X, AlertCircle, Receipt, Loader2 } from "lucide-react";
import { logger } from '@/services/logger';

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { receiptOCR, ReceiptData, ReceiptItem } from "@/lib/services/receiptOCR";

import ReceiptCamera from "./ReceiptCamera";
import ReceiptReview from "./ReceiptReview";

interface ReceiptScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onItemsConfirmed: (items: ReceiptItem[]) => void;
}

type ScannerStep = 'camera' | 'processing' | 'review' | 'error';

export default function ReceiptScanner({ isOpen, onClose, onItemsConfirmed }: ReceiptScannerProps) {
  const [currentStep, setCurrentStep] = useState<ScannerStep>('camera');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);

  const handleImageCapture = useCallback(async (imageFile: File) => {
    setCapturedImage(imageFile);
    setCurrentStep('processing');
    setIsProcessing(true);
    setError(null);

    try {
      const result = await receiptOCR.processReceipt(imageFile);
      
      if (result.success && result.receipt) {
        // Validate and clean the extracted items
        const cleanedItems = receiptOCR.validateAndCleanItems(result.receipt.items);
        
        const processedReceipt = {
          ...result.receipt,
          items: cleanedItems
        };
        
        setReceipt(processedReceipt);
        setCurrentStep('review');
      } else {
        setError(result.error || 'Error procesando el ticket');
        setCurrentStep('error');
      }
    } catch (error: unknown) {
      logger.error('Receipt processing error:', 'ReceiptScanner', error);
      setError('Error inesperado procesando el ticket');
      setCurrentStep('error');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleItemsConfirmed = useCallback(async (items: ReceiptItem[]) => {
    setIsProcessing(true);
    
    try {
      // Add receipt tracking to database if needed
      if (receipt) {
        // This could be extended to store receipt data for future reference

      }
      
      onItemsConfirmed(items);
      resetScanner();
    } catch (error: unknown) {
      logger.error('Error confirming items:', 'ReceiptScanner', error);
      setError('Error agregando items a la despensa');
      setCurrentStep('error');
    } finally {
      setIsProcessing(false);
    }
  }, [receipt, onItemsConfirmed]);

  const handleRetake = useCallback(() => {
    setCurrentStep('camera');
    setReceipt(null);
    setError(null);
    setCapturedImage(null);
  }, []);

  const resetScanner = useCallback(() => {
    setCurrentStep('camera');
    setIsProcessing(false);
    setReceipt(null);
    setError(null);
    setCapturedImage(null);
    onClose();
  }, [onClose]);

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      resetScanner();
    }
  }, [isProcessing, resetScanner]);

  if (!isOpen) return null;

  return (
    <>
      {/* Processing Step */}
      {currentStep === 'processing' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Receipt className="h-12 w-12 text-primary" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-2">
                Procesando Ticket
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span className="text-sm text-gray-600">
                    Extrayendo texto con IA...
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Analizando imagen</span>
                      <span className="text-green-600">✓</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Extrayendo texto</span>
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Identificando productos</span>
                      <span className="text-gray-400">⏳</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Validando datos</span>
                      <span className="text-gray-400">⏳</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">
                  Esto puede tomar unos segundos...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Step */}
      {currentStep === 'error' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Error Procesando Ticket</h3>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Consejos para mejores resultados:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Asegúrate de que el ticket esté bien iluminado</li>
                  <li>• Evita sombras y reflejos</li>
                  <li>• Mantén el ticket plano y sin arrugas</li>
                  <li>• Incluye todo el contenido del ticket</li>
                  <li>• Usa buena resolución de cámara</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleRetake} className="flex-1">
                  Intentar Nuevamente
                </Button>
                <Button onClick={handleClose} variant="outline">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Step */}
      {currentStep === 'camera' && (
        <ReceiptCamera
          onCapture={handleImageCapture}
          onClose={handleClose}
          isProcessing={isProcessing}
        />
      )}

      {/* Review Step */}
      {currentStep === 'review' && receipt && (
        <ReceiptReview
          receipt={receipt}
          onConfirm={handleItemsConfirmed}
          onCancel={handleClose}
          onRetake={handleRetake}
          isProcessing={isProcessing}
        />
      )}
    </>
  );
}