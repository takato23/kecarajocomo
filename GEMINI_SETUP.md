# Configuración de Gemini para el Planificador Semanal

## 1. Obtener API Key de Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key
3. Copia la key generada

## 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto (si no existe) y agrega:

```bash
# Gemini API Configuration
GEMINI_API_KEY=tu_api_key_aqui
```

⚠️ **IMPORTANTE**: Nunca subas tu API key a git. El archivo `.env.local` ya está en `.gitignore`.

## 3. Verificar la Integración

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a la página del planificador (probablemente `/planner` o donde tengas configurada la ruta)

3. Deberías ver:
   - Un botón grande "Planificar mi semana" con icono de varita mágica
   - Al hacer click, aparecerá una barra de progreso
   - Después de ~30 segundos, verás un diálogo de confirmación con el plan generado
   - Al confirmar, las recetas se aplicarán a los slots con animaciones

## 4. Características de la Integración

### Botón Principal
- Diseño glassmorphism con gradiente púrpura-rosa
- Badges informativos (tiempo estimado, personalizado, usa despensa)
- Animación al hover

### Durante la Generación
- Barra de progreso con porcentaje
- Botón de cancelar
- Mensajes informativos sobre el proceso

### Manejo de Errores
- **Rate Limit**: Mensaje amigable con opción de reintentar después de 60s
- **Timeout**: Reintento automático con método por lotes
- **Sin conexión**: Mensaje para verificar internet

### Visualización
- Badges en las tarjetas para identificar recetas generadas por IA
- Indicador de recetas que usan ingredientes de tu despensa
- Modal detallado con información nutricional completa

## 5. Troubleshooting

### "Servicio de IA no configurado correctamente"
- Verifica que hayas agregado la API key en `.env.local`
- Reinicia el servidor de desarrollo

### "Demasiadas solicitudes"
- Gemini tiene límites de rate. Espera unos minutos antes de reintentar
- La versión gratuita permite ~60 requests por minuto

### El botón no aparece
- Verifica que estés importando `WeeklyPlannerWithGemini` en lugar de `WeeklyPlanner`
- Revisa la consola del navegador por errores

### Generación muy lenta
- Normal: puede tomar 20-40 segundos
- Si toma más de 1 minuto, se activará el timeout y reintentará con método por lotes

## 6. Próximos Pasos

1. **Personalización**: Agrega tu perfil de usuario real con preferencias dietéticas
2. **Despensa**: Integra los ingredientes de tu despensa para optimización
3. **Favoritos**: Marca recetas como favoritas para que se repitan
4. **Historial**: Guarda planes anteriores para referencia

## 7. Costos

- **Gemini 1.5 Flash**: Gratis hasta 15 RPM (requests por minuto)
- **Gemini 1.5 Pro**: $3.50 por millón de tokens de entrada
- Un plan semanal completo usa aproximadamente 5-10K tokens

Para uso personal, la versión gratuita es más que suficiente.