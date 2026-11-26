/**
 * Frontend service untuk validasi subscription limits
 * Clean code dengan separation of concerns
 */
class SubscriptionValidationService {
    
    /**
     * Validasi apakah user bisa membuat branch baru
     * @param {Object} subscriptionData - Data subscription dari get-profile API
     * @returns {Object} - { isValid: boolean, message: string, current: number, max: number }
     */
    static validateBranchCreation(subscriptionData) {
        try {
            if (!subscriptionData || !subscriptionData.plan) {
                return {
                    isValid: false,
                    message: 'Data subscription tidak ditemukan',
                    current: 0,
                    max: 0,
                    type: 'error'
                };
            }

            const { max_branches, current_branches } = subscriptionData.plan;
            
            // Jika max_branches null atau undefined, berarti unlimited
            if (max_branches === null || max_branches === undefined) {
                return {
                    isValid: true,
                    message: 'Branches unlimited',
                    current: current_branches,
                    max: 'unlimited',
                    type: 'success'
                };
            }

            if (current_branches >= max_branches) {
                return {
                    isValid: false,
                    message: `Anda telah mencapai batas maksimal ${max_branches} outlet. Upgrade paket untuk menambah outlet.`,
                    current: current_branches,
                    max: max_branches,
                    type: 'error'
                };
            }

            // Warning jika mendekati limit (80% threshold)
            const percentage = (current_branches / max_branches) * 100;
            if (percentage >= 80) {
                return {
                    isValid: true,
                    message: `Anda dapat membuat outlet baru (${current_branches}/${max_branches}) - Mendekati batas maksimal`,
                    current: current_branches,
                    max: max_branches,
                    type: 'warning'
                };
            }

            return {
                isValid: true,
                message: `Anda dapat membuat outlet baru (${current_branches}/${max_branches})`,
                current: current_branches,
                max: max_branches,
                type: 'success'
            };

        } catch (error) {
            console.error('❌ SubscriptionValidationService.validateBranchCreation - Error:', error);
            return {
                isValid: false,
                message: 'Error validasi subscription: ' + error.message,
                current: 0,
                max: 0,
                type: 'error'
            };
        }
    }

    /**
     * Validasi apakah user bisa membuat user baru
     * @param {Object} subscriptionData - Data subscription dari get-profile API
     * @returns {Object} - { isValid: boolean, message: string, current: number, max: number }
     */
    static validateUserCreation(subscriptionData) {
        try {
            if (!subscriptionData || !subscriptionData.plan) {
                return {
                    isValid: false,
                    message: 'Data subscription tidak ditemukan',
                    current: 0,
                    max: 0,
                    type: 'error'
                };
            }

            const { max_users, current_users } = subscriptionData.plan;
            
            // Jika max_users null atau undefined, berarti unlimited
            if (max_users === null || max_users === undefined) {
                return {
                    isValid: true,
                    message: 'Users unlimited',
                    current: current_users,
                    max: 'unlimited',
                    type: 'success'
                };
            }

            if (current_users >= max_users) {
                return {
                    isValid: false,
                    message: `Anda telah mencapai batas maksimal ${max_users} user. Upgrade paket untuk menambah user.`,
                    current: current_users,
                    max: max_users,
                    type: 'error'
                };
            }

            // Warning jika mendekati limit (80% threshold)
            const percentage = (current_users / max_users) * 100;
            if (percentage >= 80) {
                return {
                    isValid: true,
                    message: `Anda dapat membuat user baru (${current_users}/${max_users}) - Mendekati batas maksimal`,
                    current: current_users,
                    max: max_users,
                    type: 'warning'
                };
            }

            return {
                isValid: true,
                message: `Anda dapat membuat user baru (${current_users}/${max_users})`,
                current: current_users,
                max: max_users,
                type: 'success'
            };

        } catch (error) {
            console.error('❌ SubscriptionValidationService.validateUserCreation - Error:', error);
            return {
                isValid: false,
                message: 'Error validasi subscription: ' + error.message,
                current: 0,
                max: 0,
                type: 'error'
            };
        }
    }

