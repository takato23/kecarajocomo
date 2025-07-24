'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Receipt } from 'lucide-react';

import { ReceiptScanner } from '@/components/pantry/ReceiptScanner';

export default function ScanPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => router.back()}
            className="p-2 rounded-2xl bg-white/80 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Escanear Ticket
              </h1>
              <p className="text-gray-600">
                Sube una foto de tu ticket de compras para agregar productos automáticamente
              </p>
            </div>
          </div>
        </motion.div>

        {/* Scanner Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ReceiptScanner
            isOpen={true}
            onClose={() => router.back()}
          />
        </motion.div>
      </div>
    </div>
  );
}