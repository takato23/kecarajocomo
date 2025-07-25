'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, Plus, Grid3x3, CalendarDays, CalendarClock, X, ChefHat, Flame, Beef, Clock, Star } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface Comida {
  id: string
  nombre: string
  tipo: 'desayuno' | 'almuerzo' | 'cena' | 'snack'
  imagen?: string
  calorias?: number
  proteinas?: number
  carbohidratos?: number
  grasas?: number
  tiempo?: string
  descripcion?: string
  ingredientes?: string[]
  preparacion?: string[]
  rating?: number
}

interface ComidasDelDia {
  [key: string]: Comida[]
}

interface MealPlannerCalendarProps {
  comidas?: ComidasDelDia
  onAgregarComida?: (fecha: Date, tipoComida: string) => void
  onEliminarComida?: (fecha: Date, comidaId: string) => void
  onSoltarComida?: (fecha: Date, comida: Comida) => void
}

const tiposDeComida = [
  { 
    id: 'desayuno', 
    nombre: 'Desayuno', 
    icono: '🌅', 
    color: 'from-amber-400/90 via-orange-400/90 to-yellow-500/90',
    horaRecomendada: '7:00 - 9:00'
  },
  { 
    id: 'almuerzo', 
    nombre: 'Almuerzo', 
    icono: '☀️', 
    color: 'from-emerald-400/90 via-teal-400/90 to-cyan-500/90',
    horaRecomendada: '12:00 - 14:00'
  },
  { 
    id: 'cena', 
    nombre: 'Cena', 
    icono: '🌙', 
    color: 'from-purple-400/90 via-pink-400/90 to-rose-500/90',
    horaRecomendada: '19:00 - 21:00'
  },
  { 
    id: 'snack', 
    nombre: 'Snack', 
    icono: '🍿', 
    color: 'from-blue-400/90 via-indigo-400/90 to-violet-500/90',
    horaRecomendada: '16:00 - 17:00'
  }
]

const modosDVista = [
  { id: 'month', nombre: 'Mes', icono: Grid3x3 },
  { id: 'week', nombre: 'Semana', icono: CalendarDays },
  { id: 'day', nombre: 'Día', icono: CalendarClock }
]

// Mock data para demostración
const comidasEjemplo: { [key: string]: Comida } = {
  'tortilla-espanola': {
    id: 'tortilla-espanola',
    nombre: 'Tortilla Española',
    tipo: 'almuerzo',
    imagen: 'https://images.unsplash.com/photo-1568158879083-c42860933ed7?w=400',
    calorias: 320,
    proteinas: 18,
    carbohidratos: 24,
    grasas: 15,
    tiempo: '30 min',
    descripcion: 'Clásica tortilla de patatas con cebolla',
    rating: 4.8
  },
  'ensalada-mediterranea': {
    id: 'ensalada-mediterranea',
    nombre: 'Ensalada Mediterránea',
    tipo: 'cena',
    imagen: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
    calorias: 250,
    proteinas: 12,
    carbohidratos: 20,
    grasas: 18,
    tiempo: '15 min',
    descripcion: 'Fresca ensalada con tomate, pepino y feta',
    rating: 4.5
  },
  'avena-frutas': {
    id: 'avena-frutas',
    nombre: 'Avena con Frutas',
    tipo: 'desayuno',
    imagen: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400',
    calorias: 280,
    proteinas: 8,
    carbohidratos: 45,
    grasas: 6,
    tiempo: '10 min',
    descripcion: 'Bowl nutritivo de avena con frutas frescas',
    rating: 4.7
  }
}

