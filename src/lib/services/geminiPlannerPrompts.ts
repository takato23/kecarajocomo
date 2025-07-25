/**
 * Sistema de Prompts Holístico para Planificador con Gemini
 * Diseñado para aprovechar la ventana de contexto masiva de Gemini CLI
 */

import { UserPreferences, PlanningConstraints } from '../types/mealPlanning';

export interface GeminiPromptConfig {
  readonly contextFiles: string[];
  readonly analysisDepth: 'surface' | 'comprehensive' | 'deep_dive';
  readonly optimizationFocus: 'nutrition' | 'budget' | 'time' | 'sustainability' | 'holistic';
  readonly adaptationLevel: 'static' | 'dynamic' | 'learning';
}

export interface HolisticPlannerContext {
  readonly userState: {
    preferences: UserPreferences;
    constraints: PlanningConstraints;
    history: any[];
    feedback: any[];
  };
  readonly systemState: {
    pantryInventory: any[];
    recipeLibrary: any[];
    seasonalFactors: any;
    economicFactors: any;
  };
  readonly externalFactors: {
    weather: any;
    calendar: any;
    social: any;
    market: any;
  };
}

export class GeminiPlannerPrompts {
  
  /**
   * PROMPT MAESTRO - Análisis Holístico del Contexto
   * Utiliza @syntax para incluir todo el contexto relevante
   */
  static generateHolisticContextPrompt(config: GeminiPromptConfig): string {
    const contextIncludes = config.contextFiles.join(' ');
    
    return `
${contextIncludes}

# ANÁLISIS HOLÍSTICO DE PLANIFICACIÓN DE COMIDAS

Analiza COMPLETAMENTE el ecosistema KeCarajoComer para generar insights profundos:

## FASE 1: ANÁLISIS DE CONTEXTO INTEGRAL

### 1.1 Estado del Usuario
- **Perfil completo**: Preferencias, restricciones, objetivos, historial
- **Patrones de comportamiento**: Horarios, rutinas, hábitos alimentarios
- **Feedback histórico**: Recetas exitosas/fallidas, ajustes realizados
- **Evolución de gustos**: Cambios en preferencias a lo largo del tiempo

### 1.2 Inventario y Recursos
- **Despensa actual**: Productos disponibles con fechas de vencimiento
- **Equipamiento**: Electrodomésticos, utensilios, limitaciones de espacio
- **Presupuesto**: Límites actuales, flexibilidad, prioridades de gasto
- **Tiempo disponible**: Por día, por sesión de cocina, momentos de prep

### 1.3 Biblioteca de Recetas y Conocimiento
- **Recetas favoritas**: Historial de éxito, variaciones probadas
- **Recetas potenciales**: Nuevas opciones compatibles con perfil
- **Técnicas dominadas**: Habilidades culinarias, nivel de confianza
- **Oportunidades de aprendizaje**: Nuevas técnicas a introducir gradualmente

### 1.4 Factores Contextuales
- **Estacionalidad**: Productos de temporada, precios, disponibilidad
- **Calendario personal**: Eventos, compromisos, rutinas especiales
- **Factores sociales**: Comidas compartidas, preferencias familiares
- **Condiciones ambientales**: Clima, época del año, estado de ánimo

## FASE 2: SÍNTESIS E INSIGHTS

Basado en el análisis anterior, identifica:

1. **Oportunidades de optimización** no evidentes a primera vista
2. **Patrones ocultos** en preferencias y comportamientos
3. **Sinergias potenciales** entre diferentes aspectos del sistema
4. **Puntos de fricción** que limitan el éxito del planificador
5. **Innovaciones posibles** que podrían mejorar la experiencia

## FASE 3: RECOMENDACIONES ESTRATÉGICAS

Propone un enfoque holístico que:
- **Integre** todos los factores identificados
- **Optimice** múltiples variables simultáneamente  
- **Anticipe** necesidades futuras y cambios
- **Aprenda** de cada iteración para mejorar continuamente
- **Adapte** dinámicamente a circunstâncias cambiantes

FORMATO DE RESPUESTA: JSON estructurado con análisis completo y recomendaciones accionables.
`;
  }

