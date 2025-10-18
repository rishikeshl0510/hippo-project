'use client';

import { useState } from 'react';

interface WorkflowCollapsibleProps {
  initialEvaluation: {
    metrics?: {
      age_suitability?: boolean;
      relevance_to_prompt?: boolean;
      moral_coherence?: boolean;
      creativity?: boolean;
      safety_ok?: boolean;
    };
    scores?: {
      [key: string]: number;
    };
    feedback: string;
    revision_tips?: string;
    decision?: boolean;
  };
  title: string;
}

export function WorkflowCollapsible({ initialEvaluation, title }: WorkflowCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Backend returns metrics (boolean), convert to display format
  const metrics = initialEvaluation?.metrics || {};
  const metricsCount = Object.keys(metrics).length;
  const passedMetrics = Object.values(metrics).filter(Boolean).length;
  const passPercentage = metricsCount > 0 ? (passedMetrics / metricsCount) * 100 : 0;
  const decision = initialEvaluation?.decision;

  return (
    <div className="mt-3 ml-12 p-3 bg-purple-50 rounded-lg border border-purple-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-purple-900">
            {title}
          </span>
          <span className="text-xs text-purple-600">
            ({passedMetrics}/{metricsCount} metrics passed - {decision ? 'Approved' : 'Needs revision'})
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-purple-600 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(metrics).map(([key, value]) => (
              <div key={key} className="text-xs">
                <span className="capitalize text-gray-700">
                  {key.replace(/_/g, ' ')}:
                </span>{' '}
                <span className={`font-semibold ${value ? 'text-green-600' : 'text-red-600'}`}>
                  {value ? 'Pass' : 'Fail'}
                </span>
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-700 p-3 bg-white rounded border border-purple-100">
            <div className="font-semibold text-purple-900 mb-1">Judge's Feedback:</div>
            <div className="italic text-gray-700">"{initialEvaluation.feedback}"</div>
          </div>

          {initialEvaluation.revision_tips && (
            <div className="text-sm text-gray-700 p-3 bg-amber-50 rounded border border-amber-200">
              <div className="font-semibold text-amber-900 mb-1">Instructions to Storyteller:</div>
              <div className="text-gray-700 whitespace-pre-line">{initialEvaluation.revision_tips}</div>
            </div>
          )}

          <div className="text-xs text-purple-600 font-medium mt-2">
            → Using this feedback to revise the story...
          </div>
        </div>
      )}
    </div>
  );
}
