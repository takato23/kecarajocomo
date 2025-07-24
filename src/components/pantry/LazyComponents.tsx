import { lazy } from 'react';

// Lazy load heavy components for better performance
export const BarcodeScanner = lazy(() => 
  import('./BarcodeScanner').then(module => ({ 
    default: module.BarcodeScanner 
  }))
);

export const PhotoRecognition = lazy(() => 
  import('./PhotoRecognition').then(module => ({ 
    default: module.PhotoRecognition 
  }))
);

export const VoiceInput = lazy(() => 
  import('@/components/voice/VoiceInput').then(module => ({ 
    default: module.VoiceInput 
  }))
);