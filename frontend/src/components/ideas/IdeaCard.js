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
    <>
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden min-w-0">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-white/20 to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative min-w-0 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {idea.aiGenerated && (
              <div className="flex items-center text-purple-700 bg-purple-100/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium border border-purple-200/50 shadow-sm flex-shrink-0">
                <SparklesIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">AI Generated</span>
                <span className="sm:hidden">AI</span>
              </div>
            )}
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border shadow-sm flex-shrink-0 ${getStatusColor(idea.status)}`}>
              {idea.status.replace('_', ' ')}
            </span>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border shadow-sm flex-shrink-0 ${getPriorityColor(idea.priority)}`}>
              <span className="hidden sm:inline whitespace-nowrap">{idea.priority} priority</span>
              <span className="sm:hidden">{idea.priority}</span>
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors duration-200 break-words">{idea.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed break-words">{idea.description}</p>
          
          {/* Implementation details for AI ideas */}
          {idea.aiGenerated && idea.implementation && (
            <div className="mt-4 p-3 bg-purple-50/80 backdrop-blur-sm rounded-xl border border-purple-200/50 space-y-2 min-w-0">
              {idea.implementation.requiredResources?.length > 0 && (
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-purple-700">Implementation: </span>
                  <span className="text-xs text-purple-600 break-words">{idea.implementation.requiredResources[0]}</span>
                </div>
              )}
              {idea.implementation.timeline && (
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-purple-700">Impact: </span>
                  <span className="text-xs text-purple-600 break-words">{idea.implementation.timeline}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 min-w-0">
          <Button
            variant="primary"
            size="sm"
            icon={EyeIcon}
            iconPosition="left"
            onClick={() => setShowDetailModal(true)}
            className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0"
            title="View details"
          >
            <span className="hidden sm:inline ml-1.5 whitespace-nowrap">View</span>
          </Button>
          
          {canDelete() && (
            <Button
              variant="danger"
              size="sm"
              icon={TrashIcon}
              iconPosition="left"
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0"
              title="Delete idea"
            >
              <span className="hidden sm:inline ml-1.5 whitespace-nowrap">Delete</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tags */}
      {idea.tags && idea.tags.length > 0 && (
        <div className="mb-4 relative min-w-0">
          <div className="flex flex-wrap gap-2">
            {idea.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-100/80 backdrop-blur-sm text-indigo-700 border border-indigo-200/50 shadow-sm break-all"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200/50 relative">
        {/* Voting and Comments Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-center sm:justify-start space-x-2 flex-wrap gap-2">
            {/* Voting */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleVote('upvote')}
                disabled={isVoting}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-full text-sm transition-all duration-200 backdrop-blur-sm shadow-sm ${
                  userVote === 'upvote'
                    ? 'bg-green-100/80 text-green-700 border border-green-200/50'
                    : 'text-gray-500 hover:bg-gray-100/80 bg-white/50 border border-gray-200/50'
                }`}
              >
                {userVote === 'upvote' ? (
                  <HandThumbUpIconSolid className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <HandThumbUpIcon className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="font-medium">{idea.votes.upvotes.length}</span>
              </button>

              <button
                onClick={() => handleVote('downvote')}
                disabled={isVoting}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-full text-sm transition-all duration-200 backdrop-blur-sm shadow-sm ${
                  userVote === 'downvote'
                    ? 'bg-red-100/80 text-red-700 border border-red-200/50'
                    : 'text-gray-500 hover:bg-gray-100/80 bg-white/50 border border-gray-200/50'
                }`}
              >
                {userVote === 'downvote' ? (
                  <HandThumbDownIconSolid className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <HandThumbDownIcon className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="font-medium">{idea.votes.downvotes.length}</span>
              </button>

              <div className="text-sm font-semibold text-gray-700 px-3 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-gray-200/50 shadow-sm">
                {totalVotes > 0 ? `+${totalVotes}` : totalVotes}
              </div>
            </div>

            {/* Comments */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 text-sm px-3 py-2 rounded-full hover:bg-gray-100/80 bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-sm transition-all duration-200"
            >
              <ChatBubbleLeftIcon className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{idea.comments.length}</span>
              <span className="hidden sm:inline">comments</span>
            </button>
          </div>
        </div>

        {/* Creator and Date Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-200/50 shadow-sm min-w-0">
            <UserIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate font-medium">{idea.creator?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-200/50 shadow-sm flex-shrink-0">
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline font-medium whitespace-nowrap">{new Date(idea.createdAt).toLocaleDateString()}</span>
            <span className="sm:hidden font-medium whitespace-nowrap">{new Date(idea.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-6 pt-6 border-t border-gray-200/50 relative">
          {/* Comments List */}
          <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
            {idea.comments.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100/80 backdrop-blur-sm rounded-2xl mb-4 shadow-sm border border-gray-200/50">
                  <ChatBubbleLeftIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm mb-2 font-medium">No comments yet</p>
                <p className="text-gray-500 text-xs">Be the first to share your thoughts!</p>
              </div>
            ) : (
              idea.comments.map((comment, index) => (
                <div key={index} className="flex space-x-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/50 hover:bg-white/70 transition-all duration-200 shadow-sm">
                  <div className="flex-shrink-0">
                    {comment.user?.avatar ? (
                      <img 
                        src={comment.user.avatar} 
                        alt={comment.user?.name || 'User'}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-2 ring-white shadow-sm">
                        <span className="text-sm font-medium text-white">
                          {comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {comment.user?.name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-200/50 shadow-sm">
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
          <div className="border-t border-gray-200/50 pt-4">
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name || 'You'}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-2 ring-white shadow-sm">
                    <span className="text-sm font-medium text-white">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'Y'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none placeholder-gray-400 bg-white/50 backdrop-blur-sm transition-all duration-200 shadow-sm"
                    placeholder={`What are your thoughts, ${user?.name?.split(' ')[0] || 'there'}?`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isCommenting}
                    maxLength={500}
                  />
                  <div className="absolute bottom-2 right-3 text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full">
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
                      className="bg-white/50 border-gray-200/50 backdrop-blur-sm hover:bg-white/70 text-gray-700 transition-all duration-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleComment}
                      disabled={!newComment.trim() || isCommenting}
                      loading={isCommenting}
                      size="sm"
                      variant="primary"
                      className="min-w-[80px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-md hover:shadow-lg transition-all duration-200"
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
      </div>

      {/* Detail Modal - Rendered outside the card container */}
      <IdeaDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        idea={idea}
        onIdeaUpdate={onIdeaUpdate}
      />
    </>
  );
};export default IdeaCard;