  /**
   * PROMPT DE PLANIFICACIÓN INTELIGENTE
   * Genera plan semanal basado en análisis holístico
   */
  static generateIntelligentPlanningPrompt(context: HolisticPlannerContext): string {
    return `
# PLANIFICACIÓN INTELIGENTE DE COMIDAS - 7 DÍAS

Basado en el análisis holístico anterior, crea un plan de comidas que sea:

## CRITERIOS DE OPTIMIZACIÓN AVANZADA

### 1. **Despensa-First Strategy**
- Priorizar ingredientes con fechas de vencimiento próximas
- Maximizar utilización de productos ya disponibles
- Crear recetas que usen múltiples ingredientes de despensa
- Planificar compras complementarias mínimas

### 2. **Batch Cooking Intelligence**
- Identificar oportunidades de cocción en lote
- Planificar preparaciones que sirvan para múltiples comidas
- Optimizar uso de electrodomésticos y energía
- Crear "building blocks" culinarios versátiles

### 3. **Progressive Complexity Distribution**
- Distribuir carga de trabajo de forma inteligente durante la semana
- Alternar días de alta/baja intensidad culinaria
- Concentrar preparaciones complejas en momentos de mayor disponibilidad
- Crear buffer para días impredecibles

### 4. **Nutrition Cycling & Periodization**
- Variar perfiles nutricionales según necesidades diarias
- Sincronizar con rutinas de ejercicio y actividad
- Balancear macronutrientes a lo largo de la semana
- Integrar micronutrientes estratégicamente

### 5. **Budget Optimization Matrix**
- Maximizar valor nutricional por peso invertido
- Aprovechar ofertas y productos de temporada
- Calcular costo por porción y por nutriente
- Identificar substituciones económicas inteligentes

### 6. **Leftover Integration System**
- Planificar reutilización creativa de sobras
- Crear "recetas puente" que conecten comidas
- Transformar ingredientes base en múltiples presentaciones
- Minimizar desperdicios mediante planning inteligente

## ESTRUCTURA DEL PLAN SEMANAL

\`\`\`json
{
  "week_metadata": {
    "theme": "Tema/enfoque de la semana",
    "nutrition_philosophy": "Enfoque nutricional dominante",
    "prep_strategy": "Estrategia de preparación",
    "budget_approach": "Enfoque presupuestario",
    "learning_goals": ["Nuevas técnicas/ingredientes a introducir"],
    "success_metrics": ["Métricas para evaluar éxito de la semana"]
  },
  
  "daily_plans": [
    {
      "day": "lunes",
      "day_profile": {
        "energy_requirement": "high|medium|low",
        "time_availability": "abundant|moderate|limited", 
        "social_context": "solo|family|social",
        "activity_level": "sedentary|active|intense"
      },
      
      "meals": {
        "breakfast": {
          "recipe": {
            "name": "Nombre del plato",
            "description": "Descripción apetitosa y motivadora",
            "ingredients": [
              {
                "name": "ingrediente",
                "quantity": 200,
                "unit": "g",
                "source": "despensa|compra|sobrante",
                "cost_impact": "low|medium|high",
                "nutrition_contribution": "Aporte nutricional principal"
              }
            ],
            "instructions": [
              {
                "step": 1,
                "action": "Descripción del paso",
                "time": 5,
                "technique": "Técnica culinaria utilizada",
                "tips": ["Consejos específicos"],
                "prep_ahead": "Qué se puede preparar con anticipación"
              }
            ],
            "nutrition_profile": {
              "calories": 400,
              "protein": 20,
              "carbs": 45,
              "fat": 15,
              "fiber": 8,
              "key_nutrients": ["vitamina C", "hierro", "calcio"]
            },
            "timing": {
              "prep_time": 10,
              "cook_time": 15,
              "total_active_time": 25,
              "passive_time": 0
            }
          },
          
          "contextual_optimization": {
            "energy_alignment": "Cómo se alinea con necesidades energéticas del día",
            "prep_synergy": "Sinergias con otras preparaciones del día/semana",
            "leftover_integration": "Cómo utiliza/genera sobras estratégicamente",
            "skill_development": "Habilidades que desarrolla/refuerza"
          },
          
          "adaptability": {
            "quick_version": "Versión de 10 minutos para días apurados",
            "make_ahead": "Cómo preparar con anticipación",
            "scaling": "Cómo ajustar porciones fácilmente",
            "substitutions": {"ingrediente": ["alternativa1", "alternativa2"]}
          }
        },
        
        "lunch": { /* Estructura similar */ },
        "dinner": { /* Estructura similar */ },
        "snacks": [
          {
            "name": "Snack opcinal",
            "when": "media mañana|media tarde",
            "purpose": "energía|saciedad|antojo|nutrientes",
            "quick_prep": true
          }
        ]
      },
      
      "day_strategy": {
        "prep_tasks": ["Tareas de preparación para este día"],
        "advance_prep": ["Preparaciones para días futuros"],
        "leftover_management": ["Cómo manejar sobras generadas"],
        "shopping_needs": ["Compras de último momento si son necesarias"],
        "time_optimization": ["Estrategias para optimizar tiempo"],
        "energy_management": ["Cómo distribuir energía culinaria"]
      }
    }
    // ... resto de días con estructura similar
  ],
  
  "week_integration": {
    "shopping_strategy": {
      "primary_shop": {
        "day": "sábado|domingo",
        "focus": "Compra principal de la semana",
        "categories": ["proteínas", "granos", "enlatados", "congelados"],
        "estimated_time": 60,
        "estimated_cost": 0
      },
      "fresh_top_ups": [
        {
          "day": "miércoles",
          "focus": "Productos frescos de media semana",
          "items": ["verduras de hoja", "frutas", "lácteos"],
          "estimated_time": 20,
          "estimated_cost": 0
        }
      ],
      "emergency_substitutions": {
        "common_missing": {"pollo": ["huevos", "lentejas"], "arroz": ["quinoa", "pasta"]},
        "quick_alternatives": "Opciones para reemplazos de último momento"
      }
    },
    
    "prep_calendar": {
      "sunday_batch_session": {
        "duration": 120,
        "tasks": [
          "Cocinar granos base (arroz, quinoa)",
          "Preparar proteínas marinadas", 
          "Hacer salsas y aderezos base",
          "Cortar verduras para 3 días",
          "Preparar snacks de la semana"
        ],
        "setup": "Organización de espacios y herramientas",
        "cleanup": "Estrategia de limpieza eficiente"
      },
      
      "weekday_optimization": {
        "monday": "Ensamblar usando preparaciones del domingo",
        "tuesday": "Utilizar sobras del lunes creativamente",
        "wednesday": "Refresh de verduras + nueva preparación simple",
        "thursday": "Batch cooking menor para fin de semana",
        "friday": "Usar últimos frescos + preparar fin de semana",
        "weekend": "Experimentación y comidas sociales"
      }
    },
    
    "nutrition_cycling": {
      "weekly_balance": {
        "protein_distribution": "Cómo se distribuyen proteínas en la semana",
        "carb_timing": "Cuándo priorizar carbohidratos",
        "fat_sources": "Variedad de fuentes de grasas saludables",
        "micronutrient_coverage": "Cobertura de vitaminas y minerales"
      },
      
      "energy_periodization": {
        "high_energy_days": ["lunes", "miércoles", "viernes"],
        "recovery_days": ["martes", "jueves"],
        "social_days": ["sábado", "domingo"],
        "rationale": "Por qué esta distribución optimiza energía"
      }
    },
    
    "sustainability_measures": {
      "waste_minimization": [
        "Estrategias específicas para reducir desperdicios",
        "Aprovechamiento de partes no tradicionales",
        "Compostaje de desechos orgánicos"
      ],
      "seasonal_alignment": [
        "Productos de temporada priorizados",
        "Conservación y preservación",
        "Apoyo a productores locales"
      ],
      "resource_efficiency": [
        "Optimización de energía en cocción",
        "Reutilización de agua de cocción",
        "Minimización de packaging"
      ]
    }
  },
  
  "learning_integration": {
    "skill_development": {
      "this_week_focus": "Habilidad principal a desarrollar",
      "practice_opportunities": ["Dónde practicar en el plan"],
      "progression_path": "Cómo esta semana conecta con objetivos a largo plazo"
    },
    
    "experimentation": {
      "safe_experiments": ["Pequeños experimentos con bajo riesgo"],
      "ingredient_exploration": ["Nuevos ingredientes a probar"],
      "technique_trials": ["Nuevas técnicas a experimentar"]
    },
    
    "feedback_collection": {
      "taste_tracking": "Qué evaluar en términos de sabor",
      "efficiency_metrics": "Qué medir en términos de tiempo/esfuerzo",
      "satisfaction_indicators": "Cómo evaluar satisfacción general",
      "adaptation_notes": "Qué ajustar para la próxima semana"
    }
  },
  
  "contingency_planning": {
    "time_crunch_alternatives": {
      "15_minute_meals": ["Opciones ultra-rápidas por día"],
      "no_cook_options": ["Alternativas sin cocción"],
      "delivery_backups": ["Opciones de delivery saludables"]
    },
    
    "ingredient_unavailability": {
      "critical_substitutions": {"ingrediente_clave": "sustitutos"},
      "recipe_adaptations": "Cómo adaptar recetas si faltan ingredientes",
      "emergency_meals": "Comidas de emergencia con ingredientes básicos"
    },
    
    "energy_level_adjustments": {
      "low_energy_days": "Simplificaciones para días difíciles",
      "high_motivation_opportunities": "Aprovechamiento de días con más energía",
      "flexible_complexity": "Cómo ajustar complejidad día a día"
    }
  }
}
\`\`\`

## VALIDACIÓN Y COHERENCIA

Asegúrate de que el plan:
1. **Utilice realmente** los ingredientes de despensa disponibles
2. **Respete completamente** las restricciones dietarias y preferencias
3. **Sea factible** con el tiempo y equipamiento disponible
4. **Mantenga coherencia** nutricional y presupuestaria
5. **Incluya variedad** suficiente para mantener interés
6. **Genere aprendizaje** sin sobrecargar con complejidad
`;
  }

