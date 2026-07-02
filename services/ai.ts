import { AiNoteResult } from '../types';

const UMANS_BASE_URL = process.env.EXPO_PUBLIC_UMANS_BASE_URL || 'https://api.code.umans.ai/v1';
const UMANS_API_KEY = process.env.EXPO_PUBLIC_UMANS_API_KEY;
const UMANS_MODEL = 'umans-coder';

export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiError';
  }
}

function buildSystemPrompt(): string {
  return `You are a helpful assistant that converts photos of notes, documents, whiteboards, or screenshots into clean digital notes.

Analyze the image and extract the text accurately. Then produce a JSON response with exactly these fields:
- "title": a short, descriptive title for the note (max 6 words)
- "body": the cleaned-up, structured text content of the note. Preserve formatting with line breaks where helpful.
- "extractedText": the full raw extracted text before any cleanup

If the image has no readable text, summarize what you see in the body and provide an appropriate title.

Respond ONLY with valid JSON. Do not wrap it in markdown code fences.`;
}

export async function convertImageToNote(base64Image: string, mimeType: string = 'image/jpeg'): Promise<AiNoteResult> {
  if (!UMANS_API_KEY) {
    throw new AiError('Umans API key is not configured. Add EXPO_PUBLIC_UMANS_API_KEY to your .env file.');
  }

  const response = await fetch(`${UMANS_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${UMANS_API_KEY}`,
    },
    body: JSON.stringify({
      model: UMANS_MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    throw new AiError(`Umans API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new AiError('No content returned from Umans API.');
  }

  return parseAiResponse(content);
}

function parseAiResponse(content: string): AiNoteResult {
  const cleaned = content.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, cleaned];
  const jsonString = (jsonMatch[1] || cleaned).trim();

  try {
    const parsed = JSON.parse(jsonString);
    return {
      title: String(parsed.title || 'Untitled Note').trim(),
      body: String(parsed.body || parsed.extractedText || '').trim(),
      extractedText: String(parsed.extractedText || parsed.body || '').trim(),
    };
  } catch (error) {
    // Fallback: treat the whole response as body
    return {
      title: 'Untitled Note',
      body: cleaned,
      extractedText: cleaned,
    };
  }
}
