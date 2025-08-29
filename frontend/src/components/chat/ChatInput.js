import React, { useState, useRef } from 'react';
import {
  PaperAirplaneIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import Button from '../common/Button';

const ChatInput = ({ 
  onSendMessage, 
  onTypingStart, 
  onTypingStop, 
  placeholder = "Type a message..." 
}) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // Handle typing indicators
    if (value.trim()) {
      onTypingStart?.();
    } else {
      onTypingStop?.();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    
    try {
      // In a real app, you would upload to your backend/cloud storage
      // For demo purposes, we'll just create a file message
      const fileMessage = `📎 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
      onSendMessage(fileMessage, 'file');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  return (
    <form onSubmit={handleSubmit} className="p-6 relative">
      <div className="flex items-center space-x-4">
        {/* File upload button */}
        <div className="flex-shrink-0 flex items-center">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-3 h-12 w-12 flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70 shadow-sm transition-all duration-200"
            title="Attach file"
          >
            <PaperClipIcon className="h-5 w-5 text-gray-600" />
          </Button>
        </div>

        {/* Message input */}
        <div className="flex-1 relative flex items-center">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onBlur={onTypingStop}
            placeholder={placeholder}
            className="w-full px-6 py-4 bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 resize-none min-h-[48px] max-h-32 shadow-sm transition-all duration-200 hover:bg-white/60 placeholder-gray-500"
            rows={1}
            disabled={isUploading}
          />
        </div>

        {/* Send button */}
        <div className="flex-shrink-0 flex items-center">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!message.trim() || isUploading}
            className="p-3 h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-0 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
            title="Send message"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <PaperAirplaneIcon className="h-5 w-5 text-white" />
            )}
          </Button>
        </div>
      </div>

      {/* File upload progress */}
      {isUploading && (
        <div className="mt-4 p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 shadow-sm">
          <div className="text-sm text-gray-600 font-medium mb-2 flex items-center">
            <PaperClipIcon className="h-4 w-4 mr-2 text-blue-600" />
            Uploading file...
          </div>
          <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full animate-pulse w-1/2 shadow-sm"></div>
          </div>
        </div>
      )}
    </form>
  );
};

export default ChatInput;