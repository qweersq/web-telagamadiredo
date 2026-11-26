import instance from '../config/api';
import { getUserProfile } from '../utils/userProfileHelper';

// Helper function untuk mendapatkan userData dari API
async function getUserData() {
  try {
    const profile = await getUserProfile();
    if (!profile) return null;
    
    return {
      id: profile.user?.id,
      name: profile.user?.name,
      email: profile.user?.email,
      role: profile.user?.role,
      branch_id: profile.branch?.id,
      branch_name: profile.branch?.name,
      tenant_id: profile.tenant?.id,
      tenant_name: profile.tenant?.business_name
    };
  } catch (error) {
    console.error('[ERROR] branchService - Failed to get userData from API:', error);
    return null;
  }
}

// Branch Service
export const branchService = {
  // Get all branches for current user's tenant
  async getBranches() {
    try {
      const userData = await getUserData();
      if (!userData) {
        throw new Error('User data not found');
      }

      const userRole = userData.role || userData.user_role;
      const userTenantId = userData.tenant_id;

      let response;
      
      if (userRole === 'superapp-superadmin') {
        // Super App Super Admin bisa lihat semua branches
        response = await instance.get('/branches');
      } else {
        // Role lain hanya bisa lihat branches dalam tenant-nya
        response = await instance.get(`/tenants/${userTenantId}/branches`);
      }

      return response.data;
    } catch (error) {
      console.error('[ERROR] Failed to get branches:', error);
      throw error;
    }
  },

  // Get branches by specific tenant (for superapp-superadmin)
  async getBranchesByTenant(tenantId) {
    try {
      const response = await instance.get(`/tenants/${tenantId}/branches`);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Failed to get branches by tenant:', error);
      throw error;
    }
  },

  // Get branch by ID
  async getBranchById(branchId) {
    try {
      const response = await instance.get(`/branches/${branchId}`);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Failed to get branch by ID:', error);
      throw error;
    }
  },

  // Create new branch
  async createBranch(branchData) {
    try {
      const response = await instance.post('/branches', branchData);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Failed to create branch:', error);
      throw error;
    }
  },

  // Update branch
  async updateBranch(branchId, branchData) {
    try {
      const response = await instance.put(`/branches/${branchId}`, branchData);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Failed to update branch:', error);
      throw error;
    }
  },

  // Delete branch (soft delete - set status to closed)
  async deleteBranch(branchId) {
    try {
      const response = await instance.put(`/branches/${branchId}`, { status: 'closed' });
      return response.data;
    } catch (error) {
      console.error('[ERROR] Failed to delete branch:', error);
      throw error;
    }
  },

  // Reactivate branch (set status to active)
  async reactivateBranch(branchId) {
    try {
      const response = await instance.put(`/branches/${branchId}`, { status: 'active' });
      return response.data;
    } catch (error) {
      console.error('[ERROR] Failed to reactivate branch:', error);
      throw error;
    }
  }
};

export default branchService;