  /**
   * PROMPT DE ANÁLISIS DE FACTORES EXTERNOS
   */
  static generateExternalFactorsPrompt(): string {
    return `
@./src/features/ @./src/services/ @./src/lib/

# ANÁLISIS DE FACTORES EXTERNOS PARA PLANIFICACIÓN

Analiza el contexto externo completo que impacta la planificación de comidas:

## 1. FACTORES ESTACIONALES Y AMBIENTALES

### 1.1 Estacionalidad de Productos
- **Productos de temporada actual**: Disponibilidad, calidad, precios
- **Transición estacional**: Productos que están saliendo/entrando
- **Calidad peak**: Cuándo cada producto está en su mejor momento
- **Ventanas de oportunidad**: Momentos para aprovechar precios bajos

### 1.2 Condiciones Climáticas
- **Temperatura ambiente**: Impacto en apetito y preferencias
- **Humedad**: Afecta conservación y métodos de cocción preferidos
- **Estación del año**: Influencia en tipos de comida deseada
- **Patrones climáticos**: Predicciones que afectan planning

## 2. FACTORES ECONÓMICOS Y DE MERCADO

### 2.1 Análisis de Precios
- **Tendencias de inflación**: En categorías alimentarias específicas
- **Ofertas y promociones**: Oportunidades de ahorro identificadas
- **Comparación de precios**: Entre diferentes supermercados/proveedores
- **Valor nutricional por peso**: Optimización de compras

### 2.2 Disponibilidad de Productos
- **Stock limitations**: Productos con disponibilidad limitada
- **Importaciones vs. locales**: Preferencias por productos nacionales
- **Nuevos productos**: Innovaciones en el mercado relevantes
- **Discontinuaciones**: Productos que están dejando de venderse

## 3. FACTORES TEMPORALES Y DE RUTINA

### 3.1 Calendario Personal
- **Eventos especiales**: Cumpleaños, celebraciones, reuniones
- **Rutinas de trabajo**: Horarios variables, viajes, compromisos
- **Actividades físicas**: Entrenamientos, deportes, actividades intensas
- **Compromisos sociales**: Comidas compartidas, invitaciones

### 3.2 Ritmos Biológicos
- **Ciclos de energía**: Momentos de alta/baja energía culinaria
- **Patrones de apetito**: Variaciones según día de la semana
- **Necesidades nutricionales**: Fluctuaciones según actividad
- **Preferencias temporales**: Qué se antoja en diferentes momentos

## 4. FACTORES SOCIALES Y FAMILIARES

### 4.1 Dinámicas Familiares
- **Preferencias del grupo**: Consensos y divergencias familiares
- **Colaboración en cocina**: Quién puede ayudar y cuándo
- **Horarios de comida**: Sincronización de horarios familiares
- **Ocasiones especiales**: Tradiciones y celebraciones familiares

### 4.2 Influencias Externas
- **Tendencias culinarias**: Nuevas técnicas o ingredientes populares
- **Recomendaciones sociales**: Sugerencias de amigos/familia
- **Medios e inspiración**: Influencias de redes sociales, TV, etc.
- **Comunidad local**: Eventos gastronómicos, mercados, ferias

## 5. FACTORES DE SALUD Y BIENESTAR

### 5.1 Estado de Salud
- **Condiciones médicas**: Requerimientos dietarios específicos
- **Medicamentos**: Interacciones con alimentos
- **Objetivos de salud**: Pérdida/ganancia de peso, mejora energética
- **Intolerancias emergentes**: Cambios en tolerancia a alimentos

### 5.2 Estados Emocionales
- **Stress levels**: Impacto en preferencias y capacidad culinaria
- **Motivación culinaria**: Períodos de alta/baja motivación
- **Comfort food needs**: Necesidades emocionales específicas
- **Celebración vs. disciplina**: Balance entre disfrute y objetivos

## SÍNTESIS DE ADAPTACIONES INTELIGENTES

Basado en el análisis anterior, genera adaptaciones que:

1. **Aprovechen oportunidades** identificadas en factores externos
2. **Mitiguen limitaciones** impuestas por restricciones temporales
3. **Se sincronicen** con ritmos naturales y rutinas
4. **Integren influencias positivas** del entorno social
5. **Respondan proactivamente** a cambios en el contexto

FORMATO: JSON con análisis detallado y recomendaciones de adaptación específicas.
`;
  }

