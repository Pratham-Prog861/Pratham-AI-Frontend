import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiTrash2, FiPlus } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import type { Chat } from '../services/api';
import UserAvatar from './UserAvatar';

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onDeleteAllChats: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Sidebar = ({
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onDeleteAllChats,
  onToggleSidebar,
  isSidebarOpen
}: SidebarProps) => {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-white w-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-lg sm:text-xl font-bold">Pratham AI</h1>
        {/* Updated mobile menu button */}
        <button 
          onClick={onToggleSidebar}
          className="sm:hidden text-gray-400 hover:text-white p-2 rounded-md hover:bg-gray-700"
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {isSidebarOpen ? (
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 
            text-white py-2.5 px-4 rounded-lg transition-colors text-sm sm:text-base"
        >
          <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" /> New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3">
        {chats.length === 0 ? (
          <div className="text-gray-400 text-center mt-4 text-sm sm:text-base">
            No chat history yet
          </div>
        ) : (
          <ul className="space-y-1">
            {chats.map((chat) => (
              <li key={chat.id}>
                <div
                  className={`flex justify-between items-center p-2.5 rounded-lg cursor-pointer 
                    hover:bg-gray-700 ${currentChatId === chat.id ? 'bg-gray-700' : ''}`}
                  onClick={() => onChatSelect(chat.id)}
                >
                  <div className="truncate flex-1 min-w-0">
                    <div className="font-medium truncate text-sm sm:text-base">{chat.title}</div>
                    <div className="text-xs text-gray-400">{formatDate(chat.createdAt)}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="text-gray-400 hover:text-red-500 p-1.5 ml-2"
                    title="Delete chat"
                  >
                    <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* User Profile and Actions */}
      <div className="mt-auto border-t border-gray-700 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar 
              username={username || 'User'} 
              size={32}
              className="flex-shrink-0"
            />
            <div className="truncate text-sm sm:text-base">
              {username || 'User'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 p-1.5"
            title="Logout"
          >
            <FiLogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {confirmDelete ? (
          <div className="text-center space-y-2">
            <p className="text-sm">Delete all chats?</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onDeleteAllChats();
                  setConfirmDelete(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm"
              >
                Yes, delete all
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-md text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 
              text-white py-2 px-4 rounded-lg transition-colors text-sm sm:text-base"
          >
            <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" /> Delete All Chats
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;