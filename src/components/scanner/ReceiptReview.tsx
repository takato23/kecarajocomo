"use client";

import { useState, useCallback } from "react";
import { 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  Plus,
  Package,
  DollarSign,
  Calendar,
  Store,
  Star,
  Eye,
  EyeOff
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReceiptData, ReceiptItem } from "@/lib/services/receiptOCR";

interface ReceiptReviewProps {
  receipt: ReceiptData;
  onConfirm: (items: ReceiptItem[]) => void;
  onCancel: () => void;
  onRetake: () => void;
  isProcessing: boolean;
}

export default function ReceiptReview({ 
  receipt, 
  onConfirm, 
  onCancel, 
  onRetake, 
  isProcessing 
}: ReceiptReviewProps) {
  const [items, setItems] = useState<ReceiptItem[]>(receipt.items);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);

  const handleItemToggle = useCallback((itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, selected: !item.selected } : item
    ));
  }, []);

  const handleItemEdit = useCallback((itemId: string, updates: Partial<ReceiptItem>) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
    setEditingItem(null);
  }, []);

  const handleItemDelete = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleAddItem = useCallback(() => {
    const newItem: ReceiptItem = {
      id: `new_${Date.now()}`,
      name: '',
      normalizedName: '',
      quantity: 1,
      unit: 'un',
      price: 0,
      category: 'otros',
      confidence: 1.0,
      rawText: '',
      selected: true
    };
    
    setItems(prev => [...prev, newItem]);
    setEditingItem(newItem.id);
  }, []);

  const handleConfirm = useCallback(() => {
    const selectedItems = items.filter(item => item.selected && item.name.trim());
    onConfirm(selectedItems);
  }, [items, onConfirm]);

  const selectedCount = items.filter(item => item.selected).length;
  const totalValue = items
    .filter(item => item.selected)
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800";
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "Alta";
    if (confidence >= 0.6) return "Media";
    return "Baja";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Revisar Ticket</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawText(!showRawText)}
            >
              {showRawText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Receipt Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {receipt.storeName && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Tienda</p>
                    <p className="font-medium">{receipt.storeName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {receipt.date && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Fecha</p>
                    <p className="font-medium">{receipt.date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {receipt.total && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-medium">${receipt.total.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Confidence Alert */}
        {receipt.confidence < 0.7 && (
          <Alert className="mb-4">
            <Star className="h-4 w-4" />
            <AlertDescription>
              La confianza de extracción es baja ({Math.round(receipt.confidence * 100)}%). 
              Revisa los items cuidadosamente antes de confirmar.
            </AlertDescription>
          </Alert>
        )}

        {/* Raw Text Toggle */}
        {showRawText && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm">Texto Extraído</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs whitespace-pre-wrap text-gray-600 bg-gray-50 p-3 rounded">
                {receipt.rawText}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Items List */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">
                Items Detectados ({selectedCount} seleccionados)
              </CardTitle>
              <Button onClick={handleAddItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`p-3 border rounded-lg ${
                  item.selected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                {editingItem === item.id ? (
                  <EditItemForm
                    item={item}
                    onSave={(updates) => handleItemEdit(item.id, updates)}
                    onCancel={() => setEditingItem(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleItemToggle(item.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <Badge className={getConfidenceColor(item.confidence)}>
                            {getConfidenceText(item.confidence)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            <Package className="h-3 w-3 inline mr-1" />
                            {item.quantity} {item.unit}
                          </span>
                          <span>
                            <DollarSign className="h-3 w-3 inline mr-1" />
                            ${item.price.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.category}
                          </span>
                        </div>
                        
                        {item.rawText && (
                          <p className="text-xs text-gray-400 mt-1">
                            "{item.rawText}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingItem(item.id)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleItemDelete(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se detectaron items. Puedes agregar items manualmente.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {selectedCount > 0 && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    {selectedCount} items seleccionados
                  </p>
                  <p className="font-medium">
                    Total: ${totalValue.toFixed(2)}
                  </p>
                </div>
                <Badge variant="secondary">
                  {Math.round(receipt.confidence * 100)}% confianza
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onRetake}
            disabled={isProcessing}
            className="flex-1"
          >
            Tomar Otra Foto
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || selectedCount === 0}
            className="flex-1"
          >
            {isProcessing ? (
              <>Agregando...</>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Agregar {selectedCount} Items
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EditItemFormProps {
  item: ReceiptItem;
  onSave: (updates: Partial<ReceiptItem>) => void;
  onCancel: () => void;
}

function EditItemForm({ item, onSave, onCancel }: EditItemFormProps) {
  const [formData, setFormData] = useState({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    price: item.price,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor="quantity">Cantidad</Label>
          <Input
            id="quantity"
            type="number"
            step="0.1"
            min="0"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="unit">Unidad</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="price">Precio</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
            required
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1">
          <Check className="h-3 w-3 mr-1" />
          Guardar
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          <X className="h-3 w-3 mr-1" />
          Cancelar
        </Button>
      </div>
    </form>
  );
}