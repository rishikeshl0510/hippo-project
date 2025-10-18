'use client';

import { useState } from 'react';

interface UserFeedbackProps {
  onRevise: (feedback: string) => void;
  isLoading: boolean;
}

export function UserFeedback({ onRevise, isLoading }: UserFeedbackProps) {
  const [showInput, setShowInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const handleSubmit = () => {
    if (feedbackText.trim()) {
      onRevise(feedbackText.trim());
      setFeedbackText('');
      setShowInput(false);
    }
  };

  return (
    <div className="mt-3 ml-12 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="text-sm font-semibold text-blue-900 mb-2">
        Would you like to suggest any changes?
      </div>

      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="text-sm px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          disabled={isLoading}
        >
          Suggest Changes
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="What would you like to change? (e.g., 'Make it funnier', 'Add more adventure', 'Change the ending')"
            className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isLoading}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSubmit}
              disabled={!feedbackText.trim() || isLoading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Submit Feedback
            </button>
            <button
              onClick={() => {
                setShowInput(false);
                setFeedbackText('');
              }}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
