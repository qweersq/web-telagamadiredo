import axiosInstance from '../config/api';

const appVersionService = {
  getAllVersions: async (platform = null) => {
    try {
      const params = platform ? { platform } : {};
      const response = await axiosInstance.get('/app-versions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching app versions:', error);
      throw error;
    }
  },

  getVersionById: async (id) => {
    try {
      const response = await axiosInstance.get(`/app-versions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching app version:', error);
      throw error;
    }
  },

  createVersion: async (versionData) => {
    try {
      const response = await axiosInstance.post('/app-versions', versionData);
      return response.data;
    } catch (error) {
      console.error('Error creating app version:', error);
      throw error;
    }
  },

  updateVersion: async (id, versionData) => {
    try {
      const response = await axiosInstance.put(`/app-versions/${id}`, versionData);
      return response.data;
    } catch (error) {
      console.error('Error updating app version:', error);
      throw error;
    }
  },

  deleteVersion: async (id) => {
    try {
      const response = await axiosInstance.delete(`/app-versions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting app version:', error);
      throw error;
    }
  },

  checkVersion: async (platform, currentVersion) => {
    try {
      const response = await axiosInstance.get('/app-versions/check', {
        params: { platform, version: currentVersion }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking app version:', error);
      throw error;
    }
  }
};

export default appVersionService;