  /**
   * PROMPT DE OPTIMIZACIÓN DE RECURSOS
   */
  static generateResourceOptimizationPrompt(): string {
    return `
# OPTIMIZACIÓN AVANZADA DE RECURSOS CULINARIOS

Analiza y optimiza TODOS los recursos disponibles para maximizar eficiencia:

## 1. ANÁLISIS COMPLETO DE RECURSOS

### 1.1 Tiempo Disponible
- **Tiempo diario para cocina**: Por día de la semana, por momento del día
- **Ventanas de preparación**: Cuándo es más eficiente cocinar
- **Tiempo de calidad vs. cantidad**: Momentos de alta concentración
- **Multitasking opportunities**: Qué se puede hacer simultáneamente

### 1.2 Equipamiento y Herramientas
- **Electrodomésticos disponibles**: Capacidades y limitaciones
- **Utensilios básicos**: Estado y eficiencia de herramientas
- **Espacios de trabajo**: Limitaciones de mesada, almacenamiento
- **Equipamiento faltante**: Qué podría mejorar significativamente la eficiencia

### 1.3 Espacios de Almacenamiento
- **Refrigerador**: Capacidad, organización, zonas de temperatura
- **Freezer**: Espacio disponible, sistema de rotación
- **Despensa**: Organización, accesibilidad, condiciones de conservación
- **Espacios temporales**: Dónde dejar preparaciones en proceso

### 1.4 Presupuesto y Flexibilidad Financiera
- **Presupuesto semanal/mensual**: Límites firmes vs. flexibles
- **Distribución de gastos**: Prioridades en diferentes categorías
- **Oportunidades de ahorro**: Dónde se puede economizar sin sacrificar calidad
- **Inversiones útiles**: Compras únicas que mejoran eficiencia a largo plazo

### 1.5 Habilidades y Conocimiento
- **Técnicas dominadas**: Qué se hace con confianza y rapidez
- **Áreas de mejora**: Habilidades que podrían desarrollarse
- **Conocimiento de ingredientes**: Familiaridad con productos y sustituciones
- **Experiencia en planificación**: Qué funciona bien históricamente

### 1.6 Apoyo y Colaboración
- **Ayuda familiar**: Quién puede contribuir, en qué tareas, cuándo
- **Distribución de responsabilidades**: Cómo dividir tareas eficientemente
- **Coordinación de horarios**: Sincronización para máxima eficiencia
- **Enseñanza y delegación**: Cómo capacitar para mayor autonomía

## 2. ESTRATEGIAS DE OPTIMIZACIÓN AVANZADA

### 2.1 Técnicas de Cocción Múltiple
- **One-pot meals**: Comidas completas en una sola olla
- **Cocción escalonada**: Usar un método para múltiples preparaciones
- **Aprovechamiento de calor residual**: Utilizar calor de otras cocciones
- **Cocción en tandas**: Optimizar uso de hornos y equipos grandes

### 2.2 Ingredientes Versátiles y Multifuncionales
- **Base ingredients**: Componentes que sirven para múltiples platos
- **Flavor builders**: Ingredientes que aportan sabor a muchas preparaciones
- **Texture providers**: Componentes que aportan textura versátil
- **Nutrition boosters**: Ingredientes que mejoran perfil nutricional fácilmente

### 2.3 Preparación en Cascada
- **Sequential prep**: Cada preparación alimenta la siguiente
- **Waste stream utilization**: Usar descartes de una preparación en otra
- **Flavor layering**: Construir sabores a lo largo de múltiples pasos
- **Efficiency chains**: Cadenas de preparación que se potencian mutuamente

### 2.4 Almacenamiento Inteligente
- **Optimal storage conditions**: Mejores condiciones para cada tipo de alimento
- **Rotation systems**: Sistemas para usar productos en orden óptimo
- **Portion planning**: Almacenar en porciones útiles para el futuro
- **Label and date systems**: Organización que previene desperdicios

### 2.5 Escalabilidad y Flexibilidad
- **Batch size optimization**: Tamaños óptimos para diferentes preparaciones
- **Scaling formulas**: Cómo ajustar recetas fácil y precisamente
- **Modular cooking**: Preparaciones que se pueden combinar flexiblemente
- **Leftover integration**: Sistemas para incorporar sobras sin repetición

## 3. PLAN DE OPTIMIZACIÓN PERSONALIZADO

\`\`\`json
{
  "resource_assessment": {
    "time_profile": {
      "weekday_availability": "Tiempo promedio por día laborable",
      "weekend_availability": "Tiempo disponible en fines de semana",
      "peak_efficiency_windows": ["Momentos de mayor eficiencia culinaria"],
      "multitasking_opportunities": ["Qué se puede hacer simultáneamente"]
    },
    
    "equipment_optimization": {
      "current_capabilities": ["Qué equipos están subutilizados"],
      "efficiency_bottlenecks": ["Qué limita la velocidad de preparación"],
      "upgrade_priorities": ["Qué adquisiciones tendrían mayor impacto"],
      "workflow_improvements": ["Cómo reorganizar espacios para eficiencia"]
    },
    
    "skill_leverage": {
      "strengths_to_exploit": ["Habilidades a aprovechar más"],
      "efficiency_gains": ["Dónde la experiencia puede acelerar procesos"],
      "teaching_opportunities": ["Qué enseñar a otros para ganar ayuda"],
      "learning_priorities": ["Habilidades que más mejorarían eficiencia"]
    }
  },
  
  "optimization_strategies": {
    "time_multiplication": {
      "batch_cooking_opportunities": [
        {
          "category": "granos_base",
          "frequency": "semanal",
          "time_investment": 30,
          "time_saved_weekly": 90,
          "storage_method": "refrigerador en porciones",
          "usage_plan": ["comida1", "comida2", "comida3"]
        }
      ],
      
      "prep_consolidation": [
        {
          "task": "corte_de_verduras",
          "consolidation_frequency": "2-3 días",
          "time_saved": "15 min diarios",
          "storage_strategy": "contenedores herméticos por tipo",
          "freshness_management": "orden de uso por deterioro"
        }
      ],
      
      "cooking_chains": [
        {
          "chain_name": "domingo_productivo",
          "total_time": 120,
          "outputs": ["base1", "base2", "base3", "snacks"],
          "week_coverage": "70% de preparaciones base",
          "efficiency_ratio": "1:4 (1 hora genera 4 horas de preparaciones)"
        }
      ]
    },
    
    "ingredient_maximization": {
      "versatile_staples": [
        {
          "ingredient": "pollo",
          "purchase_amount": "1.5kg",
          "applications": [
            "asado para ensaladas",
            "desmenuzado para tacos", 
            "caldo con huesos",
            "croquetas con sobras"
          ],
          "cost_per_application": 150,
          "nutrition_efficiency": "alta proteína, múltiples preparaciones"
        }
      ],
      
      "flavor_multiplication": [
        {
          "base": "sofrito_de_cebolla_ajo",
          "batch_size": "4 porciones",
          "applications": ["guisos", "salteados", "salsas", "arroces"],
          "flavor_impact": "base sápida para múltiples platos",
          "storage": "freezer en cubos de hielo"
        }
      ]
    },
    
    "waste_elimination": {
      "prevention_strategies": [
        "Comprar cantidades exactas según plan",
        "Usar ingredientes en orden de deterioro",
        "Planificar sobras específicamente"
      ],
      
      "transformation_opportunities": [
        {
          "waste_stream": "verduras_blandas",
          "transformation": "sopas_y_caldos",
          "value_recovery": "80% del valor nutricional original"
        }
      ],
      
      "creative_utilization": [
        "Tallos de cilantro en salsas verdes",
        "Cáscaras de papa para chips horneados",
        "Agua de cocción de pasta para panes"
      ]
    }
  },
  
  "implementation_roadmap": {
    "week_1": {
      "focus": "Establecer rutinas básicas de batch cooking",
      "key_changes": ["Cocinar granos el domingo", "Prep verduras 2x semana"],
      "success_metrics": ["Tiempo ahorrado diario", "Stress reducido"]
    },
    
    "week_2_4": {
      "focus": "Refinar y expandir sistemas",
      "key_changes": ["Agregar proteínas en lote", "Optimizar almacenamiento"],
      "success_metrics": ["Eficiencia de prep", "Calidad mantenida"]
    },
    
    "month_2_3": {
      "focus": "Automatización y perfeccionamiento",
      "key_changes": ["Sistemas de rotación", "Predicción de necesidades"],
      "success_metrics": ["Desperdicios minimizados", "Satisfacción alta"]
    }
  }
}
\`\`\`

OBJETIVO: Crear un sistema de optimización que reduzca tiempo de preparación en 40-60% mientras mantiene o mejora calidad nutricional y satisfacción.
`;
  }

