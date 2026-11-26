import instance from '../config/api';

class EmployeeDetailApi {
    /**
     * Get employee summary data
     * @param {number} employeeId - Employee ID
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Object>} Employee summary data
     */
    static async getEmployeeSummary(employeeId, startDate, endDate) {
        try {
            const { data } = await instance.get(`/employee-detail/${employeeId}/summary`, {
                params: { 
                    start_date: startDate,
                    end_date: endDate
                }
            });
            return data;
        } catch (error) {
            console.error('Error fetching employee summary:', error);
            throw error;
        }
    }
}

export default EmployeeDetailApi;
