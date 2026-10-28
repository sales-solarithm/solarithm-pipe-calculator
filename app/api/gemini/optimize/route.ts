import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { project, customPrompt } = await req.json();

    const engineeringContext = `
You are a Lead Solar Structural Engineer and Pipe Procurement Specialist at Solarithm.
Review and optimize the following Solar Structural Pipe Bill of Materials (BOM):

Project: ${project.projectName}
Client: ${project.clientName || 'N/A'}
Standard Stock Pipe Length: ${project.standardPipeLength} ${project.pipeLengthUnit}
Active Sizes: ${project.pipeSizes?.join(', ')}

Category Breakdown:
${project.rows?.map((r: any) => `- ${r.category}: ${Object.entries(r.quantities || {}).map(([s, q]) => `${s}: ${q}`).join(', ')}`).join('\n')}

Engineer's Inquiry / Focus:
${customPrompt || 'Perform an exhaustive material optimization, scrap reduction assessment, standard bundling recommendation, and contingency verification for high wind/dead-load zones.'}
`;

    // As mandated, gemini-4-argon with thinkingLevel: HIGH for deep structural thinking
    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: [
        {
          role: 'user',
          parts: [{ text: engineeringContext }],
        },
      ],
      config: {
        thinkingConfig: {
          thinkingLevel: 'HIGH' as any,
        },
      },
    });

    return NextResponse.json({
      analysis: response.text,
      model: 'gemini-4-argon (Thinking Level: HIGH)',
    });
  } catch (error) {
    console.error('Gemini Optimization Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate engineering optimization' },
      { status: 500 }
    );
  }
}