  /**
   * PROMPT DE APRENDIZAJE Y ADAPTACIÓN
   */
  static generateLearningAdaptationPrompt(): string {
    return `
@./src/features/gamification/ @./src/features/growth-stack/

# SISTEMA DE APRENDIZAJE CONTINUO Y ADAPTACIÓN INTELIGENTE

Desarrolla un sistema que aprenda de cada iteración y mejore continuamente:

## 1. MÉTRICAS DE APRENDIZAJE INTEGRAL

### 1.1 Éxito de Recetas y Preparaciones
- **Rating de satisfacción**: Escala de 1-10 por receta, por persona
- **Frequency of repetition**: Cuántas veces se repite cada receta
- **Modification patterns**: Qué adaptaciones se hacen consistentemente
- **Time accuracy**: Qué tan precisos son los tiempos estimados vs. reales

### 1.2 Eficiencia Operacional
- **Prep time tracking**: Tiempo real vs. estimado para cada tarea
- **Cleanup efficiency**: Tiempo de limpieza y organización post-cocina
- **Ingredient utilization**: Porcentaje de ingredientes realmente utilizados
- **Energy and motivation**: Nivel de energía antes/después de cocinar

### 1.3 Satisfacción Nutricional y de Bienestar
- **Energy levels**: Cómo afectan las comidas a la energía diaria
- **Satiety satisfaction**: Qué tan satisfactorias son las porciones
- **Digestive comfort**: Cómo se sienten las comidas digestivamente
- **Mood impact**: Influencia de las comidas en el estado de ánimo

### 1.4 Gestión de Desperdicios y Sostenibilidad
- **Food waste tracking**: Qué se desperdicia y por qué
- **Leftover utilization**: Éxito en el aprovechamiento de sobras
- **Seasonal adaptation**: Qué tan bien se adapta a productos de temporada
- **Budget efficiency**: Costo real vs. estimado, valor percibido

### 1.5 Adaptación y Flexibilidad Familiar
- **Family satisfaction**: Rating de satisfacción por miembro familiar
- **Acceptance of new foods**: Éxito en introducir nuevos ingredientes/platos
- **Social meal success**: Éxito de comidas compartidas o sociales
- **Cultural integration**: Cómo se integran tradiciones y preferencias culturales

### 1.6 Innovación y Creatividad
- **Successful improvisations**: Qué improvisaciones funcionaron bien
- **Creative substitutions**: Sustituciones exitosas por necesidad/preferencia
- **Fusion experiments**: Éxito en combinar diferentes estilos culinarios
- **Technique mastery**: Progreso en el dominio de nuevas técnicas

## 2. SISTEMA DE RETROALIMENTACIÓN Y ANÁLISIS

### 2.1 Captura de Datos en Tiempo Real
\`\`\`json
{
  "meal_feedback_system": {
    "immediate_post_meal": {
      "satisfaction_rating": "1-10 scale",
      "energy_level": "pre/post meal energy comparison",
      "taste_notes": "what worked/didn't work flavor-wise",
      "portion_adequacy": "too much/just right/too little"
    },
    
    "preparation_tracking": {
      "actual_prep_time": "minutes from start to finish",
      "difficulty_experienced": "easier/as expected/harder than anticipated",
      "tools_used": "what equipment was actually needed",
      "help_required": "who helped and with what tasks"
    },
    
    "ingredient_performance": {
      "quality_assessment": "freshness and quality of ingredients used",
      "quantity_accuracy": "was the amount purchased/used appropriate",
      "substitutions_made": "what substitutions were necessary and why",
      "waste_generated": "what was discarded and why"
    }
  }
}
\`\`\`

### 2.2 Análisis de Patrones y Tendencias
- **Success pattern identification**: Qué combinaciones consistentemente funcionan
- **Failure pattern analysis**: Qué factores llevan consistentemente a resultados subóptimos
- **Seasonal preference shifts**: Cómo cambian las preferencias con las estaciones
- **Skill development tracking**: Progreso en habilidades culinarias específicas

### 2.3 Predicción y Anticipación
- **Preference evolution prediction**: Cómo pueden evolucionar los gustos
- **Seasonal need anticipation**: Qué se va a necesitar en próximas temporadas
- **Skill gap identification**: Qué habilidades se necesitarán para objetivos futuros
- **Resource optimization opportunities**: Dónde se pueden hacer mejoras

## 3. ADAPTACIÓN INTELIGENTE Y PERSONALIZACIÓN

### 3.1 Personalización Dinámica de Recetas
\`\`\`json
{
  "recipe_adaptation_engine": {
    "taste_profile_learning": {
      "salt_preference": "learned optimal salt level for family",
      "spice_tolerance": "maximum spice level that works for everyone",
      "texture_preferences": "preferred textures by family member",
      "flavor_combinations": "successful flavor pairings identified"
    },
    
    "cooking_skill_adaptation": {
      "technique_comfort_level": "current comfort with different techniques",
      "time_management_patterns": "how long tasks actually take this cook",
      "equipment_proficiency": "skill level with different tools/appliances",
      "multitasking_capacity": "how many simultaneous tasks are manageable"
    },
    
    "contextual_adaptation": {
      "weekday_vs_weekend": "different approaches for different days",
      "season_specific_adjustments": "how recipes change with seasons",
      "energy_level_modifications": "simpler versions for low-energy days",
      "social_context_variations": "adaptations for solo vs. family vs. guests"
    }
  }
}
\`\`\`

### 3.2 Evolución del Sistema de Planificación
- **Algorithm refinement**: Mejora de algoritmos de sugerencia basada en feedback
- **Constraint learning**: Entendimiento más profundo de limitaciones reales
- **Preference weighting**: Ajuste de la importancia relativa de diferentes factores
- **Context sensitivity**: Mayor capacidad de adaptación a circunstancias específicas

### 3.3 Expansión Inteligente de Horizontes
- **Comfort zone expansion**: Introducción gradual de nuevos ingredientes/técnicas
- **Cultural exploration**: Incorporación progresiva de nuevas tradiciones culinarias
- **Seasonal mastery**: Desarrollo de expertise en cocina estacional
- **Sustainability integration**: Incorporación creciente de prácticas sostenibles

## 4. IMPLEMENTACIÓN DEL SISTEMA DE APRENDIZAJE

### 4.1 Recolección de Datos
\`\`\`json
{
  "data_collection_framework": {
    "daily_micro_feedback": {
      "method": "Quick 2-minute post-meal survey",
      "frequency": "After each planned meal",
      "data_points": ["satisfaction", "energy", "time", "difficulty"],
      "collection_tool": "Mobile-friendly form with voice input option"
    },
    
    "weekly_reflection": {
      "method": "10-minute weekly review session",
      "frequency": "Sunday evening planning session",
      "focus_areas": ["week highlights", "challenges faced", "innovations tried"],
      "outcome": "Adjustments for following week's plan"
    },
    
    "monthly_deep_dive": {
      "method": "30-minute comprehensive review",
      "frequency": "Last Sunday of each month",
      "analysis_scope": ["pattern identification", "goal progress", "system refinements"],
      "outcome": "Strategic adjustments to planning approach"
    }
  }
}
\`\`\`

### 4.2 Análisis y Síntesis Inteligente
- **Pattern recognition algorithms**: Identificación automática de patrones en los datos
- **Correlation analysis**: Conexiones entre diferentes variables (tiempo, satisfacción, costo, etc.)
- **Predictive modeling**: Predicción de qué funcionará bien basado en patrones históricos
- **Anomaly detection**: Identificación de outliers que podrían indicar nuevas oportunidades

### 4.3 Implementación de Mejoras
- **A/B testing approach**: Probar variaciones sistemáticamente
- **Gradual rollout**: Implementar cambios gradualmente para evaluar impacto
- **Rollback capabilities**: Capacidad de volver a versiones anteriores si algo no funciona
- **Continuous optimization**: Ajuste continuo basado en nueva información

## OBJETIVO FINAL

Crear un sistema que:
1. **Aprenda activamente** de cada experiencia culinaria
2. **Personalice automáticamente** recomendaciones basadas en feedback real
3. **Anticipe necesidades** y se adapte proactivamente a cambios
4. **Optimice continuamente** eficiencia, satisfacción y bienestar
5. **Evolucione con el usuario** manteniendo relevancia a largo plazo

RESULTADO ESPERADO: Un planificador que se vuelve progresivamente más preciso, personalizado y valioso con cada semana de uso.
`;
  }

