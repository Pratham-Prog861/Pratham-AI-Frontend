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
}

const Sidebar = ({
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onDeleteAllChats
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
    <div className="flex flex-col h-screen bg-gray-800 text-white w-64 p-4">
      <div className="flex items-center justify-center mb-8">
        <h1 className="text-xl font-bold">Pratham AI</h1>
      </div>

      <button
        onClick={onNewChat}
        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md mb-4 transition-colors"
      >
        <FiPlus /> New Chat
      </button>

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="text-gray-400 text-center mt-4">
            No chat history yet
          </div>
        ) : (
          <ul className="space-y-2">
            {chats.map((chat) => (
              <li key={chat.id}>
                <div
                  className={`flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-gray-700 ${currentChatId === chat.id ? 'bg-gray-700' : ''}`}
                  onClick={() => onChatSelect(chat.id)}
                >
                  <div className="truncate flex-1">
                    <div className="font-medium truncate">{chat.title}</div>
                    <div className="text-xs text-gray-400">{formatDate(chat.createdAt)}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="Delete chat"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <UserAvatar 
              username={username || 'User'} 
              size={36}
              className="flex-shrink-0"
            />
            <div className="text-sm font-medium">
              {username || 'User'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 p-1"
            title="Logout"
          >
            <FiLogOut size={18} />
          </button>
        </div>

        {confirmDelete ? (
          <div className="text-center">
            <p className="text-sm mb-2">Delete all chats?</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onDeleteAllChats();
                  setConfirmDelete(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded-md text-sm"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-1 px-2 rounded-md text-sm"
              >
                No
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
          >
            <FiTrash2 /> Delete All Chats
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;