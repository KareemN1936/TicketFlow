import apiClient from "../api/apiClient";

const post = async (path, data) => (await apiClient.post(`/ai/${path}`, data)).data;

export const aiService = {
  suggestCategory: (data) => post("suggest-category", data),
  suggestPriority: (data) => post("suggest-priority", data),
  summarizeTicket: (data) => post("summarize-ticket", data),
  troubleshooting: (data) => post("troubleshooting-suggestions", data),
  chat: (message) => post("chat", { message }),
};
