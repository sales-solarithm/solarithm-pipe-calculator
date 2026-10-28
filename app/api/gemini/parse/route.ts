import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { rawText, currentSizes } = await req.json();

    const systemPrompt = `
You are a solar structural CAD/BOM parser.
Convert the provided raw text, cut list, or structural notes into a structured JSON format for the Pipe Requirement Calculator.

Target Pipe Sizes: ${currentSizes?.join(', ') || '40 x 40, 60 x 40, 80 x 40'}

Output MUST be valid JSON adhering strictly to:
{
  "projectName": string,
  "standardPipeLength": number,
  "pipeLengthUnit": "ft" | "m",
  "pipeSizes": string[],
  "rows": [
    {
      "id": string,
      "category": string,
      "quantities": { [pipeSize: string]: number }
    }
  ],
  "noteText": string
}
Return only JSON with no markdown backticks.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nRAW INPUT:\n${rawText}` }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Gemini Parse Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse BOM' },
      { status: 500 }
    );
  }
}
