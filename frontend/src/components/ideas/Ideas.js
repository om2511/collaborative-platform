import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { ideaService } from '../../services/ideaService';
import { projectService } from '../../services/projectService';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import IdeaGenerator from './IdeaGenerator';
import IdeaCard from './IdeaCard';
import CreateIdeaModal from './CreateIdeaModal';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const Ideas = () => {
  const { id: projectId } = useParams();
  const { socket } = useSocket();
  
  const [project, setProject] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [filteredIdeas, setFilteredIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    category: '',
    sort: 'newest'
  });

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadIdeas();
    } else {
      // For general ideas page, load all user's ideas
      loadAllIdeas();
    }
  }, [projectId]);

  useEffect(() => {
    filterAndSortIdeas();
  }, [ideas, filters]);

  // Socket event listeners
  useEffect(() => {
    if (socket && projectId) {
      socket.on('ideas_generated', (data) => {
        setIdeas(prev => [...data.ideas, ...prev]);
        toast.success(`${data.generatedBy.name} generated ${data.ideas.length} new ideas!`);
      });

      socket.on('idea_created', (data) => {
        setIdeas(prev => [data.idea, ...prev]);
        toast.success(`${data.createdBy.name} added a new idea!`);
      });

      socket.on('idea_voted', (data) => {
        setIdeas(prev => prev.map(idea => 
          idea._id === data.ideaId 
            ? { ...idea, votes: { ...idea.votes, upvotes: Array(data.votes.upvotes).fill({}), downvotes: Array(data.votes.downvotes).fill({}) }}
            : idea
        ));
      });

      socket.on('idea_commented', (data) => {
        setIdeas(prev => prev.map(idea => 
          idea._id === data.ideaId 
            ? { ...idea, comments: [...idea.comments, data.comment] }
            : idea
        ));
      });

      socket.on('idea_deleted', (data) => {
        setIdeas(prev => prev.filter(idea => idea._id !== data.ideaId));
        toast.success(`Idea deleted by ${data.deletedBy.name}`);
      });

      return () => {
        socket.off('ideas_generated');
        socket.off('idea_created');
        socket.off('idea_voted');
        socket.off('idea_commented');
        socket.off('idea_deleted');
      };
    }
  }, [socket, projectId]);

  const loadProject = async () => {
    try {
      const response = await projectService.getProject(projectId);
      setProject(response.data.project);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project details');
    }
  };

  const loadAllIdeas = async () => {
    try {
      setIsLoading(true);
      const response = await ideaService.getAllIdeas();
      setIdeas(response.data.ideas);
    } catch (error) {
      console.error('Error loading ideas:', error);
      toast.error('Failed to load ideas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadIdeas = async () => {
    try {
      setIsLoading(true);
      const response = await ideaService.getProjectIdeas(projectId);
      setIdeas(response.data.ideas);
    } catch (error) {
      console.error('Error loading ideas:', error);
      toast.error('Failed to load ideas');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortIdeas = () => {
    let filtered = [...ideas];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(idea =>
        idea.title.toLowerCase().includes(searchTerm) ||
        idea.description.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(idea => idea.status === filters.status);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(idea => idea.priority === filters.priority);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(idea => idea.category === filters.category);
    }

    // Sort
    switch (filters.sort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'most_voted':
        filtered.sort((a, b) => {
          const aVotes = a.votes.upvotes.length - a.votes.downvotes.length;
          const bVotes = b.votes.upvotes.length - b.votes.downvotes.length;
          return bVotes - aVotes;
        });
        break;
      case 'most_commented':
        filtered.sort((a, b) => b.comments.length - a.comments.length);
        break;
      default:
        break;
    }

    setFilteredIdeas(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      category: '',
      sort: 'newest'
    });
  };

  const handleIdeasGenerated = (newIdeas) => {
    setIdeas(prev => {
      // Filter out duplicates based on _id
      const existingIds = new Set(prev.map(idea => idea._id));
      const uniqueNewIdeas = newIdeas.filter(idea => !existingIds.has(idea._id));
      return [...uniqueNewIdeas, ...prev];
    });
  };

  const handleIdeaCreated = (newIdea) => {
    setIdeas(prev => {
      // Check if idea already exists
      const exists = prev.some(idea => idea._id === newIdea._id);
      return exists ? prev : [newIdea, ...prev];
    });
    setShowCreateModal(false);
  };

  const handleIdeaUpdate = (updatedIdea) => {
    setIdeas(prev => prev.map(idea => 
      idea._id === updatedIdea._id ? updatedIdea : idea
    ));
  };

  const handleIdeaDelete = (ideaId) => {
    setIdeas(prev => prev.filter(idea => idea._id !== ideaId));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
            {projectId ? `${project?.title || project?.name || 'Project'} Ideas` : 'All Ideas'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 pr-4">
            {projectId 
              ? 'Brainstorm and collaborate on innovative solutions'
              : 'View and manage ideas from all your projects'
            }
          </p>
        </div>
        <div className="flex-shrink-0">
          {projectId && (
            <Button
              variant="outline"
              icon={PlusIcon}
              iconPosition="left"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center w-full sm:w-auto justify-center"
            >
              <span className="text-sm sm:text-base">Add Idea</span>
            </Button>
          )}
        </div>
      </div>

      {/* AI Idea Generator - Only show for project-specific pages */}
      {projectId && (
        <IdeaGenerator
          projectId={projectId}
          project={project}
          onIdeasGenerated={handleIdeasGenerated}
        />
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search ideas..."
                className="pl-8 sm:pl-10 w-full px-3 py-2 text-sm sm:text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <select
              className="w-full px-3 py-2 text-sm sm:text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="implemented">Implemented</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <select
              className="w-full px-3 py-2 text-sm sm:text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <select
              className="w-full px-3 py-2 text-sm sm:text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="feature">Feature</option>
              <option value="improvement">Improvement</option>
              <option value="innovation">Innovation</option>
              <option value="process">Process</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              className="w-full px-3 py-2 text-sm sm:text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_voted">Most Voted</option>
              <option value="most_commented">Most Commented</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        {(filters.search || filters.status || filters.priority || filters.category) && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
            <span className="text-xs sm:text-sm text-gray-500">
              {filteredIdeas.length} of {ideas.length} ideas
            </span>
            <Button 
              variant="outline" 
              className="text-gray-900 hover:text-white text-xs sm:text-sm" 
              size="sm" 
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4">
          <LightBulbIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            {ideas.length === 0 ? 'No ideas yet' : 'No ideas match your filters'}
          </h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto">
            {ideas.length === 0 
              ? (projectId 
                  ? 'Start brainstorming with AI or add your first idea'
                  : 'Join a project to start creating ideas'
                )
              : 'Try adjusting your search criteria'
            }
          </p>
          {ideas.length === 0 && projectId && (
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto"
            >
              Add First Idea
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {filteredIdeas.map((idea, index) => (
            <IdeaCard
              key={`idea-${idea._id || idea.id || index}`}
              idea={idea}
              onIdeaUpdate={handleIdeaUpdate}
              onIdeaDelete={handleIdeaDelete}
            />
          ))}
        </div>
      )}

      {/* Create Idea Modal - Only show for project context */}
      {projectId && (
        <CreateIdeaModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          projectId={projectId}
          onIdeaCreated={handleIdeaCreated}
        />
      )}
    </div>
  );
};

export default Ideas;