import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize GoogleGenAI server-side with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// System instruction for the slow studio Animation Engine AI
const STUDIO_SYSTEM_INSTRUCTION = `Eres el copiloto de IA de "slow studio", un motor de animación vectorial interactivo moderno.
Tu trabajo es interpretar las instrucciones del usuario en lenguaje natural (ej. "dibuja un círculo verde agua que salte", "haz un cohete espacial 3D que despegue", "crea un botón interactivo", "haz una interpolación de forma de cuadrado a estrella") y generar la estructura completa de animación vectorial para la línea de tiempo y el escenario.

El escenario base tiene una resolución Full HD estándar de 1920 x 1080 píxeles con centro en (960, 540) y 24 fps (configurable a 12, 24, 30, 60 fps). La paleta de identidad utiliza acentos en verde agua (teal/aqua #14b8a6, #2dd4bf).
Puedes crear:
1. Capas con nombres descriptivos (ej: "Personaje", "Fondo", "Sombra", "Efectos", "UI").
2. Keyframes en fotogramas específicos (ej: frame 1, 12, 24, 36, 48).
3. Tipos de interpolación (tweenType): 'motion' (interpolación de movimiento clásica celeste/cian), 'shape' (interpolación de forma verde agua/menta), o 'none' (cuadro a cuadro).
4. Tipos de aceleración (easing): 'linear', 'easeIn', 'easeOut', 'easeInOut', 'bounce'.
5. Elementos vectoriales y símbolos:
   - type: 'shape' con shapeType: 'circle' | 'rect' | 'star' | 'polygon' | 'path'
   - type: 'group' (elementos agrupados que se transforman juntos)
   - type: 'symbolInstance' (instancia de un MovieClip o Botón)
   - type: 'text'
   - type: 'button' (con estados up, over, down)
   - type: 'threeObject' (para 3D: modelType 'spaceship' | 'robot' | 'cube' | 'sphere' | 'gem', con rotX, rotY, rotZ, metalness, roughness)
6. Acciones simples de slow script (actions): ej. "stop();", "gotoAndPlay(1);", etc.
7. Prompts descriptivos para cada keyframe ("Frame 1: En el suelo preparado", "Frame 12: En el punto más alto del salto", etc.).

Responde siempre en formato JSON estructurado con:
- textResponse: Explicación amigable en español de lo que creaste en la animación, los principios de animación aplicada (squash & stretch, anticipación, etc.) y cómo interactuar con ella.
- animation: Objeto con totalFrames, fps, y lista de capas con sus respectivos keyframes y elementos.`;

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { prompt, currentAnimation } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "El prompt es requerido" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Instrucción del animador: "${prompt}".
Estado actual del escenario: ${JSON.stringify(currentAnimation ? {
  fps: currentAnimation.fps,
  totalFrames: currentAnimation.totalFrames,
  layerCount: currentAnimation.layers?.length || 0
} : {})}.
Genera la animación adecuada con capas, keyframes fluidos, transformaciones e interpolaciones.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: STUDIO_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            textResponse: {
              type: Type.STRING,
              description: "Explicación en español para el usuario",
            },
            animation: {
              type: Type.OBJECT,
              properties: {
                totalFrames: { type: Type.INTEGER },
                fps: { type: Type.INTEGER },
                backgroundColor: { type: Type.STRING },
                layers: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      visible: { type: Type.BOOLEAN },
                      locked: { type: Type.BOOLEAN },
                      keyframes: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            frame: { type: Type.INTEGER },
                            tweenType: { type: Type.STRING },
                            easing: { type: Type.STRING },
                            prompt: { type: Type.STRING },
                            actions: { type: Type.STRING },
                            elements: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  id: { type: Type.STRING },
                                  name: { type: Type.STRING },
                                  type: { type: Type.STRING },
                                  shapeType: { type: Type.STRING },
                                  x: { type: Type.NUMBER },
                                  y: { type: Type.NUMBER },
                                  width: { type: Type.NUMBER },
                                  height: { type: Type.NUMBER },
                                  rotation: { type: Type.NUMBER },
                                  scaleX: { type: Type.NUMBER },
                                  scaleY: { type: Type.NUMBER },
                                  opacity: { type: Type.NUMBER },
                                  fill: { type: Type.STRING },
                                  stroke: { type: Type.STRING },
                                  strokeWidth: { type: Type.NUMBER },
                                  text: { type: Type.STRING },
                                  threeModelType: { type: Type.STRING },
                                  threeRotX: { type: Type.NUMBER },
                                  threeRotY: { type: Type.NUMBER },
                                  threeRotZ: { type: Type.NUMBER },
                                },
                                required: ["id", "type", "x", "y"],
                              },
                            },
                          },
                          required: ["frame", "tweenType", "elements"],
                        },
                      },
                    },
                    required: ["id", "name", "keyframes"],
                  },
                },
              },
              required: ["totalFrames", "fps", "layers"],
            },
          },
          required: ["textResponse", "animation"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/ai/chat:", error);
    return res.status(500).json({
      error: error.message || "Error al procesar la animación con IA",
    });
  }
});

// Endpoint for editing a specific frame with a prompt
app.post("/api/ai/frame-prompt", async (req, res) => {
  try {
    const { frame, prompt, currentElements } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Para el fotograma ${frame} en una animación de slow studio (escenario 1920x1080):
Prompt específico: "${prompt}".
Elementos actuales en el frame anterior: ${JSON.stringify(currentElements)}.
Genera la lista modificada o nuevos elementos transformados para este keyframe con valores numéricos coherentes (x, y, scaleX, scaleY, rotation, etc).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            elements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  shapeType: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER },
                  rotation: { type: Type.NUMBER },
                  scaleX: { type: Type.NUMBER },
                  scaleY: { type: Type.NUMBER },
                  opacity: { type: Type.NUMBER },
                  fill: { type: Type.STRING },
                  stroke: { type: Type.STRING },
                  strokeWidth: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                },
                required: ["id", "type", "x", "y"],
              },
            },
          },
          required: ["explanation", "elements"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    return res.json(data);
  } catch (error: any) {
    console.error("Error in /api/ai/frame-prompt:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "slow studio Animation Engine" });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`slow Flash Studio running on http://localhost:${PORT}`);
  });
}

startServer();
