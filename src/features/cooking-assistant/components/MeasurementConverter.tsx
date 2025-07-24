'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowRight, X } from 'lucide-react';

import { cn } from '@/lib/utils';

import { useCookingAssistantStore } from '../store/cookingAssistantStore';

import { GlassCard } from '@/components/dashboard/DashboardLayout';

interface MeasurementConverterProps {
  onClose: () => void;
}

export function MeasurementConverter({ onClose }: MeasurementConverterProps) {
  const [amount, setAmount] = useState('1');
  const [fromUnit, setFromUnit] = useState('cup');
  const [toUnit, setToUnit] = useState('ml');
  const [ingredient, setIngredient] = useState('');
  const [conversion, setConversion] = useState<any>(null);
  const [error, setError] = useState('');

  const { convertMeasurement, measurementSystem, switchMeasurementSystem } = useCookingAssistantStore();

  const volumeUnits = ['ml', 'l', 'tsp', 'tbsp', 'cup', 'fl oz', 'pint', 'quart', 'gallon'];
  const weightUnits = ['g', 'kg', 'oz', 'lb'];
  const temperatureUnits = ['celsius', 'fahrenheit'];

  const commonIngredients = [
    'flour', 'sugar', 'butter', 'milk', 'water', 'oil', 'honey', 'salt',
    'baking powder', 'vanilla extract', 'eggs', 'cream', 'yogurt', 'rice',
    'oats', 'cocoa powder', 'nuts', 'cheese', 'chocolate chips'
  ];

  const handleConvert = () => {
    try {
      setError('');
      const numAmount = parseFloat(amount);
      
      if (isNaN(numAmount) || numAmount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const result = convertMeasurement(numAmount, fromUnit, toUnit, ingredient);
      setConversion(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setConversion(null);
    }
  };

  const handleSwapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setConversion(null);
  };

  const handleQuickConversion = (fromU: string, toU: string, amt: string) => {
    setAmount(amt);
    setFromUnit(fromU);
    setToUnit(toU);
    
    setTimeout(() => {
      try {
        const result = convertMeasurement(parseFloat(amt), fromU, toU, ingredient);
        setConversion(result);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Conversion failed');
      }
    }, 100);
  };

  return (
    <GlassCard className="max-h-[80vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Calculator className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Measurement Converter</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Measurement system toggle */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Measurement System</span>
          <div className="flex bg-gray-700/50 rounded-lg p-1">
            <button
              onClick={() => switchMeasurementSystem('metric')}
              className={cn(
                "px-3 py-1 rounded text-sm transition-colors",
                measurementSystem === 'metric' 
                  ? "bg-purple-500 text-white" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              Metric
            </button>
            <button
              onClick={() => switchMeasurementSystem('imperial')}
              className={cn(
                "px-3 py-1 rounded text-sm transition-colors",
                measurementSystem === 'imperial' 
                  ? "bg-purple-500 text-white" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              Imperial
            </button>
          </div>
        </div>
      </div>

      {/* Converter form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Amount input */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount..."
            className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            step="0.01"
            min="0"
          />
        </div>

        {/* From unit */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">From</label>
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <optgroup label="Volume">
              {volumeUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </optgroup>
            <optgroup label="Weight">
              {weightUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </optgroup>
            <optgroup label="Temperature">
              {temperatureUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapUnits}
            className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* To unit */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">To</label>
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <optgroup label="Volume">
              {volumeUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </optgroup>
            <optgroup label="Weight">
              {weightUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </optgroup>
            <optgroup label="Temperature">
              {temperatureUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Ingredient (optional) */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Ingredient <span className="text-xs">(optional, helps with volume/weight conversion)</span>
          </label>
          <input
            type="text"
            value={ingredient}
            onChange={(e) => setIngredient(e.target.value)}
            placeholder="e.g., flour, sugar, butter..."
            className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            list="ingredients"
          />
          <datalist id="ingredients">
            {commonIngredients.map(ing => (
              <option key={ing} value={ing} />
            ))}
          </datalist>
        </div>

        {/* Convert button */}
        <button
          onClick={handleConvert}
          className="w-full p-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors font-medium"
        >
          Convert
        </button>

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Conversion result */}
        {conversion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-2">
                {conversion.converted_amount.toFixed(2)} {conversion.to_unit}
              </p>
              <p className="text-sm text-gray-400">
                {conversion.from_amount} {conversion.from_unit} = {conversion.converted_amount.toFixed(2)} {conversion.to_unit}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Conversion factor: {conversion.conversion_factor.toFixed(4)}
              </p>
            </div>
          </motion.div>
        )}

        {/* Quick conversions */}
        <div>
          <h3 className="text-sm text-gray-400 mb-3">Quick Conversions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { from: 'cup', to: 'ml', amount: '1' },
              { from: 'tbsp', to: 'ml', amount: '1' },
              { from: 'tsp', to: 'ml', amount: '1' },
              { from: 'oz', to: 'g', amount: '1' },
              { from: 'lb', to: 'kg', amount: '1' },
              { from: 'fahrenheit', to: 'celsius', amount: '350' }
            ].map((quick, index) => (
              <button
                key={index}
                onClick={() => handleQuickConversion(quick.from, quick.to, quick.amount)}
                className="p-2 bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600/50 rounded-lg text-sm text-gray-300 transition-colors"
              >
                {quick.amount} {quick.from} → {quick.to}
              </button>
            ))}
          </div>
        </div>

        {/* Common cooking conversions */}
        <div>
          <h3 className="text-sm text-gray-400 mb-3">Common Cooking Conversions</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>1 cup flour</span>
              <span>≈ 120g</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>1 cup sugar</span>
              <span>≈ 200g</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>1 cup butter</span>
              <span>≈ 227g</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>1 tbsp</span>
              <span>≈ 15ml</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>1 tsp</span>
              <span>≈ 5ml</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>1 oz</span>
              <span>≈ 28g</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default MeasurementConverter;