  /**
   * Método principal para generar prompt combinado
   */
  static generateComprehensivePlannerPrompt(
    context: HolisticPlannerContext,
    config: GeminiPromptConfig
  ): string {
    const sections = [
      this.generateHolisticContextPrompt(config),
      this.generateIntelligentPlanningPrompt(context),
      this.generateExternalFactorsPrompt(),
      this.generateResourceOptimizationPrompt(),
      this.generateLearningAdaptationPrompt()
    ];

    return sections.join('\n\n---\n\n');
  }
}

/**
 * Utilidades para integración con Gemini CLI
 */
export class GeminiCLIIntegration {
  
  /**
   * Genera comando Gemini CLI para análisis holístico
   */
  static generateGeminiCommand(
    promptType: 'holistic' | 'planning' | 'optimization' | 'learning',
    additionalContext: string[] = []
  ): string {
    const baseContext = [
      '@./src/features/meal-planning/',
      '@./src/lib/types/mealPlanning.ts',
      '@./src/features/pantry/',
      '@./src/features/recipes/',
      '@./src/lib/services/mealPlanningAI.ts',
      '@./src/lib/services/promptEngineering.ts'
    ];

    const contextFiles = [...baseContext, ...additionalContext].join(' ');
    
    const promptMap = {
      holistic: 'Realiza un análisis holístico completo del sistema de planificación de comidas',
      planning: 'Genera un plan de comidas semanal inteligente y optimizado',
      optimization: 'Optimiza el uso de recursos disponibles para la planificación',
      learning: 'Desarrolla estrategias de aprendizaje y adaptación continua'
    };

    return `gemini -p "${contextFiles} ${promptMap[promptType]}"`;
  }

