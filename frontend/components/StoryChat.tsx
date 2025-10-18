'use client';

import { useState } from 'react';
import { Message } from './Message';
import { StoryInput } from './StoryInput';
import { StoryEvaluation } from './StoryEvaluation';
import { WorkflowCollapsible } from './WorkflowCollapsible';
import { UserFeedback } from './UserFeedback';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  evaluation?: {
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
  isWorkflowMessage?: boolean;
  workflowData?: {
    initialStory: string;
    initialEvaluation: {
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
    revisedStory: string;
  };
  needsUserFeedback?: boolean;
  isFinalRevision?: boolean;
}

export function StoryChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI storyteller. What kind of bedtime story would you like to hear tonight? Tell me about your favorite animals, adventures, or magical places!",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStoryPrompt, setCurrentStoryPrompt] = useState<string>('');

  const generateStory = async (prompt: string) => {
    setIsLoading(true);
    setCurrentStoryPrompt(prompt);

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);

    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate story');
      }

      const data = await response.json();

      console.log('Workflow response:', data);
      console.log('Initial story length:', data.initialStory?.length);
      console.log('Revised story length:', data.revisedStory?.length);

      // Step 1: Show initial story with evaluation
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.initialStory,
          isWorkflowMessage: true,
          workflowData: {
            initialStory: data.initialStory,
            initialEvaluation: data.initialEvaluation,
            revisedStory: data.revisedStory,
          },
        },
      ]);

      // Step 2: Show "Revising..." state briefly
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: 'Revising the story based on feedback...',
          },
        ]);

        // Step 3: Show revised story after a short delay with user feedback option
        setTimeout(() => {
          setMessages((prev) => {
            // Remove the "Revising..." message
            const withoutRevising = prev.slice(0, -1);
            return [
              ...withoutRevising,
              {
                role: 'assistant',
                content: data.revisedStory,
                needsUserFeedback: true, // Flag to show "Suggest Changes" button
              },
            ];
          });
          setIsLoading(false);
        }, 800);
      }, 500);
    } catch (error) {
      console.error('Error generating story:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: 'Sorry, I had trouble creating a story. Please try again!',
        },
      ]);
      setIsLoading(false);
    }
  };

  const reviseStory = async (feedback: string) => {
    if (!currentStoryPrompt) return;

    setIsLoading(true);

    // Add user feedback message
    setMessages((prev) => [...prev, { role: 'user', content: `Suggested changes: ${feedback}` }]);

    try {
      // Show "Revising based on your feedback..." state
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: 'Revising the story based on your feedback...',
        },
      ]);

      // Call backend to revise story (with full workflow)
      const response = await fetch('/api/story/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentStoryPrompt, feedback }),
      });

      if (!response.ok) {
        throw new Error('Failed to revise story');
      }

      const data = await response.json();

      console.log('Revision workflow response:', data);

      // Remove the "Revising..." message and show user revised story with evaluation
      setTimeout(() => {
        setMessages((prev) => {
          const withoutRevising = prev.slice(0, -1);
          return [
            ...withoutRevising,
            {
              role: 'assistant',
              content: data.userRevisedStory,
              isWorkflowMessage: true,
              workflowData: {
                initialStory: data.userRevisedStory,
                initialEvaluation: data.userRevisionEvaluation,
                revisedStory: data.finalStory,
              },
            },
          ];
        });

        // Show "Judge is evaluating and making final revision..."
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: 'system',
              content: 'Judge is evaluating and making final improvements...',
            },
          ]);

          // Show final story after delay
          setTimeout(() => {
            setMessages((prev) => {
              const withoutEvaluating = prev.slice(0, -1);
              return [
                ...withoutEvaluating,
                {
                  role: 'assistant',
                  content: data.finalStory,
                  evaluation: data.finalEvaluation,
                  isFinalRevision: true,
                },
              ];
            });
            setIsLoading(false);
          }, 800);
        }, 500);
      }, 800);
    } catch (error) {
      console.error('Error revising story:', error);
      setMessages((prev) => {
        const withoutRevising = prev.slice(0, -1);
        return [
          ...withoutRevising,
          {
            role: 'system',
            content: 'Sorry, I had trouble revising the story. Please try again!',
          },
        ];
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Chat Messages Area */}
      <div className="h-[500px] overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx}>
            <Message message={msg} />
            {msg.isWorkflowMessage && msg.workflowData && (
              <WorkflowCollapsible
                initialEvaluation={msg.workflowData.initialEvaluation}
                title="Judge's Evaluation & Revision Process"
              />
            )}
            {msg.needsUserFeedback && (
              <UserFeedback
                onRevise={reviseStory}
                isLoading={isLoading}
              />
            )}
            {msg.isFinalRevision && msg.evaluation && (
              <WorkflowCollapsible
                initialEvaluation={msg.evaluation}
                title="Final Evaluation"
              />
            )}
            {msg.evaluation && !msg.isWorkflowMessage && !msg.isFinalRevision && (
              <StoryEvaluation
                evaluation={msg.evaluation}
                onRevise={reviseStory}
                isLoading={isLoading}
              />
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span>Creating your story...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <StoryInput onSubmit={generateStory} isLoading={isLoading} />
    </div>
  );
}