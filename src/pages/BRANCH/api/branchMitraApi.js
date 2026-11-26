import instance from '../../../config/api';

// Create mitra relation
export const createMitraRelation = async (parentBranchId, mitraBranchId) => {
    try {
        const response = await instance.post('/branch-mitra', {
            parent_branch_id: parentBranchId,
            mitra_branch_id: mitraBranchId
        });
        return response.data.data;
    } catch (error) {
        console.error('Error creating mitra relation:', error);
        throw error;
    }
};

// Get mitras by parent branch
export const getMitrasByParent = async (parentBranchId) => {
    try {
        const response = await instance.get(`/branch-mitra/parent/${parentBranchId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error getting mitras:', error);
        throw error;
    }
};

// Get parent by mitra branch
export const getParentByMitra = async (mitraBranchId) => {
    try {
        const response = await instance.get(`/branch-mitra/mitra/${mitraBranchId}/parent`);
        return response.data.data;
    } catch (error) {
        console.error('Error getting parent:', error);
        throw error;
    }
};

// Delete mitra relation
export const deleteMitraRelation = async (relationId) => {
    try {
        const response = await instance.delete(`/branch-mitra/${relationId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting mitra relation:', error);
        throw error;
    }
};