    /**
     * Validasi apakah user bisa membuat order baru (bulanan)
     * @param {Object} subscriptionData - Data subscription dari get-profile API
     * @returns {Object} - { isValid: boolean, message: string, current: number, max: number }
     */
    static validateOrderCreation(subscriptionData) {
        try {
            if (!subscriptionData || !subscriptionData.plan) {
                return {
                    isValid: false,
                    message: 'Data subscription tidak ditemukan',
                    current: 0,
                    max: 0,
                    type: 'error'
                };
            }

            const { max_orders_per_month, current_orders_this_month } = subscriptionData.plan;
            
            // Jika max_orders_per_month null atau undefined, berarti unlimited
            if (max_orders_per_month === null || max_orders_per_month === undefined) {
                return {
                    isValid: true,
                    message: 'Orders unlimited',
                    current: current_orders_this_month,
                    max: 'unlimited',
                    type: 'success'
                };
            }

            if (current_orders_this_month >= max_orders_per_month) {
                return {
                    isValid: false,
                    message: `Anda telah mencapai batas maksimal ${max_orders_per_month} order per bulan. Upgrade paket untuk menambah order.`,
                    current: current_orders_this_month,
                    max: max_orders_per_month,
                    type: 'error'
                };
            }

            // Warning jika mendekati limit (80% threshold)
            const percentage = (current_orders_this_month / max_orders_per_month) * 100;
            if (percentage >= 80) {
                return {
                    isValid: true,
                    message: `Anda dapat membuat order baru (${current_orders_this_month}/${max_orders_per_month}) - Mendekati batas maksimal`,
                    current: current_orders_this_month,
                    max: max_orders_per_month,
                    type: 'warning'
                };
            }

            return {
                isValid: true,
                message: `Anda dapat membuat order baru (${current_orders_this_month}/${max_orders_per_month})`,
                current: current_orders_this_month,
                max: max_orders_per_month,
                type: 'success'
            };

        } catch (error) {
            console.error('❌ SubscriptionValidationService.validateOrderCreation - Error:', error);
            return {
                isValid: false,
                message: 'Error validasi subscription: ' + error.message,
                current: 0,
                max: 0,
                type: 'error'
            };
        }
    }

    /**
     * Get subscription limits summary untuk dashboard
     * @param {Object} subscriptionData - Data subscription dari get-profile API
     * @returns {Object} - Summary limits dengan status
     */
    static getSubscriptionLimitsSummary(subscriptionData) {
        try {
            if (!subscriptionData || !subscriptionData.plan) {
                return {
                    hasSubscription: false,
                    limits: null,
                    warnings: []
                };
            }

            const { plan } = subscriptionData;
            const warnings = [];

            // Check if approaching limits (80% threshold)
            if (plan.max_users && plan.current_users / plan.max_users >= 0.8) {
                warnings.push({
                    type: 'users',
                    message: `User hampir mencapai batas (${plan.current_users}/${plan.max_users})`,
                    severity: plan.current_users >= plan.max_users ? 'critical' : 'warning'
                });
            }

            if (plan.max_branches && plan.current_branches / plan.max_branches >= 0.8) {
                warnings.push({
                    type: 'branches',
                    message: `Outlet hampir mencapai batas (${plan.current_branches}/${plan.max_branches})`,
                    severity: plan.current_branches >= plan.max_branches ? 'critical' : 'warning'
                });
            }

            if (plan.max_orders_per_month && plan.current_orders_this_month / plan.max_orders_per_month >= 0.8) {
                warnings.push({
                    type: 'orders',
                    message: `Order bulan ini hampir mencapai batas (${plan.current_orders_this_month}/${plan.max_orders_per_month})`,
                    severity: plan.current_orders_this_month >= plan.max_orders_per_month ? 'critical' : 'warning'
                });
            }

            return {
                hasSubscription: true,
                limits: {
                    users: {
                        current: plan.current_users,
                        max: plan.max_users,
                        percentage: plan.max_users ? (plan.current_users / plan.max_users) * 100 : 0
                    },
                    branches: {
                        current: plan.current_branches,
                        max: plan.max_branches,
                        percentage: plan.max_branches ? (plan.current_branches / plan.max_branches) * 100 : 0
                    },
                    orders: {
                        current: plan.current_orders_this_month,
                        max: plan.max_orders_per_month,
                        percentage: plan.max_orders_per_month ? (plan.current_orders_this_month / plan.max_orders_per_month) * 100 : 0
                    }
                },
                warnings
            };

        } catch (error) {
            console.error('❌ SubscriptionValidationService.getSubscriptionLimitsSummary - Error:', error);
            return {
                hasSubscription: false,
                limits: null,
                warnings: []
            };
        }
    }
}

export default SubscriptionValidationService;
