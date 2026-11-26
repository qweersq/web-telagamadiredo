# SubscriptionLimitsCard - Dynamic Usage

## Overview
Component yang dinamis untuk menampilkan subscription limits berdasarkan halaman yang sedang dibuka.

## Usage

### 1. Branch Management Page
```jsx
import { SubscriptionLimitsCard } from '../../components/SubscriptionLimits';

// Di BranchManagement.jsx
<SubscriptionLimitsCard 
  subscriptionData={subscriptionData}
  onUpgrade={handleValidationUpgrade}
  type="branches"  // ✅ Menampilkan data outlet
/>
```

### 2. User Management Page
```jsx
import { SubscriptionLimitsCard } from '../../components/SubscriptionLimits';

// Di UserManagement.jsx
<SubscriptionLimitsCard 
  subscriptionData={subscriptionData}
  onUpgrade={handleValidationUpgrade}
  type="users"     // ✅ Menampilkan data user
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `subscriptionData` | Object | - | Data subscription dari get-profile API |
| `onUpgrade` | Function | - | Handler untuk upgrade button |
| `type` | String | 'branches' | Type limit yang ditampilkan ('branches' atau 'users') |

## Features

### ✅ Dynamic Content
- **Branches**: Menampilkan limit outlet dengan icon 🏪
- **Users**: Menampilkan limit user dengan icon 👥

### ✅ Simple Design
- **No Progress Bar**: Clean design tanpa progress bar
- **No Percentage**: Tidak menampilkan persentase
- **Simple Text**: "2 dari 10 outlet" atau "5 dari 100 user"

### ✅ Smart Warnings
- **80% Threshold**: Warning saat mendekati limit
- **100% Limit**: Error saat mencapai limit
- **Dynamic Messages**: Pesan berubah berdasarkan type

### ✅ Status Indicators
- **Normal**: Green color, "Normal" status
- **Warning**: Yellow color, "Mendekati limit" status  
- **Error**: Red color, "Limit tercapai" status

## Examples

### Branch Management
```
🏪 Limit Outlet          Normal
2 dari 10 outlet         2/10
```

### User Management  
```
👥 Limit User            Normal
5 dari 100 user          5/100
```

### Warning State
```
🏪 Limit Outlet          Mendekati limit
8 dari 10 outlet         8/10
⚠️ Anda hampir mencapai batas maksimal 10 outlet
```

### Error State
```
🏪 Limit Outlet          Limit tercapai
10 dari 10 outlet        10/10
⚠️ Anda telah mencapai batas maksimal 10 outlet
[Upgrade Paket]
```
