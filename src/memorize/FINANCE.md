jaid aku pingin tambahkan fitur finance di aplikasi ini, 
jadi di floating button beranda kasir, itu ada menu finance, isinya seperti diabawah ini

paling atas itu ada pilihan calendar harian, mingguan atau bulanan, intinya klo harian yang pilih tanggal, klo mingguan pilih minggu ke brp, klo bulanan pilih bulannya

lalu dibawahnya terpdaat statistic
Card ringkasan: Income hari ini, Expense hari ini, Profit hari ini

lalu ada 3 tab, list payment details, & list pengeluaran
terus ada list payment details sesuai filter, dan diurutkan dari yang terbaru
bisa di klik order detailnya, berdasarkan payment details tersebut
jika di tab pengeluaran, ya munculin list pengeluaran

Floating action button untuk tambah expense
Modal/form untuk input expense baru

---

# Frontend Finance Dashboard - Implementation Guide

## 🎯 Overview
Finance dashboard untuk tracking income, expense, dan profit harian dengan source tracking (order mana, expense apa).

## 📱 Mobile-First Design Requirements

### 1. **Header Section**
- **Period Selector**: Dropdown/picker untuk pilih periode
  - Daily: Date picker
  - Weekly: Week picker (minggu ke-X)
  - Monthly: Month picker
- **Current Period Display**: Tampilkan periode yang dipilih

