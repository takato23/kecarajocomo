import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    // Get API key
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'No API key found'
      }, { status: 500 });
    }

    // Get request body
    const body = await req.json();
    const { preferences, constraints } = body;

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Simple prompt for meal planning
    const prompt = `
Genera un plan de comidas semanal para una persona en Argentina.
Preferencias: ${JSON.stringify(preferences || {})}
Restricciones: ${JSON.stringify(constraints || {})}

Responde SOLO con un JSON válido con esta estructura exacta:
{
  "success": true,
  "plan": {
    "meals": [
      {
        "day": 1,
        "dayName": "Lunes",
        "breakfast": { "name": "...", "ingredients": ["..."], "prepTime": 10 },
        "lunch": { "name": "...", "ingredients": ["..."], "prepTime": 30 },
        "dinner": { "name": "...", "ingredients": ["..."], "prepTime": 45 }
      }
    ]
  }
}

Incluye 7 días. Usa comida argentina típica.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const mealPlanRaw = JSON.parse(jsonMatch[0]);

    // Normalize to expected shape for UI (/planificador/zenith): plan.days[].slots.{breakfast|lunch|snack|dinner}
    type SimpleMeal = { name?: string; title?: string } & Record<string, unknown>;
    type SimpleDay = { day?: number; dayName?: string; breakfast?: SimpleMeal; lunch?: SimpleMeal; dinner?: SimpleMeal; snack?: SimpleMeal };

    const now = new Date();
    const monday = new Date(now);
    const day = monday.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    monday.setDate(monday.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const sourcePlan = mealPlanRaw.plan || mealPlanRaw;
    const mealsArray: SimpleDay[] = Array.isArray(sourcePlan?.meals) ? sourcePlan.meals : [];
    const days = mealsArray.map((d: SimpleDay, idx: number) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + idx);
      const iso = date.toISOString().slice(0, 10);
      const toSlot = (m?: SimpleMeal) => (m ? { id: `${idx}`, title: m.title || m.name || 'Receta' } : undefined);
      return {
        date: iso,
        label: d.dayName || '',
        slots: {
          breakfast: toSlot(d.breakfast),
          lunch: toSlot(d.lunch),
          snack: toSlot((d as any).snack),
          dinner: toSlot(d.dinner)
        }
      };
    });

    const normalizedPlan = {
      ...sourcePlan,
      startDate: monday.toISOString(),
      endDate: sunday.toISOString(),
      days
    };

    return NextResponse.json({
      success: true,
      plan: normalizedPlan,
      metadata: {
        confidenceScore: 0.85,
        processingTime: Date.now()
      }
    });

  } catch (error: any) {
    console.error('Error in simple meal planning:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to generate meal plan'
    }, { status: 500 });
  }
}