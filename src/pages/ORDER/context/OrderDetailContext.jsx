import React, { createContext, useContext, useReducer, useMemo } from 'react';

// Initial state template FE
const initialState = {
  // Order data
  id: null,
  customer: null,
  branch_id: 1,
  tenant_id: null, // Tambahkan tenant_id
  shift_id: null, // ✅ Add shift_id
  entry_date: new Date().toISOString().split('T')[0],
  quantity: 0,
  order_type: 'offline',
  
  // Order details (grouped by treatment)
  order_details: [],
  
  // Payment data
  payment: {
    id: null,
    code: '',
    status: 'unpaid',
    method: '',
    total_discount: 0,
    final_price: 0,
    subtotal: 0,
    total_service: 0,
    paid_amount: 0,
    remaining_amount: 0,
    additional_cost: 0,
    due_date: null,
    notes: '',
    discount_id: null, // Payment-level discount ID
    discount: null, // Payment-level discount object
    points_discount: 0, // Points discount
    membership_discount: 0, // Membership discount
    points_to_redeem: 0, // Points to redeem for discount
    payment_details: [], // Payment history
    total_price: 0,
    total_process_time_cost: 0,
    date: null,
    money: 0,
    change: 0,
    evidence_photo: ''
  },
  
  // Referral data
  referred_by: null, // Referral customer ID
  referred_by_phone: null, // Referral phone number
  referrer: null, // Referral customer object
  
  // UI state
  loading: false,
  error: null,
  currentStep: 1
};

// Action types
const ACTIONS = {
  SET_ORDER_DATA: 'SET_ORDER_DATA',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  ADD_ORDER_DETAIL: 'ADD_ORDER_DETAIL',
  UPDATE_ORDER_DETAIL: 'UPDATE_ORDER_DETAIL',
  REMOVE_ORDER_DETAIL: 'REMOVE_ORDER_DETAIL',
  UPDATE_PAYMENT: 'UPDATE_PAYMENT',
  ADD_PAYMENT_DETAIL: 'ADD_PAYMENT_DETAIL',
  REMOVE_PAYMENT_DETAIL: 'REMOVE_PAYMENT_DETAIL',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  RESET_STATE: 'RESET_STATE',
  UPDATE_FIELD: 'UPDATE_FIELD' // Added UPDATE_FIELD action
};

// Reducer
const orderDetailReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_ORDER_DATA:
      return {
        ...state,
        ...action.payload
      };
      
    case ACTIONS.UPDATE_CUSTOMER:
      return {
        ...state,
        customer: action.payload
      };
      
    case ACTIONS.ADD_ORDER_DETAIL:
      return {
        ...state,
        order_details: [...state.order_details, action.payload],
        quantity: state.order_details.length + 1
      };
      
    case ACTIONS.UPDATE_ORDER_DETAIL:
      return {
        ...state,
        order_details: state.order_details.map((detail, index) => 
          index === action.payload.index ? action.payload.data : detail
        )
      };
      
    case ACTIONS.REMOVE_ORDER_DETAIL:
      return {
        ...state,
        order_details: state.order_details.filter((_, index) => index !== action.payload),
        quantity: state.order_details.length - 1
      };
      
    case ACTIONS.UPDATE_PAYMENT:
      return {
        ...state,
        payment: {
          ...state.payment,
          ...action.payload
        }
      };
      
    case ACTIONS.ADD_PAYMENT_DETAIL:
      return {
        ...state,
        payment: {
          ...state.payment,
          payment_details: [...state.payment.payment_details, action.payload]
        }
      };
      
    case ACTIONS.REMOVE_PAYMENT_DETAIL:
      return {
        ...state,
        payment: {
          ...state.payment,
          payment_details: state.payment.payment_details.filter((_, index) => index !== action.payload)
        }
      };
      
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
      
    case ACTIONS.SET_CURRENT_STEP:
      return {
        ...state,
        currentStep: action.payload
      };
      
    case ACTIONS.RESET_STATE:
      return initialState;

    case ACTIONS.UPDATE_FIELD:
      return {
        ...state,
        [action.payload.field]: action.payload.value
      };
      
    default:
      return state;
  }
};

// Create context
const OrderDetailContext = createContext();

// Provider component
export const OrderDetailProvider = ({ children }) => {
  const [state, dispatch] = useReducer(orderDetailReducer, initialState);

  // Memoized actions to prevent infinite loops
  const actions = useMemo(() => ({
    setOrderData: (data) => dispatch({ type: ACTIONS.SET_ORDER_DATA, payload: data }),
    updateCustomer: (customer) => dispatch({ type: ACTIONS.UPDATE_CUSTOMER, payload: customer }),
    addOrderDetail: (detail) => dispatch({ type: ACTIONS.ADD_ORDER_DETAIL, payload: detail }),
    updateOrderDetail: (index, data) => dispatch({ type: ACTIONS.UPDATE_ORDER_DETAIL, payload: { index, data } }),
    removeOrderDetail: (index) => dispatch({ type: ACTIONS.REMOVE_ORDER_DETAIL, payload: index }),
    updatePayment: (payment) => dispatch({ type: ACTIONS.UPDATE_PAYMENT, payload: payment }),
    addPaymentDetail: (detail) => dispatch({ type: ACTIONS.ADD_PAYMENT_DETAIL, payload: detail }),
    removePaymentDetail: (index) => dispatch({ type: ACTIONS.REMOVE_PAYMENT_DETAIL, payload: index }),
    setLoading: (loading) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error }),
    setCurrentStep: (step) => dispatch({ type: ACTIONS.SET_CURRENT_STEP, payload: step }),
    resetState: () => dispatch({ type: ACTIONS.RESET_STATE }),
    updateField: (field, value) => dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { field, value } }),
  }), [dispatch]);

  // Memoized values
  const value = useMemo(() => ({
    state,
    dispatch,
    actions
  }), [state, actions]);

  return (
    <OrderDetailContext.Provider value={value}>
      {children}
    </OrderDetailContext.Provider>
  );
};

// Custom hook
export const useOrderDetail = () => {
  const context = useContext(OrderDetailContext);
  if (!context) {
    throw new Error('useOrderDetail must be used within OrderDetailProvider');
  }
  return context;
}; 