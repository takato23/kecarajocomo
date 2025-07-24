'use client';

import { PantryItemFormWithVoice } from './PantryItemFormWithVoice';

interface AddPantryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
}

export function AddPantryItemModal({ isOpen, onClose, onAdd }: AddPantryItemModalProps) {
  if (!isOpen) return null;

  return (
    <PantryItemFormWithVoice 
      onClose={onClose}
      onItemsAdded={(items) => {
        // Add each item individually
        items.forEach(item => onAdd(item));
        onClose();
      }}
    />
  );
}