### 2. **Statistics Cards**
- **Income Card**: 
  - Icon: 💰 atau 📈
  - Amount: `total_income` dari API
  - Color: Green (#10B981)
- **Expense Card**:
  - Icon: 💸 atau 📉  
  - Amount: `total_expense` dari API
  - Color: Red (#EF4444)
- **Profit Card**:
  - Icon: 💎 atau 📊
  - Amount: `profit` dari API
  - Percentage: `profit_percentage` dari API
  - Color: Blue (#3B82F6) jika profit, Red jika loss

### 3. **Transaction Tabs**
- **Tab 1**: "All Transactions" (default)
- **Tab 2**: "Income Only" 
- **Tab 3**: "Expense Only"

### 4. **Transaction List**
- **Card Layout**: Setiap transaksi dalam card
- **Transaction Info**:
  - Amount (besar, bold)
  - Date & Time
  - Category name
  - Account name
  - Description

#### **Income Transaction Card**:
```jsx
{
  type: "income",
  amount: 500000,
  source: {
    order_id: 123,
    customer_name: "John Doe",
    order_type: "reparasi",
    payment_method: "cash"
  }
}
```

#### **Expense Transaction Card**:
```jsx
{
  type: "expense", 
  amount: 100000,
  source: {
    expense_name: "Bayar Listrik",
    payment_method: "bank_transfer"
  }
}
```

### 5. **Transaction Detail Modal**
- **Income Detail**: Show order info, customer info, payment method
- **Expense Detail**: Show expense name, description, payment method
- **Action Buttons**: Close, Edit (if applicable)

### 6. **Floating Action Button (FAB)**
- **Icon**: ➕
- **Action**: Open "Add Expense" modal
- **Position**: Bottom right, fixed

### 7. **Add Expense Modal**
- **Form Fields**:
  - Name (required)
  - Amount (required, numeric)
  - Date (default: today)
  - Category (dropdown)
  - Account (dropdown)
  - Payment Method (dropdown: cash/bank/qris)
  - Description (optional)
- **Buttons**: Cancel, Save

## 🔌 API Integration

### 1. **Get Daily Summary**
```javascript
GET /api/finance/daily-summary?date=2025-01-15&period=daily

Response:
{
  "success": true,
  "data": {
    "period": "daily",
    "date": "2025-01-15",
    "total_income": 2500000,
    "total_expense": 800000,
    "profit": 1700000,
    "profit_percentage": 68,
    "transaction_count": {
      "income": 5,
      "expense": 3
    }
  }
}
```

### 2. **Get Daily Transactions**
```javascript
GET /api/finance/daily-transactions?date=2025-01-15&type=all&period=daily

Response:
{
  "success": true,
  "data": {
    "period": "daily",
    "date": "2025-01-15",
    "transactions": [
      {
        "id": 1,
        "type": "income",
        "amount": 500000,
        "date": "2025-01-15T10:30:00Z",
        "description": "Pembayaran order #123",
        "category_name": "Pendapatan Order",
        "account_name": "Cash",
        "source": {
          "order_id": 123,
          "customer_name": "John Doe",
          "order_type": "reparasi",
          "payment_method": "cash"
        }
      }
    ]
  }
}
```

### 3. **Get Transaction Detail**
```javascript
GET /api/finance/transaction/1/detail

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "type": "income",
    "amount": 500000,
    "date": "2025-01-15T10:30:00Z",
    "description": "Pembayaran order #123",
    "category_name": "Pendapatan Order",
    "account_name": "Cash",
    "source": {
      "order_id": 123,
      "customer_name": "John Doe",
      "customer_phone": "08123456789",
      "order_type": "reparasi",
      "payment_method": "cash",
      "entry_date": "2025-01-15",
      "payment": {
        "id": 1,
        "final_price": 500000,
        "status": "paid"
      }
    }
  }
}
```

### 4. **Get Periods (Calendar Data)**
```javascript
GET /api/finance/periods

Response:
{
  "success": true,
  "data": {
    "daily": [
      {
        "date": "2025-01-15",
        "label": "15 Jan 2025"
      }
    ],
    "weekly": [
      {
        "week": 1,
        "start_date": "2025-01-13",
        "end_date": "2025-01-19",
        "label": "13 Jan - 19 Jan 2025"
      }
    ],
    "monthly": [
      {
        "month": "2025-01",
        "name": "Januari 2025"
      }
    ]
  }
}
```

## 🎨 UI/UX Guidelines

### **Color Scheme**
- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981) 
- **Danger**: Red (#EF4444)
- **Warning**: Yellow (#F59E0B)
- **Gray**: Gray (#6B7280)

### **Typography**
pake font bebas atau monsterat liat di file lain yang sama

### **Spacing**
sesuaikan dengan tampilan yang lain di file2 lain

### **Icons**
- **Income**: 💰📈
- **Expense**: 💸📉
- **Profit**: 💎📊
- **Add**: ➕
- **Calendar**: 📅
- **Filter**: 🔍

## 📱 Mobile Considerations

### **Responsive Design**
- **Cards**: Full width on mobile
- **Tabs**: Scrollable horizontal tabs
- **Modal**: Full screen on mobile
- **FAB**: Always visible, not covered by keyboard

### **Touch Interactions**
- **Tap**: Open transaction detail
- **Swipe**: Between tabs (optional)
- **Pull to Refresh**: Refresh data
- **Long Press**: Context menu (optional)

### **Performance**
- **Lazy Loading**: Load transactions on scroll
- **Caching**: Cache periods data
- **Loading States**: Skeleton screens
- **Error Handling**: Retry buttons

## 🔄 State Management

### **Required States**
```javascript
const [selectedPeriod, setSelectedPeriod] = useState('daily');
const [selectedDate, setSelectedDate] = useState(today);
const [activeTab, setActiveTab] = useState('all');
const [summary, setSummary] = useState(null);
const [transactions, setTransactions] = useState([]);
const [loading, setLoading] = useState(false);
const [showExpenseModal, setShowExpenseModal] = useState(false);
const [showDetailModal, setShowDetailModal] = useState(false);
const [selectedTransaction, setSelectedTransaction] = useState(null);
```

### **Data Flow**
1. **Load Periods** → Populate period selector
2. **Load Summary** → Update statistics cards
3. **Load Transactions** → Update transaction list
4. **Filter by Tab** → Filter transactions by type
5. **Select Transaction** → Load detail modal

## 🚀 Implementation Steps

### **Phase 1: Basic Layout**
1. Create header with period selector
2. Create statistics cards
3. Create tab navigation
4. Create transaction list skeleton

### **Phase 2: API Integration**
1. Integrate daily summary API
2. Integrate daily transactions API
3. Add loading states
4. Add error handling

### **Phase 3: Interactions**
1. Add transaction detail modal
2. Add expense creation modal
3. Add period filtering
4. Add tab filtering

### **Phase 4: Polish**
1. Add animations
2. Add pull-to-refresh
3. Add offline handling
4. Add performance optimizations

## 📋 Testing Checklist

- [ ] Period selector works correctly
- [ ] Statistics cards show correct data
- [ ] Tab filtering works
- [ ] Transaction list loads and displays correctly
- [ ] Transaction detail modal shows correct info
- [ ] Add expense modal works
- [ ] Mobile responsive design
- [ ] Loading states work
- [ ] Error handling works
- [ ] Performance is good on mobile

## 🎯 Success Metrics

- **Load Time**: < 2 seconds on mobile
- **User Engagement**: Users check finance dashboard daily
- **Data Accuracy**: 100% match with backend data
- **Mobile Usability**: Easy to use on small screens
