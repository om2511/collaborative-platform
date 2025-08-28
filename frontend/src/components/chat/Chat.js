import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { chatService, chatUtils } from '../../services/chatService';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  ChatBubbleLeftRightIcon,
  UsersIcon,
  PaperAirplaneIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const Chat = () => {
  const { id: projectId } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (projectId) {
      loadChatHistory();
      
      if (socket) {
        // Join project room for chat
        socket.emit('join_project', projectId);
      }
    }
  }, [projectId, socket]);

  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      const response = await chatService.getProjectMessages(projectId);
      
      if (response.success && response.data?.messages) {
        // Convert stored timestamps back to Date objects and sort by time
        const messages = response.data.messages
          .map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        setMessages(messages);
      } else {
        console.warn('No messages found for project:', projectId);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Don't show error toast, just fall back to empty messages
      // The service will handle localStorage fallback
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on('new_message', (messageData) => {
        // Only process messages from other users (sender should not receive their own messages back)
        if (messageData.sender.id !== user._id) {
          // Add message to local state
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === messageData.id);
            if (exists) return prev;
            return [...prev, messageData];
          });

          // Save received message to localStorage (for persistence across refreshes)
          try {
            chatUtils.storeMessage(projectId, messageData);
          } catch (error) {
            console.warn('Could not persist received message:', error);
          }
        }
      });

      // Listen for typing indicators
      socket.on('user_typing', (data) => {
        if (data.userId !== user._id && data.chatType === 'project') {
          setTypingUsers(prev => {
            if (!prev.find(u => u.userId === data.userId)) {
              return [...prev, data];
            }
            return prev;
          });
        }
      });

      socket.on('user_stopped_typing', (data) => {
        if (data.chatType === 'project') {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }
      });

      // Listen for user presence
      socket.on('user_joined', (data) => {
        setOnlineUsers(prev => {
          if (!prev.find(u => u.id === data.user.id)) {
            return [...prev, data.user];
          }
          return prev;
        });
      });

      socket.on('user_left', (data) => {
        setOnlineUsers(prev => prev.filter(u => u.id !== data.user.id));
      });

      // Listen for chat cleared by other users
      socket.on('chat_cleared', (data) => {
        if (data.projectId === projectId) {
          setMessages([]);
          // Clear localStorage for consistency
          try {
            chatUtils.clearMessages(projectId);
          } catch (error) {
            console.warn('Could not clear localStorage:', error);
          }
          toast.success(`Chat cleared by ${data.clearedBy.name}`);
        }
      });

      return () => {
        socket.off('new_message');
        socket.off('user_typing');
        socket.off('user_stopped_typing');
        socket.off('user_joined');
        socket.off('user_left');
        socket.off('chat_cleared');
      };
    }
  }, [socket, user._id]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content, type = 'text') => {
    if (!content.trim()) return;

    const messageData = {
      content: content.trim(),
      type,
      sender: {
        id: user._id,
        name: user.name,
        avatar: user.avatar
      }
    };

    try {
      // Save message to backend/localStorage
      const response = await chatService.sendMessage(projectId, messageData);
      
      if (response.success) {
        const savedMessage = response.data.message;
        
        // Add message to local state if not already added by socket event
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === savedMessage.id);
          if (exists) return prev;
          return [...prev, savedMessage];
        });

        // Send message via socket for real-time updates to other users
        if (socket) {
          socket.emit('send_message', {
            projectId,
            content: content.trim(),
            type,
            messageId: savedMessage.id,
            senderId: user._id // Add sender ID to help with deduplication
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }

    // Stop typing indicator
    handleTypingStop();
  };

  const handleTypingStart = () => {
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing_start', {
        projectId,
        chatType: 'project'
      });
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  };

  const handleTypingStop = () => {
    if (isTyping && socket) {
      setIsTyping(false);
      socket.emit('typing_stop', {
        projectId,
        chatType: 'project'
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear all chat messages? This action cannot be undone.')) {
      try {
        const response = await chatService.clearProjectMessages(projectId);
        if (response.success) {
          setMessages([]);
          
          // Emit socket event to notify other users
          if (socket) {
            socket.emit('chat_cleared', {
              projectId,
              clearedBy: {
                id: user._id,
                name: user.name
              }
            });
          }
          
          toast.success('Chat cleared successfully');
        } else {
          throw new Error(response.message || 'Failed to clear chat');
        }
      } catch (error) {
        console.error('Error clearing chat:', error);
        toast.error('Failed to clear chat');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Project Chat</h3>
        </div>
        
        <div className="flex items-center space-x-3">
          {onlineUsers.length > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <UsersIcon className="h-4 w-4 mr-1" />
              <span>{onlineUsers.length} online</span>
            </div>
          )}
          
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
              title="Clear chat history"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-2">No messages yet</h4>
            <p className="text-gray-400 max-w-sm">
              Start a conversation with your team members. Messages will appear here in real-time and persist across page refreshes.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isCurrentUser={message.sender.id === user._id}
              />
            ))}
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <TypingIndicator users={typingUsers} />
            )}
            
            {/* Auto scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Online:</span>
            <div className="flex items-center space-x-1">
              {onlineUsers.slice(0, 5).map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center"
                  title={user.name}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {index < onlineUsers.length - 1 && index < 4 && (
                    <span className="text-xs text-gray-400 ml-1">,</span>
                  )}
                </div>
              ))}
              {onlineUsers.length > 5 && (
                <span className="text-xs text-gray-500">
                  +{onlineUsers.length - 5} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-gray-200">
        <ChatInput
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
};

export default Chat;