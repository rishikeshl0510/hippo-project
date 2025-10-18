import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

export async function POST(request: NextRequest) {
  try {
    const { prompt, feedback } = await request.json();

    if (!prompt || !feedback) {
      return NextResponse.json(
        { error: 'Both prompt and feedback are required' },
        { status: 400 }
      );
    }

    console.log('BACKEND_URL:', BACKEND_URL);
    console.log('Calling backend revise endpoints...');

    // Step 1: Revise the story based on user feedback
    const reviseResponse = await fetch(`${BACKEND_URL}/api/revise-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, feedback }),
    });

    if (!reviseResponse.ok) {
      throw new Error('Backend API call failed');
    }

    const revisedData = await reviseResponse.json();

    // Step 2: Judge evaluates the revised story
    const evaluationResponse = await fetch(`${BACKEND_URL}/api/evaluate-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ story: revisedData.story, prompt }),
    });

    if (!evaluationResponse.ok) {
      throw new Error('Evaluation API call failed');
    }

    const evaluationData = await evaluationResponse.json();
    const judgeFeedback = evaluationData.evaluation.feedback;

    // Step 3: Revise again based on judge's feedback (final revision)
    const finalReviseResponse = await fetch(`${BACKEND_URL}/api/revise-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, feedback: judgeFeedback }),
    });

    if (!finalReviseResponse.ok) {
      throw new Error('Final revision API call failed');
    }

    const finalStoryData = await finalReviseResponse.json();

    // Step 4: Final evaluation
    const finalEvaluationResponse = await fetch(`${BACKEND_URL}/api/evaluate-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ story: finalStoryData.story, prompt }),
    });

    if (!finalEvaluationResponse.ok) {
      throw new Error('Final evaluation API call failed');
    }

    const finalEvaluationData = await finalEvaluationResponse.json();

    return NextResponse.json({
      userRevisedStory: revisedData.story,
      userRevisionEvaluation: evaluationData.evaluation,
      finalStory: finalStoryData.story,
      finalEvaluation: finalEvaluationData.evaluation,
      success: true,
    });
  } catch (error) {
    console.error('Error revising story:', error);
    return NextResponse.json(
      { error: 'Failed to revise story', success: false },
      { status: 500 }
    );
  }
}