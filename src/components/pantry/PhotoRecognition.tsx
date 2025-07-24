import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  Check,
  AlertCircle,
  Scan,
  RefreshCw
} from 'lucide-react';
import Image from 'next/image';

import { Alert, AlertDescription } from '@/components/ui/alert';
// Simple toast function
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

import { FoodRecognitionService, RecognizedFood } from '@/services/foodRecognitionService';

interface PhotoRecognitionProps {
  isOpen: boolean;
  onClose: () => void;
  onRecognize: (foods: RecognizedFood[]) => void;
}

export const PhotoRecognition = React.memo<PhotoRecognitionProps>(({
  isOpen,
  onClose,
  onRecognize,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [recognizedFoods, setRecognizedFoods] = useState<RecognizedFood[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  // Toast functionality handled by showToast function

  // Initialize AI models when component mounts
  React.useEffect(() => {
    if (isOpen) {
      FoodRecognitionService.initialize().catch(console.error);
    }
    
    return () => {
      // Cleanup camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, stream]);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setRecognizedFoods([]);
    setSelectedFoods(new Set());

    try {
      // Create preview
      const preview = await FoodRecognitionService.processImageToBase64(file);
      setImagePreview(preview);

      // Create image element for AI processing
      const img = await FoodRecognitionService.createImageElement(file);
      
      // Detect food items
      const foods = await FoodRecognitionService.detectFood(img);
      
      if (foods.length === 0) {
        showToast("No se detectaron alimentos. Intenta con otra imagen más clara", 'error');
      } else {
        setRecognizedFoods(foods);
        // Auto-select all high-confidence items
        const autoSelected = new Set<number>();
        foods.forEach((food, index) => {
          if (food.confidence > 0.7) {
            autoSelected.add(index);
          }
        });
        setSelectedFoods(autoSelected);
        
        showToast(`¡Alimentos detectados! Se encontraron ${foods.length} alimentos en la imagen`, 'success');
      }
    } catch (error: unknown) {
      console.error('Error processing image:', error);
      showToast("Error al procesar la imagen. Por favor, intenta con otra imagen", 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processImage(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  });

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (error: unknown) {
      console.error('Error accessing camera:', error);
      showToast("Error al acceder a la cámara. Por favor, permite el acceso a la cámara", 'error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
            processImage(file);
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const toggleFoodSelection = (index: number) => {
    const newSelected = new Set(selectedFoods);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedFoods(newSelected);
  };

  const handleAddSelected = () => {
    const selected = recognizedFoods.filter((_, index) => selectedFoods.has(index));
    onRecognize(selected);
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    setImagePreview(null);
    setRecognizedFoods([]);
    setSelectedFoods(new Set());
    onClose();
  };

  const reset = () => {
    setImagePreview(null);
    setRecognizedFoods([]);
    setSelectedFoods(new Set());
    stopCamera();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden"
        >
          <iOS26LiquidCard variant="medium" className="p-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Camera className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Reconocimiento de Alimentos</h2>
                </div>
                <iOS26LiquidButton
                  variant="secondary"
                  size="sm"
                  onClick={handleClose}
                >
                  <X className="h-5 w-5" />
                </iOS26LiquidButton>
              </div>

              {/* Main Content */}
              <div className="space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                {!imagePreview && !isCameraActive && (
                  <div className="space-y-4">
                    {/* Upload Area */}
                    <div
                      {...getRootProps()}
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                        transition-colors duration-200
                        ${isDragActive 
                          ? 'border-primary bg-primary/10' 
                          : 'border-gray-300 hover:border-primary'
                        }
                      `}
                    >
                      <input {...getInputProps()} />
                      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">
                        {isDragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen aquí'}
                      </p>
                      <p className="text-sm text-gray-500">
                        o haz clic para seleccionar desde tu dispositivo
                      </p>
                    </div>

                    {/* Camera Option */}
                    <div className="flex justify-center gap-4">
                      <iOS26LiquidButton
                        variant="primary"
                        onClick={startCamera}
                        className="gap-2"
                      >
                        <Camera className="h-5 w-5" />
                        Usar Cámara
                      </iOS26LiquidButton>
                    </div>
                  </div>
                )}

                {/* Camera View */}
                {isCameraActive && (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-8 border-2 border-white/50 rounded-lg">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center gap-4">
                      <iOS26LiquidButton
                        variant="primary"
                        onClick={capturePhoto}
                        className="gap-2"
                        size="lg"
                      >
                        <Camera className="h-5 w-5" />
                        Capturar
                      </iOS26LiquidButton>
                      <iOS26LiquidButton
                        variant="secondary"
                        onClick={stopCamera}
                      >
                        Cancelar
                      </iOS26LiquidButton>
                    </div>
                  </div>
                )}

                {/* Image Preview */}
                {imagePreview && (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full rounded-lg"
                      />
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="text-white text-center">
                            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-2" />
                            <p>Analizando imagen...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recognized Foods */}
                    {recognizedFoods.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            Alimentos Detectados ({recognizedFoods.length})
                          </h3>
                          <iOS26LiquidButton
                            variant="secondary"
                            size="sm"
                            onClick={reset}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Nueva Imagen
                          </iOS26LiquidButton>
                        </div>

                        <div className="space-y-2">
                          {recognizedFoods.map((food, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <iOS26LiquidCard
                                variant="subtle"
                                className={`p-4 cursor-pointer transition-all ${
                                  selectedFoods.has(index) 
                                    ? 'ring-2 ring-primary' 
                                    : 'hover:ring-1 hover:ring-gray-300'
                                }`}
                                onClick={() => toggleFoodSelection(index)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`
                                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                                      ${selectedFoods.has(index) 
                                        ? 'bg-primary border-primary' 
                                        : 'border-gray-300'
                                      }
                                    `}>
                                      {selectedFoods.has(index) && (
                                        <Check className="h-3 w-3 text-white" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium">{food.spanishName}</p>
                                      <p className="text-sm text-gray-500">
                                        Categoría: {food.category}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`
                                      inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
                                      ${food.confidence > 0.8 
                                        ? 'bg-green-100 text-green-700' 
                                        : food.confidence > 0.6 
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                      }
                                    `}>
                                      <Scan className="h-3 w-3" />
                                      {Math.round(food.confidence * 100)}%
                                    </div>
                                  </div>
                                </div>
                              </iOS26LiquidCard>
                            </motion.div>
                          ))}
                        </div>

                        {selectedFoods.size > 0 && (
                          <iOS26LiquidButton
                            variant="primary"
                            onClick={handleAddSelected}
                            className="w-full"
                            glow
                          >
                            <Check className="h-5 w-5 mr-2" />
                            Agregar {selectedFoods.size} alimento{selectedFoods.size !== 1 ? 's' : ''}
                          </iOS26LiquidButton>
                        )}
                      </div>
                    )}

                    {!isProcessing && recognizedFoods.length === 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No se detectaron alimentos. Intenta con otra imagen más clara.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </div>
          </iOS26LiquidCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

PhotoRecognition.displayName = 'PhotoRecognition';