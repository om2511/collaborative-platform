import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const InsightsPanel = ({ insights }) => {
  const [expandedInsights, setExpandedInsights] = useState(new Set());

  if (!insights || insights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
          AI-Driven Insights
        </h3>
        <div className="text-center py-8 text-gray-500">
          <LightBulbIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No insights available at this time</p>
          <p className="text-sm mt-1">Check back after more data is collected</p>
        </div>
      </div>
    );
  }

  const toggleInsight = (index) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedInsights(newExpanded);
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightBgColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getPriorityBadge = (priority) => {
    const baseClasses = 'inline-flex px-2 py-1 text-xs font-medium rounded-full';
    switch (priority) {
      case 'high':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'low':
      default:
        return `${baseClasses} bg-green-100 text-green-800`;
    }
  };

  // Sort insights by priority
  const sortedInsights = [...insights].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
  });

  // Group insights by category
  const groupedInsights = sortedInsights.reduce((acc, insight, index) => {
    const category = insight.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ ...insight, originalIndex: index });
    return acc;
  }, {});

  const categoryLabels = {
    completion: 'Task Completion',
    team: 'Team Performance',
    activity: 'Project Activity',
    planning: 'Project Planning',
    quality: 'Code Quality',
    performance: 'Performance',
    security: 'Security',
    general: 'General'
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
          AI-Driven Insights
          <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {insights.length} insight{insights.length !== 1 ? 's' : ''}
          </span>
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Automated recommendations based on your project data
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {Object.entries(groupedInsights).map(([category, categoryInsights]) => (
          <div key={category} className="p-6">
            <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              {categoryLabels[category] || category}
              <span className="ml-2 text-sm text-gray-500">
                ({categoryInsights.length})
              </span>
            </h4>
            
            <div className="space-y-4">
              {categoryInsights.map((insight, categoryIndex) => (
                <div
                  key={categoryIndex}
                  className={`border rounded-lg ${getInsightBgColor(insight.type)}`}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleInsight(insight.originalIndex)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium text-gray-900">
                              {insight.title}
                            </h5>
                            <div className="flex items-center space-x-2">
                              <span className={getPriorityBadge(insight.priority)}>
                                {insight.priority}
                              </span>
                              {expandedInsights.has(insight.originalIndex) ? (
                                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                          
                          {expandedInsights.has(insight.originalIndex) && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {insight.message}
                              </p>
                              
                              {insight.suggestions && insight.suggestions.length > 0 && (
                                <div className="mt-3">
                                  <h6 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                                    Recommendations
                                  </h6>
                                  <ul className="list-disc list-inside space-y-1">
                                    {insight.suggestions.map((suggestion, suggestionIndex) => (
                                      <li key={suggestionIndex} className="text-sm text-gray-600">
                                        {suggestion}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {insight.metrics && (
                                <div className="mt-3">
                                  <h6 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                                    Related Metrics
                                  </h6>
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(insight.metrics).map(([key, value]) => (
                                      <span key={key} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                        {key}: {value}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-red-500" />
              {insights.filter(i => i.priority === 'high').length} high priority
            </span>
            <span className="flex items-center">
              <InformationCircleIcon className="h-4 w-4 mr-1 text-yellow-500" />
              {insights.filter(i => i.priority === 'medium').length} medium priority
            </span>
            <span className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
              {insights.filter(i => i.priority === 'low').length} low priority
            </span>
          </div>
          <button
            onClick={() => setExpandedInsights(expandedInsights.size === insights.length ? new Set() : new Set(insights.map((_, i) => i)))}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {expandedInsights.size === insights.length ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;