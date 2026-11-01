import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Server-side Gemini Reconstruction Endpoint
app.post('/api/gemini/reconstruct', async (req, res) => {
  try {
    const { chunks, projectName } = req.body;

    if (!Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({ error: 'No source chunks provided for reconstruction.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. You can click "Use cached demo result" to explore the complete workflow.',
        isApiKeyMissing: true,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Format the chunks cleanly for the model
    const formattedChunks = chunks
      .map(
        (c: { chunkId: string; sourceId: string; sourceName: string; text: string; accessLevel: string }) =>
          `[CHUNK_ID: ${c.chunkId} | SOURCE: ${c.sourceName} (${c.sourceId}) | ACCESS: ${c.accessLevel}]\n${c.text}\n[END_CHUNK]`
      )
      .join('\n\n');

    const promptText = `Project Name: ${projectName || 'Handover Project'}
Below are the authorized, permission-filtered source chunks for this project:

${formattedChunks}

Please extract and reconstruct the project state following the strict schema.`;

    const systemInstruction = `You are HandoverIQ's deterministic evidence extraction engine.
You reconstruct a mission-critical project state exclusively from provided, permission-filtered source chunks.

CRITICAL TRUST RULES:
1. Rely ONLY on the provided chunks. NEVER invent facts, names, deadlines, numbers, or conclusions.
2. Every claim MUST provide at least one citation containing:
   - sourceId: the exact sourceId from the chunk header (e.g., src-repo, src-notes, src-tasks, src-chat)
   - chunkId: the exact chunkId (e.g., src-repo-C1, src-notes-C1)
   - quote: an exact, verbatim text snippet copied from the chunk that proves this claim.
3. For architectural decisions, capture the explicit WHY rationale given in the text into whyRationale.
4. GAPS: If crucial project information is missing (e.g. unassigned critical tasks, missing renewal owners, missing keys), DO NOT GUESS. Add an explicit entry to gaps.
5. CONFLICTS: If two sources contradict each other (e.g. task board says Done but code/notes say unfinished), DO NOT reconcile or choose a winner. Record an entry in conflicts with citations for both sides.
6. Recurring problems: extract any recurring operational issue, symptom, root cause, and the exact documented fix steps.`;

    // Response schema using Type enum
    const extractionSchema = {
      type: Type.OBJECT,
      properties: {
        projectName: { type: Type.STRING },
        projectDescription: { type: Type.STRING },
        decisions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              whyRationale: { type: Type.STRING },
              citations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sourceId: { type: Type.STRING },
                    chunkId: { type: Type.STRING },
                    quote: { type: Type.STRING },
                  },
                  required: ['sourceId', 'chunkId', 'quote'],
                },
              },
            },
            required: ['title', 'description', 'whyRationale', 'citations'],
          },
        },
        recurringProblems: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              symptom: { type: Type.STRING },
              rootCause: { type: Type.STRING },
              knownFix: { type: Type.STRING },
              citations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sourceId: { type: Type.STRING },
                    chunkId: { type: Type.STRING },
                    quote: { type: Type.STRING },
                  },
                  required: ['sourceId', 'chunkId', 'quote'],
                },
              },
            },
            required: ['title', 'description', 'symptom', 'knownFix', 'citations'],
          },
        },
        risksAndBlockers: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              priority: { type: Type.STRING },
              owner: { type: Type.STRING },
              citations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sourceId: { type: Type.STRING },
                    chunkId: { type: Type.STRING },
                    quote: { type: Type.STRING },
                  },
                  required: ['sourceId', 'chunkId', 'quote'],
                },
              },
            },
            required: ['title', 'description', 'priority', 'citations'],
          },
        },
        contacts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              contactName: { type: Type.STRING },
              contactDomain: { type: Type.STRING },
              contactHandle: { type: Type.STRING },
              citations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sourceId: { type: Type.STRING },
                    chunkId: { type: Type.STRING },
                    quote: { type: Type.STRING },
                  },
                  required: ['sourceId', 'chunkId', 'quote'],
                },
              },
            },
            required: ['contactName', 'contactDomain', 'citations'],
          },
        },
        nextActions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              owner: { type: Type.STRING },
              dueDate: { type: Type.STRING },
              priority: { type: Type.STRING },
              citations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sourceId: { type: Type.STRING },
                    chunkId: { type: Type.STRING },
                    quote: { type: Type.STRING },
                  },
                  required: ['sourceId', 'chunkId', 'quote'],
                },
              },
            },
            required: ['title', 'description', 'citations'],
          },
        },
        timeline: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              milestoneDate: { type: Type.STRING },
              isConfirmed: { type: Type.BOOLEAN },
              citations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sourceId: { type: Type.STRING },
                    chunkId: { type: Type.STRING },
                    quote: { type: Type.STRING },
                  },
                  required: ['sourceId', 'chunkId', 'quote'],
                },
              },
            },
            required: ['title', 'description', 'citations'],
          },
        },
        conflicts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              claimA: {
                type: Type.OBJECT,
                properties: {
                  statement: { type: Type.STRING },
                  sourceId: { type: Type.STRING },
                  chunkId: { type: Type.STRING },
                  quote: { type: Type.STRING },
                },
                required: ['statement', 'sourceId', 'chunkId', 'quote'],
              },
              claimB: {
                type: Type.OBJECT,
                properties: {
                  statement: { type: Type.STRING },
                  sourceId: { type: Type.STRING },
                  chunkId: { type: Type.STRING },
                  quote: { type: Type.STRING },
                },
                required: ['statement', 'sourceId', 'chunkId', 'quote'],
              },
            },
            required: ['topic', 'claimA', 'claimB'],
          },
        },
        gaps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              context: { type: Type.STRING },
              urgency: { type: Type.STRING },
            },
            required: ['question', 'context', 'urgency'],
          },
        },
      },
      required: [
        'projectName',
        'projectDescription',
        'decisions',
        'recurringProblems',
        'risksAndBlockers',
        'contacts',
        'nextActions',
        'conflicts',
        'gaps',
      ],
    };

    // Try gemini-2.5-flash as specified in prompt, fallback to gemini-3.8-flash if needed
    let modelName = 'gemini-2.5-flash';
    let response;

    try {
      response = await ai.models.generateContent({
        model: modelName,
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: extractionSchema,
        },
      });
    } catch (primaryErr: any) {
      console.warn(`Primary model ${modelName} failed, falling back to gemini-3.8-flash:`, primaryErr?.message);
      modelName = 'gemini-3.8-flash';
      response = await ai.models.generateContent({
        model: modelName,
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: extractionSchema,
        },
      });
    }

    const jsonText = (response.text || '{}').trim();
    const parsedData = JSON.parse(jsonText);

    return res.json({
      success: true,
      modelUsed: modelName,
      data: parsedData,
    });
  } catch (err: any) {
    console.error('Error during reconstruction:', err);
    return res.status(500).json({
      error: err?.message || 'Reconstruction failed. Please retry or use the cached demo result.',
      details: err?.toString(),
    });
  }
});

// Mount Vite or serve static files
async function startServer() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.RAILWAY_STATIC_URL);

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HandoverIQ server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export default app;
