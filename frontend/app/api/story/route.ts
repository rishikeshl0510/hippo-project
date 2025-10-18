import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

export async function POST(request: NextRequest) {
  try {
    const { prompt, userFeedback } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('BACKEND_URL:', BACKEND_URL);
    console.log('Calling backend story-workflow endpoint...');

    // Call the Python backend story-workflow endpoint
    const response = await fetch(`${BACKEND_URL}/api/story-workflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, userFeedback: userFeedback || '' }),
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      throw new Error(`Backend API call failed: ${response.status} - ${errorText}`);
    }

    const workflowData = await response.json();

    return NextResponse.json({
      initialStory: workflowData.initialStory,
      initialEvaluation: workflowData.initialEvaluation,
      revisedStory: workflowData.revisedStory,
      finalStory: workflowData.finalStory,
      finalEvaluation: workflowData.finalEvaluation,
      success: true,
    });
  } catch (error) {
    console.error('Error generating story:', error);
    return NextResponse.json(
      { error: 'Failed to generate story', success: false },
      { status: 500 }
    );
  }
}
