import React from 'react';

const TypingIndicator = ({ users }) => {
  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].userName} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].userName} and ${users[1].userName} are typing...`;
    } else {
      return `${users[0].userName} and ${users.length - 1} others are typing...`;
    }
  };

  if (users.length === 0) return null;

  return (
    <div className="flex items-center space-x-3 mb-4">
      {/* Avatars */}
      <div className="flex items-center space-x-1">
        {users.slice(0, 3).map((user, index) => (
          <div
            key={user.userId}
            className="h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center"
            style={{ marginLeft: index > 0 ? '-8px' : '0' }}
          >
            <span className="text-xs font-medium text-white">
              {getUserInitials(user.userName)}
            </span>
          </div>
        ))}
      </div>

      {/* Typing indicator */}
      <div className="flex items-center space-x-1">
        <span className="text-sm text-gray-500">{getTypingText()}</span>
        
        {/* Animated dots */}
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;