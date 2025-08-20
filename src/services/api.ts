import axios from 'axios';

const API_URL = 'https://pratham-ai-backend.onrender.com/api';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

export interface UserData {
  username: string;
  chats: Chat[];
}

const api = {
  login: async (username: string): Promise<UserData> => {
    const response = await axios.post(`${API_URL}/login`, { username });
    return response.data;
  },
  
  getChats: async (username: string): Promise<Chat[]> => {
    const response = await axios.get(`${API_URL}/chats/${username}`);
    return response.data;
  },
  
  createChat: async (username: string, title?: string): Promise<Chat> => {
    const response = await axios.post(`${API_URL}/chats/${username}`, { title });
    return response.data;
  },
  
  sendMessage: async (username: string, chatId: string, message: string): Promise<{ userMessage: Message, aiResponse: Message }> => {
    const response = await axios.post(`${API_URL}/chats/${username}/${chatId}/messages`, { message });
    return response.data;
  },
  
  deleteChat: async (username: string, chatId: string): Promise<{ success: boolean }> => {
    const response = await axios.delete(`${API_URL}/chats/${username}/${chatId}`);
    return response.data;
  },
  
  deleteAllChats: async (username: string): Promise<{ success: boolean }> => {
    const response = await axios.delete(`${API_URL}/chats/${username}`);
    return response.data;
  },
  
  applyAction: async (username: string, chatId: string, messageId: string, action: string): Promise<{ message: Message }> => {
    const response = await axios.post(`${API_URL}/chats/${username}/${chatId}/actions`, {
      messageId,
      action
    });
    return response.data;
  }
};

export default api;