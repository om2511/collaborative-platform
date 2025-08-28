import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const ChatMessage = ({ message, isCurrentUser }) => {
  const formatTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="flex max-w-xs lg:max-w-md flex-row items-start gap-3">
        {/* Message Content */}
        <div className="flex-1 min-h-[10px] flex flex-col justify-center">
          {/* Sender name (only for other users) */}
          {!isCurrentUser && (
            <div className="text-xs text-gray-600 mb-1 font-medium">
              {message.sender.name}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`px-3 py-2 rounded-2xl min-h-[10px] flex items-center ${
              isCurrentUser
                ? 'bg-primary-600 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }`}
          >
            {message.type === 'text' ? (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            ) : message.type === 'file' ? (
              <div className="text-sm">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="underline cursor-pointer hover:opacity-80">
                    {message.content}
                  </span>
                </div>
              </div>
            ) : message.type === 'image' ? (
              <div className="text-sm">
                <img
                  src={message.content}
                  alt="Shared image"
                  className="max-w-full h-auto rounded cursor-pointer hover:opacity-90"
                  onClick={() => window.open(message.content, '_blank')}
                />
              </div>
            ) : (
              <p className="text-sm">{message.content}</p>
            )}
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-500 mt-1 text-left">
            {formatTime(message.timestamp)}
          </div>
        </div>

        {/* Avatar (always on the right) */}
        <div className="flex-shrink-0">
          {message.sender.avatar ? (
            <img
              src={message.sender.avatar}
              alt={message.sender.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {getUserInitials(message.sender.name)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;