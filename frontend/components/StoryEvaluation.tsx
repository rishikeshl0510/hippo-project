'use client';

import { useState } from 'react';

interface StoryEvaluationProps {
  evaluation: {
    metrics?: {
      age_suitability?: boolean;
      relevance_to_prompt?: boolean;
      moral_coherence?: boolean;
      creativity?: boolean;
      safety_ok?: boolean;
    };
    feedback: string;
    revision_tips?: string;
    decision?: boolean;
  };
  onRevise: (feedback: string) => void;
  isLoading: boolean;
}

export function StoryEvaluation({ evaluation, onRevise, isLoading }: StoryEvaluationProps) {
  const [showRevision, setShowRevision] = useState(false);
  const [revisionInput, setRevisionInput] = useState('');

  const metrics = evaluation.metrics || {};
  const metricsCount = Object.keys(metrics).length;
  const passedMetrics = Object.values(metrics).filter(Boolean).length;

  const handleRevise = () => {
    if (revisionInput.trim()) {
      onRevise(revisionInput.trim());
      setRevisionInput('');
      setShowRevision(false);
    }
  };

  return (
    <div className="mt-3 ml-12 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
      <div className="text-sm font-semibold text-indigo-900 mb-2">
        Story Evaluation ({passedMetrics}/{metricsCount} metrics passed - {evaluation.decision ? 'Approved' : 'Needs revision'})
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
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

      <div className="text-sm text-gray-700 mb-3 italic">
        "{evaluation.feedback}"
      </div>

      {evaluation.revision_tips && (
        <div className="text-sm text-gray-700 p-3 mb-3 bg-amber-50 rounded border border-amber-200">
          <div className="font-semibold text-amber-900 mb-1">Instructions to Storyteller:</div>
          <div className="text-gray-700 whitespace-pre-line">{evaluation.revision_tips}</div>
        </div>
      )}

      {!showRevision ? (
        <button
          onClick={() => setShowRevision(true)}
          className="text-xs px-3 py-1 bg-white border border-indigo-300 text-indigo-700 rounded-full hover:bg-indigo-50 transition-colors"
        >
          Suggest Changes
        </button>
      ) : (
        <div className="flex space-x-2">
          <input
            type="text"
            value={revisionInput}
            onChange={(e) => setRevisionInput(e.target.value)}
            placeholder="What would you like to change?"
            className="flex-1 px-3 py-1 text-sm border border-indigo-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          />
          <button
            onClick={handleRevise}
            disabled={!revisionInput.trim() || isLoading}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
          >
            Revise
          </button>
          <button
            onClick={() => setShowRevision(false)}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
