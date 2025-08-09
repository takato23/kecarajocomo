"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { logger } from '@/services/logger';
import { 
  Scan, 
  Package, 
  Search, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  Star
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { smartScanner, type ScanResult, type ScannedProduct } from "@/lib/services/smartScanner";

// Dynamically import the barcode scanner to avoid SSR issues
const BarcodeScanner = dynamic(
  () => import("./BarcodeScanner"),
  { ssr: false }
);

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (product: {
    name: string;
    category: string;
    unit: string;
    price?: number;
    barcode?: string;
  }) => void;
}

export default function ScannerModal({ isOpen, onClose, onProductSelect }: ScannerModalProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [manualProductName, setManualProductName] = useState("");

  const handleScan = useCallback(async (barcode: string) => {
    setScanning(true);
    setShowScanner(false);
    
    try {
      const result = await smartScanner.scanBarcode(barcode);
      setScanResult(result);
      
      if (result.success && result.product) {
        // Auto-select if confidence is high
        if (result.product.confidence > 0.8) {
          handleProductSelect(result.product);
        }
      }
    } catch (error: unknown) {
      setScanResult({
        success: false,
        error: "Error al procesar el código de barras"
      });
    } finally {
      setScanning(false);
    }
  }, []);

  const handleManualScan = async () => {
    if (!manualBarcode.trim()) return;
    
    setScanning(true);
    try {
      const result = await smartScanner.scanBarcode(manualBarcode.trim());
      setScanResult(result);
    } catch (error: unknown) {
      setScanResult({
        success: false,
        error: "Error al procesar el código de barras"
      });
    } finally {
      setScanning(false);
    }
  };

  const handleProductSelect = (product: ScannedProduct) => {
    onProductSelect({
      name: product.normalized.name,
      category: product.category,
      unit: product.normalized.unit,
      price: product.price,
      barcode: product.barcode
    });
    onClose();
  };

  const handleManualAssociation = async () => {
    if (!manualBarcode.trim() || !manualProductName.trim()) return;
    
    try {
      await smartScanner.associateBarcode(manualBarcode.trim(), manualProductName.trim());
      
      // Create a manual product result
      const manualProduct: ScannedProduct = {
        barcode: manualBarcode.trim(),
        name: manualProductName.trim(),
        category: "otros",
        unit: "un",
        confidence: 0.9,
        normalized: {
          name: manualProductName.trim().toLowerCase(),
          category: "otros",
          unit: "un"
        }
      };
      
      handleProductSelect(manualProduct);
    } catch (error: unknown) {
      logger.error("Error creating manual association:", 'ScannerModal', error);
    }
  };

  const resetModal = () => {
    setShowScanner(false);
    setScanning(false);
    setScanResult(null);
    setManualBarcode("");
    setManualProductName("");
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Escanear Producto</h3>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Scanner Options */}
          {!scanning && !scanResult && (
            <div className="space-y-4">
              <Button
                onClick={() => setShowScanner(true)}
                className="w-full"
                size="lg"
              >
                <Scan className="mr-2 h-5 w-5" />
                Escanear con Cámara
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">o</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-barcode">Código Manual</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-barcode"
                    placeholder="123456789"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                  />
                  <Button
                    onClick={handleManualScan}
                    disabled={!manualBarcode.trim()}
                    variant="outline"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {scanning && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-gray-600">Procesando código de barras...</p>
            </div>
          )}

          {/* Scan Results */}
          {scanResult && (
            <div className="space-y-4">
              {scanResult.success && scanResult.product ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">Producto Encontrado</CardTitle>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {Math.round(scanResult.product.confidence * 100)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium">{scanResult.product.name}</p>
                      {scanResult.product.brand && (
                        <p className="text-sm text-gray-600">Marca: {scanResult.product.brand}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Categoría:</span>
                        <p className="font-medium capitalize">{scanResult.product.category}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Unidad:</span>
                        <p className="font-medium">{scanResult.product.unit}</p>
                      </div>
                    </div>
                    
                    {scanResult.product.price && (
                      <div className="text-sm">
                        <span className="text-gray-600">Precio:</span>
                        <p className="font-medium">${scanResult.product.price.toFixed(2)}</p>
                      </div>
                    )}
                    
                    {scanResult.product.store && (
                      <div className="text-sm">
                        <span className="text-gray-600">Tienda:</span>
                        <p className="font-medium">{scanResult.product.store}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleProductSelect(scanResult.product!)}
                        className="flex-1"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Usar Producto
                      </Button>
                      <Button
                        onClick={() => setScanResult(null)}
                        variant="outline"
                      >
                        <Scan className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {scanResult.error || "No se pudo encontrar el producto"}
                    </AlertDescription>
                  </Alert>

                  {scanResult.suggestions && scanResult.suggestions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Sugerencias</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {scanResult.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => setManualProductName(suggestion)}
                            >
                              <Package className="mr-2 h-4 w-4" />
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Manual Association */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Asociar Manualmente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label htmlFor="manual-product">Nombre del Producto</Label>
                        <Input
                          id="manual-product"
                          placeholder="Ej: Leche La Serenísima 1L"
                          value={manualProductName}
                          onChange={(e) => setManualProductName(e.target.value)}
                        />
                      </div>
                      
                      <Button
                        onClick={handleManualAssociation}
                        disabled={!manualProductName.trim()}
                        className="w-full"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Crear Asociación
                      </Button>
                    </CardContent>
                  </Card>

                  <Button
                    onClick={() => setScanResult(null)}
                    variant="outline"
                    className="w-full"
                  >
                    <Scan className="mr-2 h-4 w-4" />
                    Escanear Nuevamente
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
    </>
  );
}