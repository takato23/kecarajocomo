"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save,
  Loader2,
  Package,
  Calendar,
  MapPin,
  DollarSign,
  Scan
} from "lucide-react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ScannerModal from "@/components/scanner/ScannerModal";
import ReceiptScanner from "@/components/scanner/ReceiptScanner";
import { ReceiptItem } from "@/lib/services/receiptOCR";

const LOCATION_OPTIONS = [
  { value: "pantry", label: "Despensa", icon: "📦" },
  { value: "fridge", label: "Heladera", icon: "🧊" },
  { value: "freezer", label: "Freezer", icon: "❄️" },
];

const UNIT_OPTIONS = [
  "g", "kg", "ml", "l", "un", "paq", "lata", "doc", "atado", "bolsa"
];

export default function AddPantryItemPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [formData, setFormData] = useState({
    ingredientName: "",
    quantity: 1,
    unit: "un",
    location: "pantry",
    expiryDate: "",
    notes: "",
    purchasePrice: "",
    purchaseDate: new Date().toISOString().split('T')[0],
    barcode: "",
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProductSelect = (product: {
    name: string;
    category: string;
    unit: string;
    price?: number;
    barcode?: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      ingredientName: product.name,
      unit: product.unit,
      purchasePrice: product.price?.toString() || "",
      barcode: product.barcode || "",
      notes: product.barcode ? `Código: ${product.barcode}` : prev.notes,
    }));
  };

  const handleReceiptItems = async (items: ReceiptItem[]) => {
    setLoading(true);
    
    try {
      const results = [];
      
      for (const item of items) {
        const response = await fetch("/api/pantry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ingredientName: item.normalizedName,
            quantity: item.quantity,
            unit: item.unit,
            location: "pantry", // Default location
            purchasePrice: item.price,
            purchaseDate: new Date().toISOString(),
            notes: `Agregado desde ticket - ${item.rawText}`,
          }),
        });
        
        if (response.ok) {
          results.push(await response.json());
        } else {
          console.error(`Error adding item: ${item.name}`);
        }
      }
      
      // Show success message and redirect
      const successCount = results.length;
      const totalCount = items.length;
      
      if (successCount === totalCount) {
        alert(`✅ Se agregaron ${successCount} items a la despensa`);
      } else {
        alert(`⚠️ Se agregaron ${successCount} de ${totalCount} items a la despensa`);
      }
      
      router.push("/pantry");
      
    } catch (error: unknown) {
      console.error("Error processing receipt items:", error);
      alert("Error procesando los items del ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch("/api/pantry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
          purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : null,
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
          barcode: formData.barcode || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      router.push("/pantry");
    } catch (error: unknown) {
      console.error("Error adding item:", error);
      alert("Error al agregar el item. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link href="/pantry">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a Despensa
                </Button>
              </Link>
            </div>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar Item
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Package className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agregar a Despensa</h1>
          <p className="text-gray-600">
            Añade un nuevo ingrediente a tu despensa
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ingredientName">Nombre del Ingrediente *</Label>
                <Input
                  id="ingredientName"
                  value={formData.ingredientName}
                  onChange={(e) => handleInputChange("ingredientName", e.target.value)}
                  placeholder="Ej: Leche, Pan, Tomate"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unidad</Label>
                  <select
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => handleInputChange("unit", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {UNIT_OPTIONS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {LOCATION_OPTIONS.map(location => (
                  <div
                    key={location.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.location === location.value
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange("location", location.value)}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{location.icon}</div>
                      <div className="font-medium">{location.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchaseDate">Fecha de Compra</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange("purchaseDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="purchasePrice" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Precio de Compra (opcional)
                </Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notas</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Ej: Marca específica, estado del producto, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScanner(true)}
                  className="flex-1"
                >
                  <Scan className="mr-2 h-4 w-4" />
                  Escanear Código
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReceiptScanner(true)}
                  className="flex-1"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Desde Ticket
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formData.barcode && (
                  <span className="text-green-600 font-medium">
                    Código escaneado: {formData.barcode}
                  </span>
                )}
                {!formData.barcode && "Escanea un código de barras o ticket para autocompletar"}
              </p>
            </CardContent>
          </Card>
        </form>
      </main>

      {/* Scanner Modal */}
      <ScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onProductSelect={handleProductSelect}
      />

      {/* Receipt Scanner */}
      <ReceiptScanner
        isOpen={showReceiptScanner}
        onClose={() => setShowReceiptScanner(false)}
        onItemsConfirmed={handleReceiptItems}
      />
    </div>
  );
}