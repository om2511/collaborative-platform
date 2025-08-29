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
    <div className="flex items-center space-x-4 mb-6">
      {/* Avatars */}
      <div className="flex items-center space-x-1">
        {users.slice(0, 3).map((user, index) => (
          <div
            key={user.userId}
            className="h-8 w-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center border-2 border-white shadow-lg"
            style={{ marginLeft: index > 0 ? '-12px' : '0', zIndex: 3 - index }}
            title={user.userName}
          >
            <span className="text-xs font-bold text-white">
              {getUserInitials(user.userName)}
            </span>
          </div>
        ))}
      </div>

      {/* Typing indicator */}
      <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/30 shadow-sm">
        <span className="text-sm text-gray-700 font-medium">{getTypingText()}</span>
        
        {/* Animated dots */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce shadow-sm"></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;