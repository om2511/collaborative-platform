import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ideaService } from '../../services/ideaService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  LightBulbIcon,
  SparklesIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

const IdeaGenerator = ({ projectId, project, onIdeasGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedPrompts] = useState([
    'How can we improve user engagement?',
    'What features would make our product stand out?',
    'How can we reduce development time?',
    'What marketing strategies could we try?',
    'How can we improve team collaboration?',
    'What technical innovations could we implement?'
  ]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to generate ideas');
      return;
    }

    try {
      setIsGenerating(true);
      
      const response = await ideaService.generateIdeas(prompt.trim(), projectId);
      
      toast.success(`Generated ${response.data.ideas.length} new ideas!`);
      
      if (onIdeasGenerated) {
        onIdeasGenerated(response.data.ideas);
      }
      
      setPrompt('');
    } catch (error) {
      console.error('Error generating ideas:', error);
      toast.error(error.response?.data?.message || 'Failed to generate ideas');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestedPrompt = (suggestedPrompt) => {
    setPrompt(suggestedPrompt);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden hover:shadow-2xl transition-all duration-300">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100/50 to-transparent rounded-full translate-y-4 -translate-x-4"></div>
      
      <div className="flex items-center mb-6 relative">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl mr-4 shadow-lg">
          <SparklesIcon className="h-7 w-7 text-white" />
        </div>
        <div>
          <h3 className="text-xl mb-0 font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">AI Idea Generator</h3>
          <p className="text-sm mb-0 text-gray-600 font-medium">
            Get creative suggestions powered by AI for your project
          </p>
        </div>
      </div>

      {/* Project Context */}
      {project && (
        <div className="mb-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm relative">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Project Context</h4>
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">{project.title}</span> • <span className="bg-blue-100/80 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">{project.category}</span> • {project.team?.length} team members
          </p>
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{project.description}</p>
        </div>
      )}

      {/* Prompt Input */}
      <div className="mb-6 relative">
        <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700 mb-3">
          What kind of ideas are you looking for?
        </label>
        <div className="relative">
          <textarea
            id="prompt"
            rows={3}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="Describe what you need ideas for... (e.g., 'Ways to improve user onboarding process')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isGenerating}
          />
          <div className="absolute bottom-3 right-3 flex items-center space-x-2">
            <span className="text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full">
              {prompt.length}/500
            </span>
            {isGenerating && <LoadingSpinner size="sm" className="text-purple-600" />}
          </div>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="mb-6 relative">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Suggested prompts:</h4>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((suggestedPrompt, index) => (
            <button
              key={index}
              onClick={() => handleSuggestedPrompt(suggestedPrompt)}
              className="text-xs px-3 py-2 bg-purple-100/80 hover:bg-purple-200/80 text-purple-700 rounded-full transition-all duration-200 border border-purple-200/50 backdrop-blur-sm shadow-sm hover:shadow-md font-medium"
              disabled={isGenerating}
            >
              {suggestedPrompt}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center text-sm text-gray-500 bg-white/50 backdrop-blur-sm px-3 py-2 rounded-full border border-gray-200/50">
          <ChatBubbleLeftEllipsisIcon className="h-4 w-4 mr-2" />
          <span className="font-medium">Press Enter or click Generate</span>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          loading={isGenerating}
          variant="primary"
          icon={LightBulbIcon}
          iconPosition="left"
          className="flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 border-0 transition-all duration-200"
        >
          {isGenerating ? 'Generating...' : 'Generate Ideas'}
        </Button>
      </div>

      {/* AI Disclaimer */}
      <div className="mt-6 text-xs text-gray-600 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/50 rounded-xl p-3 shadow-sm relative">
        <strong className="text-yellow-700">Note:</strong> AI-generated ideas are suggestions to spark creativity. 
        Please evaluate feasibility and alignment with your project goals.
      </div>
    </div>
  );
};

export default IdeaGenerator;