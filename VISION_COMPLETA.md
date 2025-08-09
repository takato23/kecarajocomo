# 🧠 VISIÓN COMPLETA KECARAJOCOMER - CEREBRO EJECUTOR

## OBJETIVO PRINCIPAL
App "Ke Carajo Como" - resolver qué comer con lo que hay en casa, minimizando compras y costo.

## USER PERSONA
- 18-45 años, Argentina (CABA/AMBA)
- Poco tiempo, inflación alta
- Solo/pareja/familia chica
- Quiere: rico/rápido/barato + alta proteína

## DIFERENCIADORES ÚNICOS
1. **Modo Heladera** - sugerencias con ingredientes disponibles
2. **Lista inteligente** - costo estimado AR + buscaprecios
3. **Sustituciones locales** automáticas
4. **PWA offline** para usar en supermercado

## PRIORIDADES MVP (ORDEN ESTRICTO)
1. **Planificación semanal** (grid 7x4 flexible)
2. **Lista compras inteligente** (offline, costos AR, pasillos)
3. **Despensa/inventario** (stock, vencimientos, uso prioritario)
4. **Recetas IA** (Gemini según ingredientes/tiempo/dieta)
5. **Presupuesto/costos** (objetivo semanal)
6. **Tracking nutricional** (proteína/kcal simple)

## UX CORE DEFINIDA

### Landing
- Sensación: alivio y control
- CTA: "Crear mi plan ahora"
- Mostrar: 3 pasos, ejemplo plan/costo

### Dashboard  
- VE: comidas hoy, faltantes mañana, presupuesto restante
- ACCIONES: 1)Editar plan 2)Usar lista 3)Actualizar despensa
- VISTAZO: proteína/kcal día, costo proyectado, alertas

### Planificador
- UI: calendario 7×4, drag&drop, bloquear/reemplazar
- Por comida: nombre, tiempo, macros, costo, ingredientes, pasos
- Flexible: días/slots elegibles, tiempo límite, exclusiones

### Despensa
- Datos: cantidad+unidad, compra/vencimiento, costo opcional
- Alta: manual rápida + (v2)OCR/barcode
- Alertas: vencimientos, stock bajo, faltantes

### Lista Compras
- Generación: plan - despensa = faltantes
- Include: cantidades, alternativas, costo estimado, marcas
- Supermercado: offline, check-tap, orden pasillos, compartir

## PROMPT MAESTRO GEMINI
```json
{
  "plan": [
    {
      "date": "2025-08-04",
      "day": "Lunes", 
      "meals": [
        {
          "slot": "almuerzo",
          "title": "Pollo salteado con arroz",
          "ingredients": [{"name": "pechuga", "qty": 200, "unit": "g", "from_pantry": true}],
          "steps": ["Paso 1", "Paso 2"],
          "macros": {"kcal": 520, "protein_g": 45, "carbs_g": 55, "fat_g": 14},
          "time_minutes": 20,
          "cost_estimate_ars": 1800,
          "substitutions": [{"instead_of": "arroz", "use": "quinoa", "reason": "no hay"}]
        }
      ]
    }
  ],
  "shopping_list": [{"name":"arroz", "qty":500, "unit":"g", "estimated_cost_ars": 1200}],
  "summary": {"weekly_kcal": 9800, "budget_ars": 12000, "estimated_total_ars": 10800}
}
```

## STACK TÉCNICO FINAL
- Next.js 15 + TypeScript + Tailwind + PWA
- Supabase (DB + Auth + Storage)  
- Gemini 1.5 Flash + function calling
- Buscaprecios API + caché 7 días
- Vercel + Edge Functions

## REGLAS DE EJECUCIÓN
- Mobile-first siempre
- Sin estadísticas arriba (foco acción)
- Offline-first con sync
- Design system: 5 componentes, 3 colores
- NO scope creep, NO optimización prematura
- JSON estricto con Zod validation

## FLUJO CRÍTICO MVP
1. Onboarding despensa (packs + búsqueda)
2. Elegir días/slots + modo + tiempo + presupuesto  
3. Prompt maestro → Gemini → JSON validado
4. Render grid + acciones por slot
5. Lista = plan - despensa + precios caché
6. Modo supermercado offline + compartir WhatsApp
7. Post-compra: actualizar despensa + precios

## ENTREGABLE FINAL
Beta 31/08/2025, MVP público 30/09/2025
Monetización: $3000 ARS/mes Pro

---
**EJECUTAR SIN CONSULTAS - TODO ESTÁ DEFINIDO**