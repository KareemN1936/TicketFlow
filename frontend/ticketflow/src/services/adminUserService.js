import apiClient from "../api/apiClient";

export const adminUserService = {
  async getUsers() {
    return (await apiClient.get("/users")).data;
  },
  async getRoles() {
    return (await apiClient.get("/users/roles")).data;
  },
  async createUser(payload) {
    return (await apiClient.post("/users", payload)).data;
  },
  async updateRole(userId, role) {
    return (await apiClient.put(`/users/${userId}/role`, { role })).data;
  },
  async deleteUser(userId) {
    await apiClient.delete(`/users/${userId}`);
  },
};
