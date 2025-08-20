import axios, { AxiosError } from 'axios';

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

interface LoginResponse {
  username: string;
  chats: Chat[];
}

interface MessageResponse {
  userMessage: Message;
  aiResponse: Message;
  chatTitle?: string; // Add this field
}

const api = {
  login: async (username: string): Promise<LoginResponse> => {
    try {
      const response = await axios.post(`${API_URL}/login`, { 
        username: username.trim()
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
      }
      throw error;
    }
  },

  createChat: async (username: string): Promise<Chat> => {
    try {
      const response = await axios.post(`${API_URL}/chats/${username}`, {
        title: 'New Chat'
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 500) {
          throw new Error('Failed to create chat. Please try again.');
        }
      }
      throw error;
    }
  },

  getChats: async (username: string): Promise<Chat[]> => {
    const response = await axios.get(`${API_URL}/chats/${username}`);
    return response.data;
  },

  sendMessage: async (
    username: string,
    chatId: string,
    content: string
  ): Promise<MessageResponse> => {
    try {
      const response = await axios.post(
        `${API_URL}/chats/${username}/${chatId}/messages`,
        { content: content.trim() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Invalid message request';
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  deleteChat: async (username: string, chatId: string): Promise<void> => {
    await axios.delete(`${API_URL}/chats/${username}/${chatId}`);
  },

  deleteAllChats: async (username: string): Promise<void> => {
    await axios.delete(`${API_URL}/chats/${username}`);
  },

  applyAction: async (
    username: string, 
    chatId: string, 
    messageId: string, 
    action: string
  ): Promise<{ message: Message }> => {
    const response = await axios.post(
      `${API_URL}/chats/${username}/${chatId}/actions`,
      { messageId, action }
    );
    return response.data;
  }
};

export default api;