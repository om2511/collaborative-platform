import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { ideaService } from '../../services/ideaService';
import Modal from '../common/Modal';
import Button from '../common/Button';
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftIcon,
  SparklesIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid
} from '@heroicons/react/24/solid';

const IdeaDetailModal = ({ isOpen, onClose, idea, onIdeaUpdate }) => {
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  if (!idea) return null;

  const userVote = getUserVote();
  const totalVotes = idea.votes.upvotes.length - idea.votes.downvotes.length;

  function getUserVote() {
    if (idea.votes.upvotes.some(vote => vote.user === user._id)) return 'upvote';
    if (idea.votes.downvotes.some(vote => vote.user === user._id)) return 'downvote';
    return null;
  }

  const handleVote = async (type) => {
    try {
      setIsVoting(true);
      
      await ideaService.voteOnIdea(idea._id, type);
      
      // Update local state optimistically
      const updatedIdea = { ...idea };
      
      // Remove existing vote
      updatedIdea.votes.upvotes = updatedIdea.votes.upvotes.filter(vote => vote.user !== user._id);
      updatedIdea.votes.downvotes = updatedIdea.votes.downvotes.filter(vote => vote.user !== user._id);
      
      // Add new vote if different from current
      if (userVote !== type) {
        if (type === 'upvote') {
          updatedIdea.votes.upvotes.push({ user: user._id, votedAt: new Date() });
        } else {
          updatedIdea.votes.downvotes.push({ user: user._id, votedAt: new Date() });
        }
      }
      
      onIdeaUpdate(updatedIdea);
      
    } catch (error) {
      console.error('Error voting on idea:', error);
      toast.error('Failed to record vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsCommenting(true);
      
      const response = await ideaService.addComment(idea._id, newComment.trim());
      
      // Update local state
      const updatedIdea = {
        ...idea,
        comments: [...idea.comments, response.data.comment]
      };
      
      onIdeaUpdate(updatedIdea);
      setNewComment('');
      toast.success('Comment added');
      
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      implemented: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Idea Details">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            {idea.aiGenerated && (
              <div className="flex items-center text-purple-600 bg-purple-100 px-2 py-1 rounded-full text-xs">
                <SparklesIcon className="h-3 w-3 mr-1" />
                AI Generated
              </div>
            )}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(idea.status)}`}>
              {idea.status.replace('_', ' ')}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(idea.priority)}`}>
              {idea.priority} priority
            </span>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{idea.title}</h2>
          <p className="text-gray-600">{idea.description}</p>
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <UserIcon className="h-4 w-4" />
                <span>Created by {idea.creator?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <CalendarIcon className="h-4 w-4" />
                <span>{formatDate(idea.createdAt)}</span>
              </div>
            </div>
          </div>

          {idea.updatedAt !== idea.createdAt && (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <ClockIcon className="h-4 w-4" />
              <span>Last updated {formatDate(idea.updatedAt)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <TagIcon className="h-4 w-4 mr-1" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {idea.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Implementation details for AI ideas */}
        {idea.aiGenerated && idea.implementation && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Implementation Details</h4>
            <div className="bg-purple-50 rounded-lg p-4 space-y-2">
              {idea.implementation.requiredResources?.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-purple-700">Resources: </span>
                  <ul className="text-sm text-purple-600 list-disc list-inside">
                    {idea.implementation.requiredResources.map((resource, index) => (
                      <li key={index}>{resource}</li>
                    ))}
                  </ul>
                </div>
              )}
              {idea.implementation.timeline && (
                <div>
                  <span className="text-sm font-medium text-purple-700">Timeline: </span>
                  <span className="text-sm text-purple-600">{idea.implementation.timeline}</span>
                </div>
              )}
              {idea.implementation.impact && (
                <div>
                  <span className="text-sm font-medium text-purple-700">Expected Impact: </span>
                  <span className="text-sm text-purple-600">{idea.implementation.impact}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Voting */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Community Feedback</h4>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleVote('upvote')}
                  disabled={isVoting}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm transition-colors ${
                    userVote === 'upvote'
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {userVote === 'upvote' ? (
                    <HandThumbUpIconSolid className="h-4 w-4" />
                  ) : (
                    <HandThumbUpIcon className="h-4 w-4" />
                  )}
                  <span>{idea.votes.upvotes.length}</span>
                </button>

                <button
                  onClick={() => handleVote('downvote')}
                  disabled={isVoting}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm transition-colors ${
                    userVote === 'downvote'
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {userVote === 'downvote' ? (
                    <HandThumbDownIconSolid className="h-4 w-4" />
                  ) : (
                    <HandThumbDownIcon className="h-4 w-4" />
                  )}
                  <span>{idea.votes.downvotes.length}</span>
                </button>
              </div>

              <div className="text-sm font-medium text-gray-700">
                Score: {totalVotes > 0 ? `+${totalVotes}` : totalVotes}
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-2 mb-4">
            <ChatBubbleLeftIcon className="h-5 w-5 text-gray-500" />
            <h4 className="text-sm font-medium text-gray-700">
              Comments ({idea.comments.length})
            </h4>
          </div>
          
          <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
            {idea.comments.length === 0 ? (
              <p className="text-gray-500 text-sm">No comments yet. Be the first to share your thoughts!</p>
            ) : (
              idea.comments.map((comment, index) => (
                <div key={index} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    {comment.user?.avatar ? (
                      <img 
                        src={comment.user.avatar} 
                        alt={comment.user?.name || 'User'}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm text-gray-600">
                          {comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.user?.name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <textarea
                rows={3}
                className="w-full h-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isCommenting}
              />
            </div>
            <Button
              onClick={handleComment}
              disabled={!newComment.trim() || isCommenting}
              loading={isCommenting}
              size="sm"
              variant="primary"
            >
              Comment
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default IdeaDetailModal;