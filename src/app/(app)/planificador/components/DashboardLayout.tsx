'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  ChefHat, 
  Utensils,
  CheckCircle2,
  Plus,
  ArrowRight,
  BarChart3,
  Target,
  Activity
} from 'lucide-react';

interface DashboardLayoutProps {
  weekStats: {
    totalRecipes: number;
    uniqueRecipes: number;
    totalServings: number;
    totalTime: number;
    avgCalories: number;
    completionPercentage: number;
  };
  currentWeek: Date;
  onNavigateToPlanner: () => void;
}

// Circular Progress Component
const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, label, value, color = "#3b82f6" }: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  value: string;
  color?: string;
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-white/70 text-center">{label}</div>
      </div>
    </div>
  );
};

// Mini Calendar Component
const MiniCalendar = ({ currentWeek }: { currentWeek: Date }) => {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const days = getDaysInMonth(currentWeek);
  const today = new Date().getDate();
  const currentMonth = currentWeek.getMonth();
  const currentYear = currentWeek.getFullYear();
  const isCurrentMonth = new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;

  return (
    <div className="p-4">
      <div className="text-center mb-3">
        <h3 className="text-white font-semibold">
          {currentWeek.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </h3>
      </div>
      
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-white/60 p-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div
            key={index}
            className={`
              text-center text-sm p-1 rounded-md cursor-pointer transition-colors
              ${day === null ? '' : 'hover:bg-white/10'}
              ${day === today && isCurrentMonth ? 'bg-white/20 text-white font-bold' : 'text-white/80'}
            `}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

// Task Item Component
const TaskItem = ({ task, completed }: { task: string; completed: boolean }) => (
  <motion.div 
    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
    whileHover={{ scale: 1.02 }}
  >
    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
      completed ? 'bg-green-500 border-green-500' : 'border-white/30'
    }`}>
      {completed && <CheckCircle2 className="w-3 h-3 text-white" />}
    </div>
    <span className={`text-sm ${completed ? 'text-white/60 line-through' : 'text-white'}`}>
      {task}
    </span>
  </motion.div>
);

export default function DashboardLayout({ weekStats, currentWeek, onNavigateToPlanner }: DashboardLayoutProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock task data
  const tasks = [
    { id: 1, task: "Planificar desayunos de la semana", completed: true },
    { id: 2, task: "Hacer lista de compras", completed: false },
    { id: 3, task: "Preparar comidas del domingo", completed: false },
    { id: 4, task: "Revisar recetas nuevas", completed: true },
  ];

  const completedTasks = tasks.filter(t => t.completed).length;
  const taskCompletionPercentage = (completedTasks / tasks.length) * 100;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0" 
           style={{
             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)'
           }}>
        {/* Animated floating elements */}
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full opacity-20 animate-float"
             style={{
               background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
               backdropFilter: 'blur(60px)',
               animation: 'float 6s ease-in-out infinite'
             }} />
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full opacity-15 animate-float-delayed"
             style={{
               background: 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%)',
               backdropFilter: 'blur(60px)',
               animation: 'float 8s ease-in-out infinite 2s'
             }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-10 animate-pulse"
             style={{
               background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
               backdropFilter: 'blur(40px)'
             }} />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block p-6 rounded-3xl mb-4"
               style={{
                 background: 'rgba(255, 255, 255, 0.1)',
                 backdropFilter: 'blur(30px)',
                 WebkitBackdropFilter: 'blur(30px)',
                 border: '1px solid rgba(255, 255, 255, 0.2)',
                 boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)'
               }}>
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-white/80">Tu centro de control de planificación</p>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex space-x-2 p-2 rounded-2xl"
               style={{
                 background: 'rgba(255, 255, 255, 0.1)',
                 backdropFilter: 'blur(20px)',
                 border: '1px solid rgba(255, 255, 255, 0.1)'
               }}>
            {[
              { id: 'overview', label: 'Resumen', icon: BarChart3 },
              { id: 'calendar', label: 'Calendario', icon: Calendar },
              { id: 'progress', label: 'Progreso', icon: Target },
              { id: 'tasks', label: 'Tareas', icon: CheckCircle2 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                    selectedTab === tab.id 
                      ? 'bg-white/20 text-white shadow-lg' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Progress Overview - Large Panel */}
          <motion.div 
            className="lg:col-span-8 p-6 rounded-3xl"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)'
            }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Progreso Semanal</h2>
              <button 
                onClick={onNavigateToPlanner}
                className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
              >
                <span className="text-white text-sm">Ir al Planificador</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <CircularProgress
                percentage={weekStats.completionPercentage}
                label="Comidas Planificadas"
                value={`${weekStats.totalRecipes}/28`}
                color="#10b981"
              />
              <CircularProgress
                percentage={taskCompletionPercentage}
                label="Tareas Completadas"
                value={`${completedTasks}/${tasks.length}`}
                color="#3b82f6"
              />
              <CircularProgress
                percentage={Math.min((weekStats.uniqueRecipes / 15) * 100, 100)}
                label="Variedad de Recetas"
                value={`${weekStats.uniqueRecipes}`}
                color="#8b5cf6"
              />
            </div>
          </motion.div>

          {/* Calendar Panel */}
          <motion.div 
            className="lg:col-span-4 rounded-3xl"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)'
            }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <MiniCalendar currentWeek={currentWeek} />
          </motion.div>

          {/* Statistics Cards */}
          <motion.div 
            className="lg:col-span-6 grid grid-cols-2 gap-4"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="show"
          >
            {[
              { label: 'Tiempo Total', value: `${Math.round(weekStats.totalTime / 60)}h`, icon: Clock, color: '#f59e0b' },
              { label: 'Porciones', value: weekStats.totalServings, icon: Utensils, color: '#ef4444' },
              { label: 'Calorías Prom.', value: weekStats.avgCalories, icon: Activity, color: '#06b6d4' },
              { label: 'Recetas únicas', value: weekStats.uniqueRecipes, icon: ChefHat, color: '#84cc16' },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="p-4 rounded-2xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-white/80" />
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stat.color }}
                    />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Tasks Panel */}
          <motion.div 
            className="lg:col-span-6 p-6 rounded-3xl"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)'
            }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Tareas Pendientes</h3>
              <button className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task.task} completed={task.completed} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float 8s ease-in-out infinite 2s;
        }
      `}</style>
    </div>
  );
}