export default function MealPlannerCalendar({ 
  comidas = {}, 
  onAgregarComida, 
  onEliminarComida, 
  onSoltarComida 
}: MealPlannerCalendarProps) {
  const [fechaActual, setFechaActual] = useState(new Date())
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null)
  const [modoVista, setModoVista] = useState<'month' | 'week' | 'day'>('month')
  const [comidaArrastrada, setComidaArrastrada] = useState<Comida | null>(null)
  const [fechaHover, setFechaHover] = useState<string | null>(null)
  const [mostrarDetalleComida, setMostrarDetalleComida] = useState<Comida | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Efectos líquidos con mouse
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [0, 1], [-8, 8])
  const rotateY = useTransform(mouseX, [0, 1], [8, -8])
  const scale = useTransform([mouseX, mouseY], ([x, y]) => {
    const distance = Math.sqrt(Math.pow(x - 0.5, 2) + Math.pow(y - 0.5, 2))
    return 1 + (0.02 * (1 - distance))
  })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        mouseX.set(x)
        mouseY.set(y)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const obtenerDiasAMostrar = () => {
    if (modoVista === 'month') {
      const inicio = startOfWeek(startOfMonth(fechaActual), { weekStartsOn: 1 })
      const fin = endOfWeek(endOfMonth(fechaActual), { weekStartsOn: 1 })
      return eachDayOfInterval({ start: inicio, end: fin })
    } else if (modoVista === 'week') {
      const inicio = startOfWeek(fechaActual, { weekStartsOn: 1 })
      const fin = endOfWeek(fechaActual, { weekStartsOn: 1 })
      return eachDayOfInterval({ start: inicio, end: fin })
    } else {
      return [fechaActual]
    }
  }

  const navegarAnterior = () => {
    if (modoVista === 'month') {
      setFechaActual(subMonths(fechaActual, 1))
    } else if (modoVista === 'week') {
      setFechaActual(addDays(fechaActual, -7))
    } else {
      setFechaActual(addDays(fechaActual, -1))
    }
  }

  const navegarSiguiente = () => {
    if (modoVista === 'month') {
      setFechaActual(addMonths(fechaActual, 1))
    } else if (modoVista === 'week') {
      setFechaActual(addDays(fechaActual, 7))
    } else {
      setFechaActual(addDays(fechaActual, 1))
    }
  }

  const obtenerComidasDelDia = (fecha: Date): Comida[] => {
    const claveDelDia = format(fecha, 'yyyy-MM-dd')
    return comidas[claveDelDia] || []
  }

  const iniciarArrastre = (comida: Comida) => {
    setComidaArrastrada(comida)
  }

  const terminarArrastre = () => {
    setComidaArrastrada(null)
  }

  const soltarComida = (fecha: Date) => {
    if (comidaArrastrada && onSoltarComida) {
      onSoltarComida(fecha, comidaArrastrada)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-7xl mx-auto p-4 sm:p-6">
      {/* Efectos de Fondo Liquid Glass */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Orbes de Gradiente Animados */}
        <motion.div 
          className="absolute top-0 left-0 w-96 h-96"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-transparent rounded-full blur-3xl" />
        </motion.div>
        
        <motion.div 
          className="absolute bottom-0 right-0 w-[500px] h-[500px]"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-full h-full bg-gradient-to-tl from-blue-500/30 via-cyan-500/20 to-transparent rounded-full blur-3xl" />
        </motion.div>
        
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px]"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className="w-full h-full bg-gradient-radial from-emerald-500/20 via-teal-500/10 to-transparent rounded-full blur-3xl" />
        </motion.div>
        
        {/* Partículas Flotantes */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-white/40 to-white/20 rounded-full"
            initial={{ 
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{
              x: [null, Math.random() * 100 + '%'],
              y: [null, Math.random() * 100 + '%'],
              scale: [null, Math.random() * 0.5 + 1, Math.random() * 0.5 + 0.5],
              opacity: [0.2, 0.6, 0.2]
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Efecto de Brillo Arcoíris */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-green-500/10 blur-3xl animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 blur-3xl animate-pulse delay-1000" />
        </div>
      </div>

      <motion.div
        className="relative"
        style={{
          rotateX: modoVista === 'month' ? rotateX : 0,
          rotateY: modoVista === 'month' ? rotateY : 0,
          scale: modoVista === 'month' ? scale : 1,
          transformPerspective: 1200
        }}
      >
        {/* Encabezado Ultra Premium */}
        <motion.div 
          className="mb-8 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Capas de Vidrio Líquido */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-3xl rounded-[2rem] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
            <div className="absolute inset-[1px] bg-black/50 backdrop-blur-2xl rounded-[1.9rem]" />
          </div>
          
          {/* Bordes Iridiscentes */}
          <div className="absolute inset-0 rounded-[2rem] overflow-hidden">
            <div className="absolute inset-0 opacity-60">
              <div className="absolute inset-[-2px] bg-gradient-conic from-purple-500 via-pink-500 to-purple-500 animate-spin-slow rounded-[2rem]" />
            </div>
            <div className="absolute inset-[2px] bg-black/90 rounded-[1.8rem]" />
          </div>
          
          <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Navegación del Calendario */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={navegarAnterior}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border border-white/20">
                  <ChevronLeft className="w-6 h-6 text-white" />
                </div>
              </motion.button>
              
              <motion.h2 
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/80 capitalize tracking-tight"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                {modoVista === 'month' && format(fechaActual, 'MMMM yyyy', { locale: es })}
                {modoVista === 'week' && `Semana del ${format(startOfWeek(fechaActual, { weekStartsOn: 1 }), 'd MMM', { locale: es })}`}
                {modoVista === 'day' && format(fechaActual, 'EEEE d MMMM', { locale: es })}
              </motion.h2>
              
              <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={navegarSiguiente}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border border-white/20">
                  <ChevronRight className="w-6 h-6 text-white" />
                </div>
              </motion.button>
            </div>

            {/* Selector de Modo de Vista */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl" />
              <div className="relative flex gap-1 p-1.5 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20">
                {modosDVista.map((modo) => (
                  <motion.button
                    key={modo.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setModoVista(modo.id as any)}
                    className="relative overflow-hidden"
                  >
                    {modoVista === modo.id && (
                      <motion.div
                        layoutId="activeView"
                        className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl"
                        transition={{ type: "spring", duration: 0.6 }}
                      />
                    )}
                    <div className={`
                      relative px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-all
                      ${modoVista === modo.id 
                        ? 'text-white' 
                        : 'text-white/60 hover:text-white'
                      }
                    `}>
                      <modo.icono className="w-5 h-5" />
                      <span className="font-medium hidden sm:inline">{modo.nombre}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grilla del Calendario */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Contenedor de Vidrio Líquido */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-3xl rounded-[2rem]" />
          <div className="absolute inset-[1px] bg-black/50 backdrop-blur-2xl rounded-[1.9rem]" />
          
          <div className="relative p-4 sm:p-6 lg:p-8">
            {/* Encabezados de Días de la Semana */}
            {modoVista !== 'day' && (
              <div className="grid grid-cols-7 gap-2 mb-6">
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dia) => (
                  <div key={dia} className="text-center">
                    <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                      {modoVista === 'month' ? dia.slice(0, 3) : dia}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Días del Calendario */}
            <div className={`
              grid gap-3
              ${modoVista === 'month' ? 'grid-cols-7' : ''}
              ${modoVista === 'week' ? 'grid-cols-7' : ''}
              ${modoVista === 'day' ? 'grid-cols-1' : ''}
            `}>
              {obtenerDiasAMostrar().map((fecha, index) => {
                const claveDia = format(fecha, 'yyyy-MM-dd')
                const comidasDelDia = obtenerComidasDelDia(fecha)
                const esMesActual = isSameMonth(fecha, fechaActual)
                const esHoy = isSameDay(fecha, new Date())
                const estaSeleccionado = fechaSeleccionada && isSameDay(fecha, fechaSeleccionada)

                return (
                  <motion.div
                    key={claveDia}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.01 }}
                    whileHover={{ scale: modoVista === 'day' ? 1 : 1.02 }}
                    onMouseEnter={() => setFechaHover(claveDia)}
                    onMouseLeave={() => setFechaHover(null)}
                    onClick={() => setFechaSeleccionada(fecha)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => soltarComida(fecha)}
                    className={`
                      relative group cursor-pointer
                      ${modoVista === 'day' ? 'min-h-[600px]' : modoVista === 'week' ? 'min-h-[400px]' : 'min-h-[150px]'}
                    `}
                  >
                    {/* Contenedor del Día */}
                    <div className={`
                      absolute inset-0 rounded-2xl overflow-hidden transition-all duration-500
                      ${!esMesActual && modoVista === 'month' ? 'opacity-30' : ''}
                    `}>
                      {/* Efectos de Vidrio */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl" />
                      <div className="absolute inset-[1px] bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-sm rounded-[15px]" />
                      
                      {/* Efecto Hover Líquido */}
                      <AnimatePresence>
                        {fechaHover === claveDia && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent rounded-[15px]" />
                            <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/20 via-cyan-500/10 to-transparent rounded-[15px]" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Indicadores de Hoy y Seleccionado */}
                      {esHoy && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-[15px]" />
                          <div className="absolute inset-0 ring-2 ring-blue-400/50 rounded-[15px]" />
                        </>
                      )}
                      {estaSeleccionado && (
                        <>
                          <div className="absolute inset-0 ring-2 ring-white/60 rounded-[15px]" />
                          <div className="absolute inset-[-1px] ring-1 ring-purple-400/50 rounded-[15px]" />
                        </>
                      )}
                    </div>

                    {/* Contenido del Día */}
                    <div className="relative h-full p-3 sm:p-4 flex flex-col">
                      {/* Número del Día */}
                      <div className="flex justify-between items-start mb-3">
                        <motion.span 
                          className={`
                            text-lg sm:text-xl font-bold
                            ${esHoy 
                              ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300' 
                              : 'text-white/90'
                            }
                          `}
                          whileHover={{ scale: 1.1 }}
                        >
                          {format(fecha, 'd')}
                        </motion.span>
                        
                        {/* Botón Agregar Comida */}
                        <motion.button
                          whileHover={{ scale: 1.2, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onAgregarComida) {
                              onAgregarComida(fecha, 'almuerzo')
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 rounded-xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border border-white/20"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </motion.button>
                      </div>

                      {/* Comidas del Día */}
                      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-none">
                        {tiposDeComida.map((tipoComida) => {
                          const comidasDelTipo = comidasDelDia.filter(c => c.tipo === tipoComida.id)
                          if (comidasDelTipo.length === 0 && modoVista === 'month') return null

                          return (
                            <div key={tipoComida.id} className={modoVista === 'day' ? 'mb-6' : ''}>
                              {modoVista === 'day' && (
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="text-2xl">{tipoComida.icono}</span>
                                  <div>
                                    <h4 className="text-base font-semibold text-white/90">{tipoComida.nombre}</h4>
                                    <p className="text-xs text-white/50">{tipoComida.horaRecomendada}</p>
                                  </div>
                                </div>
                              )}
                              
                              {comidasDelTipo.map((comida, idx) => (
                                <motion.div
                                  key={comida.id}
                                  layout
                                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                                  draggable
                                  onDragStart={() => iniciarArrastre(comida)}
                                  onDragEnd={terminarArrastre}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setMostrarDetalleComida(comida)
                                  }}
                                  className={`
                                    relative group/meal cursor-move overflow-hidden
                                    ${modoVista === 'day' ? 'mb-3' : 'mb-2'}
                                  `}
                                >
                                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                                    <div className={`absolute inset-0 bg-gradient-to-r ${tipoComida.color} opacity-90`} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                  </div>
                                  
                                  <div className={`relative ${modoVista === 'day' ? 'p-3' : 'p-2'} flex items-center gap-2`}>
                                    {modoVista !== 'day' && (
                                      <span className="text-sm">{tipoComida.icono}</span>
                                    )}
                                    
                                    {modoVista === 'day' && comida.imagen && (
                                      <img 
                                        src={comida.imagen} 
                                        alt={comida.nombre}
                                        className="w-12 h-12 rounded-lg object-cover border border-white/20"
                                      />
                                    )}
                                    
                                    <div className="flex-1">
                                      <span className={`
                                        ${modoVista === 'day' ? 'text-sm' : 'text-xs'} 
                                        font-medium text-white/95 line-clamp-1
                                      `}>
                                        {comida.nombre}
                                      </span>
                                      
                                      {modoVista === 'day' && (
                                        <div className="flex items-center gap-3 mt-1">
                                          {comida.calorias && (
                                            <span className="text-xs text-white/70 flex items-center gap-1">
                                              <Flame className="w-3 h-3" />
                                              {comida.calorias} cal
                                            </span>
                                          )}
                                          {comida.tiempo && (
                                            <span className="text-xs text-white/70 flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              {comida.tiempo}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {modoVista === 'day' && comida.rating && (
                                      <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                        <span className="text-xs text-white/80">{comida.rating}</span>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}

                              {/* Slot Vacío para Vista Día */}
                              {modoVista === 'day' && comidasDelTipo.length === 0 && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.3 }}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={() => soltarComida(fecha)}
                                  className="relative overflow-hidden rounded-xl border-2 border-dashed border-white/20 p-6 text-center hover:border-white/40 transition-colors"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0" />
                                  <Plus className="w-8 h-8 mx-auto mb-2 text-white/30" />
                                  <p className="text-sm text-white/50">Agregar comida</p>
                                  <p className="text-xs text-white/30 mt-1">o arrastra aquí</p>
                                </motion.div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Botón de Generación con IA */}
        <motion.div
          className="mt-8 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" />
            <div className="relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="relative px-8 py-4 flex items-center gap-3">
                <div className="relative">
                  <Sparkles className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-white blur-sm" />
                  </motion.div>
                </div>
                <span className="text-lg font-semibold text-white">Generar Plan Semanal con IA</span>
                <ChefHat className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* Leyenda de Comidas */}
        <motion.div
          className="mt-6 flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          {tiposDeComida.map((tipo) => (
            <div key={tipo.id} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
              <span className="text-lg">{tipo.icono}</span>
              <span className="text-sm text-white/70">{tipo.nombre}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Modal de Detalle de Comida */}
      <AnimatePresence>
        {mostrarDetalleComida && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setMostrarDetalleComida(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-3xl rounded-3xl" />
              <div className="absolute inset-[1px] bg-black/80 backdrop-blur-2xl rounded-[23px]" />
              
              <div className="relative p-6">
                {/* Encabezado */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{mostrarDetalleComida.nombre}</h3>
                    <p className="text-white/60">{mostrarDetalleComida.descripcion}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setMostrarDetalleComida(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </motion.button>
                </div>

                {/* Imagen */}
                {mostrarDetalleComida.imagen && (
                  <div className="relative h-48 mb-4 rounded-2xl overflow-hidden">
                    <img 
                      src={mostrarDetalleComida.imagen} 
                      alt={mostrarDetalleComida.nombre}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}

                {/* Información Nutricional */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {mostrarDetalleComida.calorias && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 text-center">
                      <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                      <p className="text-xs text-white/60">Calorías</p>
                      <p className="text-lg font-semibold text-white">{mostrarDetalleComida.calorias}</p>
                    </div>
                  )}
                  {mostrarDetalleComida.proteinas && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 text-center">
                      <Beef className="w-5 h-5 text-red-400 mx-auto mb-1" />
                      <p className="text-xs text-white/60">Proteínas</p>
                      <p className="text-lg font-semibold text-white">{mostrarDetalleComida.proteinas}g</p>
                    </div>
                  )}
                  {mostrarDetalleComida.carbohidratos && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 text-center">
                      <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-full mx-auto mb-1" />
                      <p className="text-xs text-white/60">Carbos</p>
                      <p className="text-lg font-semibold text-white">{mostrarDetalleComida.carbohidratos}g</p>
                    </div>
                  )}
                  {mostrarDetalleComida.grasas && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 text-center">
                      <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full mx-auto mb-1" />
                      <p className="text-xs text-white/60">Grasas</p>
                      <p className="text-lg font-semibold text-white">{mostrarDetalleComida.grasas}g</p>
                    </div>
                  )}
                </div>

                {/* Tiempo y Rating */}
                <div className="flex items-center justify-between">
                  {mostrarDetalleComida.tiempo && (
                    <div className="flex items-center gap-2 text-white/70">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{mostrarDetalleComida.tiempo}</span>
                    </div>
                  )}
                  {mostrarDetalleComida.rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${
                            i < Math.floor(mostrarDetalleComida.rating || 0) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-white/20'
                          }`} 
                        />
                      ))}
                      <span className="text-sm text-white/70 ml-1">{mostrarDetalleComida.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}