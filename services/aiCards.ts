import { CardType } from '../types';

const UMANS_BASE_URL = process.env.EXPO_PUBLIC_UMANS_BASE_URL || 'https://api.code.umans.ai/v1';
const UMANS_API_KEY = process.env.EXPO_PUBLIC_UMANS_API_KEY;
const UMANS_MODEL = 'umans-coder';

export class AiCardsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiCardsError';
  }
}

export interface AICardProposal {
  front: string;
  back: string;
  type: CardType;
  rationale: string;
}

function buildSystemPrompt(): string {
  return `You are a spaced-repetition tutor. Given a note, generate a small set of high-quality flashcards.

Rules:
- Each card should be atomic: one fact or concept per card.
- Prefer conceptual understanding over rote memorization.
- Use "basic" cards for question/answer pairs.
- Use "cloze" cards for fill-in-the-blank prompts. Cloze format: wrap the hidden word or short phrase in double curly braces, e.g. "The capital of France is {{c1::Paris}}."
- Do not generate more than 8 cards.
- Avoid overly long front or back text.

Respond ONLY with a JSON array. Each object must have these fields:
- "front": string
- "back": string
- "type": "basic" or "cloze"
- "rationale": one-sentence explanation of why this card matters

Do not wrap the response in markdown code fences.`;
}

function buildUserPrompt(title: string, body: string, extractedText: string): string {
  return `Create flashcards from this note.

Title: ${title}

Body:
${body || '(no body)'}

Extracted text:
${extractedText || '(none)'}`;
}

export async function generateCardsFromNote(
  title: string,
  body: string,
  extractedText: string
): Promise<AICardProposal[]> {
  if (!UMANS_API_KEY) {
    throw new AiCardsError('Umans API key is not configured. Add EXPO_PUBLIC_UMANS_API_KEY to your .env file.');
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
        { role: 'user', content: buildUserPrompt(title, body, extractedText) },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    throw new AiCardsError(`Umans API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new AiCardsError('No content returned from Umans API.');
  }

  return parseProposals(content);
}

function parseProposals(content: string): AICardProposal[] {
  const cleaned = content.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, cleaned];
  const jsonString = (jsonMatch[1] || cleaned).trim();

  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      throw new AiCardsError('Expected a JSON array of card proposals.');
    }
    return parsed.map((item: any, index: number) => {
      const front = String(item.front || '').trim();
      const back = String(item.back || '').trim();
      const type: CardType = item.type === 'cloze' ? 'cloze' : 'basic';
      if (!front || !back) {
        throw new AiCardsError(`Card ${index + 1} is missing front or back.`);
      }
      return {
        front,
        back,
        type,
        rationale: String(item.rationale || '').trim(),
      };
    });
  } catch (error) {
    if (error instanceof AiCardsError) {
      throw error;
    }
    console.warn('Failed to parse AI card response:', error);
    return [];
  }
}
