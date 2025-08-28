import api from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const chatService = {
  // Get chat messages for a project
  getProjectMessages: async (projectId) => {
    try {
      const response = await api.get(`/chat/project/${projectId}`);
      
      // If backend returns successful response with messages
      if (response.data && response.data.success) {
        const messages = response.data.data?.messages || [];
        
        // If we got messages from backend, store them locally and return
        if (messages.length > 0) {
          storeMessages(projectId, messages);
          return response.data;
        }
        
        // If backend has no messages, check localStorage for existing messages
        const storedMessages = getStoredMessages(projectId);
        if (storedMessages.length > 0) {
          return {
            success: true,
            data: { messages: storedMessages }
          };
        }
        
        // No messages anywhere, return empty
        return response.data;
      }
      
      // Backend error, fallback to localStorage
      return {
        success: true,
        data: {
          messages: getStoredMessages(projectId)
        }
      };
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      // Fallback to localStorage
      return {
        success: true,
        data: {
          messages: getStoredMessages(projectId)
        }
      };
    }
  },

  // Send a new message
  sendMessage: async (projectId, messageData) => {
    try {
      const response = await api.post('/chat', {
        projectId,
        content: messageData.content,
        type: messageData.type || 'text'
      });
      
      // Check if backend returned a proper message object
      if (response.data && response.data.success && response.data.data?.message) {
        const message = response.data.data.message;
        // Backend saved successfully, also store locally for offline access
        storeMessage(projectId, message);
        return response.data;
      } else {
        throw new Error('Invalid backend response');
      }
    } catch (error) {
      console.error('Error sending message to backend:', error);
      
      // Create fallback message object for localStorage
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        content: messageData.content,
        type: messageData.type || 'text',
        sender: messageData.sender,
        timestamp: new Date()
      };
      
      // Store locally if backend is not available
      storeMessage(projectId, message);
      return {
        success: true,
        data: { message }
      };
    }
  },

  // Edit message
  editMessage: async (messageId, content) => {
    try {
      const response = await api.put(`/chat/message/${messageId}`, { content });
      return response.data;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/chat/message/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Clear all messages for a project
  clearProjectMessages: async (projectId) => {
    try {
      const response = await api.delete(`/chat/project/${projectId}/clear`);
      // Also clear localStorage
      try {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${projectId}`);
      } catch (localError) {
        console.warn('Could not clear localStorage:', localError);
      }
      return response.data;
    } catch (error) {
      console.error('Error clearing project messages:', error);
      // Still clear localStorage even if backend fails
      try {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${projectId}`);
      } catch (localError) {
        console.warn('Could not clear localStorage:', localError);
      }
      return {
        success: true,
        message: 'Messages cleared locally (backend unavailable)'
      };
    }
  }
};

// Local storage functions for message persistence
const STORAGE_KEY_PREFIX = 'chat_messages_';

const getStoredMessages = (projectId) => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${projectId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error retrieving stored messages:', error);
    return [];
  }
};

const storeMessage = (projectId, message) => {
  try {
    const existing = getStoredMessages(projectId);
    const updated = [...existing, message];
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${projectId}`, JSON.stringify(updated));
  } catch (error) {
    console.error('Error storing message:', error);
  }
};

const storeMessages = (projectId, messages) => {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${projectId}`, JSON.stringify(messages));
  } catch (error) {
    console.error('Error storing messages:', error);
  }
};

// Export utility functions for external use
export const chatUtils = {
  getStoredMessages,
  storeMessage,
  storeMessages,
  clearMessages: (projectId) => {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${projectId}`);
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  },
  
  // Migrate localStorage messages to backend (one-time sync)
  migrateLocalMessages: async (projectId) => {
    try {
      const localMessages = getStoredMessages(projectId);
      if (localMessages.length === 0) return;
      
      
      // Try to send each local message to backend
      for (const msg of localMessages) {
        try {
          await chatService.sendMessage(projectId, {
            content: msg.content,
            type: msg.type || 'text',
            sender: msg.sender
          });
        } catch (error) {
          console.warn('Failed to migrate message:', msg.id, error);
        }
      }
      
      // Clear local storage after successful migration
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${projectId}`);
    } catch (error) {
      console.error('Error migrating local messages:', error);
    }
  }
};

export default chatService;