  /**
   * Genera configuración de prompt para diferentes escenarios
   */
  static getPromptConfig(scenario: 'daily' | 'weekly' | 'monthly' | 'seasonal'): GeminiPromptConfig {
    const baseFiles = [
      './src/features/meal-planning/',
      './src/lib/types/mealPlanning.ts',
      './src/features/pantry/',
      './src/features/recipes/'
    ];

    const configurations = {
      daily: {
        contextFiles: [...baseFiles, './src/features/dashboard/'],
        analysisDepth: 'surface' as const,
        optimizationFocus: 'time' as const,
        adaptationLevel: 'dynamic' as const
      },
      weekly: {
        contextFiles: [...baseFiles, './src/features/shopping/', './src/lib/services/'],
        analysisDepth: 'comprehensive' as const,
        optimizationFocus: 'holistic' as const,
        adaptationLevel: 'learning' as const
      },
      monthly: {
        contextFiles: [...baseFiles, './src/features/growth-stack/', './src/features/gamification/'],
        analysisDepth: 'deep_dive' as const,
        optimizationFocus: 'sustainability' as const,
        adaptationLevel: 'learning' as const
      },
      seasonal: {
        contextFiles: [...baseFiles, './src/services/', './src/features/'],
        analysisDepth: 'deep_dive' as const,
        optimizationFocus: 'holistic' as const,
        adaptationLevel: 'learning' as const
      }
    };

    return configurations[scenario];
  }
}