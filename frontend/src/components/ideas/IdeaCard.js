import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { ideaService } from '../../services/ideaService';
import Button from '../common/Button';
import IdeaDetailModal from './IdeaDetailModal';
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftIcon,
  SparklesIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid
} from '@heroicons/react/24/solid';

const IdeaCard = ({ idea, onIdeaUpdate, onIdeaDelete }) => {
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      
      // Update local state with optimistic update
      const newCommentObj = {
        text: newComment.trim(),
        content: newComment.trim(),
        user: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar
        },
        createdAt: new Date().toISOString(),
        ...response.data.comment
      };
      
      const updatedIdea = {
        ...idea,
        comments: [...idea.comments, newCommentObj]
      };
      
      onIdeaUpdate(updatedIdea);
      setNewComment('');
      toast.success('Comment posted successfully!');
      
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setIsCommenting(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleComment();
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

  const canDelete = () => {
    // Allow deletion if user is the creator or has admin/manager role
    return (
      user._id === idea.creator?._id ||
      user.role === 'admin' ||
      user.role === 'manager'
    );
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await ideaService.deleteIdea(idea._id);
      onIdeaDelete && onIdeaDelete(idea._id);
      toast.success('Idea deleted successfully');
    } catch (error) {
      console.error('Error deleting idea:', error);
      toast.error('Failed to delete idea');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
            {idea.aiGenerated && (
              <div className="flex items-center text-purple-600 bg-purple-100 px-2 py-1 rounded-full text-xs">
                <SparklesIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="hidden sm:inline">AI Generated</span>
                <span className="sm:hidden">AI</span>
              </div>
            )}
            <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(idea.status)}`}>
              {idea.status.replace('_', ' ')}
            </span>
            <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(idea.priority)}`}>
              <span className="hidden sm:inline">{idea.priority} priority</span>
              <span className="sm:hidden">{idea.priority}</span>
            </span>
          </div>
          
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{idea.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 sm:line-clamp-3">{idea.description}</p>
          
          {/* Implementation details for AI ideas */}
          {idea.aiGenerated && idea.implementation && (
            <div className="mt-3 space-y-2">
              {idea.implementation.requiredResources?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-gray-700">Implementation: </span>
                  <span className="text-xs text-gray-600">{idea.implementation.requiredResources[0]}</span>
                </div>
              )}
              {idea.implementation.timeline && (
                <div>
                  <span className="text-xs font-medium text-gray-700">Impact: </span>
                  <span className="text-xs text-gray-600">{idea.implementation.timeline}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <Button
            variant="primary"
            size="sm"
            icon={EyeIcon}
            iconPosition="left"
            onClick={() => setShowDetailModal(true)}
            className="text-white p-2 sm:px-3"
            title="View details"
          >
            <span className="hidden sm:inline ml-1">View</span>
          </Button>
          
          {canDelete() && (
            <Button
              variant="danger"
              size="sm"
              icon={TrashIcon}
              iconPosition="left"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-white p-2 sm:px-3"
              title="Delete idea"
            >
              <span className="hidden sm:inline ml-1">Delete</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tags */}
      {idea.tags && idea.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
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

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-gray-200 gap-3 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Voting */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => handleVote('upvote')}
              disabled={isVoting}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs sm:text-sm transition-colors ${
                userVote === 'upvote'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {userVote === 'upvote' ? (
                <HandThumbUpIconSolid className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <HandThumbUpIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span>{idea.votes.upvotes.length}</span>
            </button>

            <button
              onClick={() => handleVote('downvote')}
              disabled={isVoting}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs sm:text-sm transition-colors ${
                userVote === 'downvote'
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {userVote === 'downvote' ? (
                <HandThumbDownIconSolid className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <HandThumbDownIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span>{idea.votes.downvotes.length}</span>
            </button>

            <div className="text-xs sm:text-sm font-medium text-gray-700 px-1">
              {totalVotes > 0 ? `+${totalVotes}` : totalVotes}
            </div>
          </div>

          {/* Comments */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 text-xs sm:text-sm px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ChatBubbleLeftIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{idea.comments.length}</span>
            <span className="hidden sm:inline ml-1">comments</span>
          </button>
        </div>

        {/* Creator and Date */}
        <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate max-w-[100px] sm:max-w-none">{idea.creator?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{new Date(idea.createdAt).toLocaleDateString()}</span>
            <span className="sm:hidden">{new Date(idea.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* Comments List */}
          <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
            {idea.comments.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                  <ChatBubbleLeftIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm mb-2">No comments yet</p>
                <p className="text-gray-400 text-xs">Be the first to share your thoughts!</p>
              </div>
            ) : (
              idea.comments.map((comment, index) => (
                <div key={index} className="flex space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0">
                    {comment.user?.avatar ? (
                      <img 
                        src={comment.user.avatar} 
                        alt={comment.user?.name || 'User'}
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-2 ring-white">
                        <span className="text-xs font-medium text-white">
                          {comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {comment.user?.name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Recently'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed break-words">
                      {comment.text || comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name || 'You'}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ring-2 ring-white">
                    <span className="text-xs font-medium text-white">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'Y'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none placeholder-gray-400 bg-white"
                    placeholder={`What are your thoughts, ${user?.name?.split(' ')[0] || 'there'}?`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isCommenting}
                    maxLength={500}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {newComment.length}/500
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-500">
                    Press Ctrl+Enter to post quickly
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewComment('');
                        setShowComments(false);
                      }}
                      disabled={isCommenting}
                      className="text-gray-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleComment}
                      disabled={!newComment.trim() || isCommenting}
                      loading={isCommenting}
                      size="sm"
                      variant="primary"
                      className="min-w-[80px]"
                    >
                      {isCommenting ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <IdeaDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        idea={idea}
        onIdeaUpdate={onIdeaUpdate}
      />
    </div>
  );
};

export default IdeaCard;