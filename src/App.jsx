import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ShiftProvider } from './contexts/ShiftContext';
import VersionUpdateBanner from './components/VersionUpdateBanner';
import VersionUpdateModal from './components/VersionUpdateModal';
import LoginKaryawan from './pages/PERTAMA/LoginKaryawan';
import ForgotPassword from './pages/PERTAMA/ForgotPassword';
import ResetPassword from './pages/PERTAMA/ResetPassword';

// Wrapper component untuk routes yang membutuhkan ShiftProvider
const ShiftProviderWrapper = ({ children }) => (
  <ShiftProvider>
    {children}
  </ShiftProvider>
);
import LoginSuccess from './pages/PERTAMA/LoginSuccess';
import BerandaTeknisi from './pages/BERANDA/BerandaTeknisi';
import Antrian from './pages/BERANDA/Antrian';
import AntrianV2 from './pages/ANTRIAN/AntrianV2';
import KurirTransport from './pages/ABSEN/KurirTransport';
import BerandaKurir from './pages/BERANDA/BerandaKurir';
import BerandaKasir from './pages/BERANDA/BerandaKasir';
import CalendarDashboard from './pages/CALENDAR/CalendarDashboard';
import BerandaQC from './pages/BERANDA/BerandaQC';
import BerandaDapur from './pages/BERANDA/BerandaDapur';
import RiwayatQC from './pages/BERANDA/RiwayatQC/RiwayatQC';
import PengaturanAdmin from './pages/BERANDA/PengaturanAdmin';
import AdminNotes from './pages/NOTES/AdminNotes';
import AdminNoteForm from './pages/NOTES/AdminNoteForm';
import PilihRole from './pages/PERTAMA/PilihRole';
import CekGaji from './pages/ANALISIS/CekGaji';
import KontrolKerja from './pages/ANALISIS/KontrolKerja';
import AntrianKasir from './pages/BERANDA/AntrianKasir';
import AntrianKurir from './pages/BERANDA/AntrianKurir';
import IzinSuccess from './pages/PERTAMA/IzinSuccess';
import OrderDetail from './pages/ORDER/OrderDetail';
import OrderDashboard from './pages/ORDER/OrderDashboard';
import QuickOrder from './pages/ORDER/QuickOrder';
import RoleRedirect from './utils/RoleRedirect';
import { BERANDA_ACCESS } from './utils/roleValidator';
import SubscriptionPlanGuard from './utils/SubscriptionPlanGuard';
import Invoice from './pages/ORDER/Invoice';
import InvoiceDigital from './pages/INVOICE/InvoiceDigital';
import FinanceDashboard from './pages/FINANCE/FinanceDashboard';
import FinanceManagement from './pages/FINANCE/FinanceManagement';
import FinanceAccounts from './pages/FINANCE/FinanceAccounts';
import FinanceCategories from './pages/FINANCE/FinanceCategories';
import FinanceTransactions from './pages/FINANCE/FinanceTransactions';
import FinanceReports from './pages/FINANCE/FinanceReports';
import FinanceReport from './pages/FINANCE/FinanceReport';
import OperationalReport from './pages/OPERASIONAL/OperationalReport';
import LaporanKinerja from './pages/LAPORAN/LaporanKinerja';
import ShiftManagementOwner from './pages/BERANDA/SHIFT/ShiftManagement';
import BerandaOwner from './pages/BERANDA/BerandaOwner';
import BerandaSupervisor from './pages/BERANDA/BerandaSupervisor';
import TugasHarian from './pages/BERANDA/TugasHarian';
import MonitorAbsensi from './pages/ATTENDANCE/MonitorAbsensi';
import BerandaStaff from './pages/BERANDA/BerandaStaff';
import BugReportPage from './pages/BUG_REPORT/BugReportPage';
import Feedback from './pages/Feedback';
import BugReport from './pages/BugReport';
import ProfilePage from './pages/PROFILE/ProfilePage';
import SuperAppFeedbackManagement from './pages/SUPERAPP/SuperAppFeedbackManagement';
import SuperAppBugReportsManagement from './pages/SUPERAPP/SuperAppBugReportsManagement';
import SuperAppExpenseManagement from './pages/SUPERAPP/SuperAppExpenseManagement';
import SuperAppVersionManagement from './pages/SUPERAPP/SuperAppVersionManagement';
import BranchManagement from './pages/BRANCH/BranchManagement';
import StockManagement from './pages/STOCK/StockManagement';
import BillingManagement from './pages/BILLING/BillingManagement';
import BillingTenantManajemen from './pages/BILLING/BillingTenantManajemen';
import AnalisisKaryawan from './pages/ANALISIS/AnalisisKaryawan';
import EmployeeDetail from './pages/ANALISIS/EmployeeDetail';
import PengaturanSistem from './pages/PENGATURAN/PengaturanSistem';
import PrinterSettings from './pages/PENGATURAN/PrinterSettings';
import InvoiceDigitalSettings from './pages/PENGATURAN/InvoiceDigitalSettings';
import PointsSettings from './pages/PENGATURAN/PointsSettings';
import WaSetup from './pages/WA_SETUP/WaSetup';
import ManajemenKaryawan from './pages/MANAJEMEN_KARYAWAN/ManajemenKaryawan';
import WorkSchedulePage from './pages/MANAJEMEN_KARYAWAN/WorkSchedulePage';
import AbsensiKaryawan from './pages/MANAJEMEN_KARYAWAN/AbsensiKaryawan';
import TreatmentManagement from './pages/TREATMENT/TreatmentManagement';
import DiscountManagement from './pages/DISCOUNT/DiscountManagement';
import ProductCategoryManagement from './pages/PRODUCT_CATEGORY/ProductCategoryManagement';
import ItemManagement from './pages/ITEM/ItemManagement';
import CustomerManagement from './pages/CUSTOMER/CustomerManagement';
import MembershipManagement from './pages/MEMBERSHIP/MembershipManagement';
import MembershipPurchase from './pages/MEMBERSHIP/MembershipPurchase';
// import FollowUpManagement from './pages/FOLLOWUP/FollowUpManagement'; // Replaced with ManualFollowUp
import BerandaMarketing from './pages/FOLLOWUP/BerandaMarketing';
import SequenceManagement from './pages/FOLLOWUP/SequenceManagement';
import ManualFollowUp from './pages/FOLLOWUP/ManualFollowUpSimple';
import SequenceForm from './pages/FOLLOWUP/SequenceForm';
import TemplateManagement from './pages/FOLLOWUP/TemplateManagement';
import TemplateForm from './pages/FOLLOWUP/TemplateForm';
import FollowUpReports from './pages/FOLLOWUP/FollowUpReports';
import BroadcastPlanning from './pages/FOLLOWUP/BroadcastPlanning';
import BerandaCampaign from './pages/CAMPAIGN/BerandaCampaign';
import TenantList from './pages/TENANT/TenantList';
import TenantDetail from './pages/TENANT/TenantDetail';
import TenantCreate from './pages/TENANT/TenantCreate';
import TenantEdit from './pages/TENANT/TenantEdit';
import TenantManagement from './pages/TENANT/TenantManagement';
import PrinterManagement from './pages/PRINTER/PrinterManagement';
import WhatsAppTemplateManagement from './pages/BERANDA_OWNER/WhatsAppTemplateManagement';
import SuperAppSuperAdminDashboard from './pages/SUPERAPP/SuperAppSuperAdminDashboard';
import SuperAppTenantList from './pages/SUPERAPP/SuperAppTenantList';
import SuperAppTenantSearch from './pages/SUPERAPP/SuperAppTenantSearch';
import SuperAppBillingManagement from './pages/SUPERAPP/SuperAppBillingManagement';
import SuperAppBillingSearch from './pages/SUPERAPP/SuperAppBillingSearch';
import SuperAppSubscriptionPlans from './pages/SUPERAPP/SuperAppSubscriptionPlans';
import SuperAppCreateSubscriptionPlan from './pages/SUPERAPP/SuperAppCreateSubscriptionPlan';
import SuperAppSubscriptionPlanDetail from './pages/SUPERAPP/SuperAppSubscriptionPlanDetail';
import SuperAppWaSetup from './pages/SUPERAPP/SuperAppWaSetup';
import PaymentMethodManagement from './pages/SUPERAPP/PaymentMethodManagement';
import PaymentManagement from './pages/SUPERAPP/PaymentManagement';
import SuperAppTopTenantOmzet from './pages/SUPERAPP/SuperAppTopTenantOmzet';
import AttendancePage from './pages/ATTENDANCE/AttendancePage';
import EndWorkPage from './pages/ATTENDANCE/EndWorkPage';
import UnifiedAttendancePage from './pages/ATTENDANCE/UnifiedAttendancePage';
import UnifiedTransportPage from './pages/TRANSPORT/UnifiedTransportPage';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import DeleteAccount from './pages/DeleteAccount';
import CustomOrderPage from './pages/CustomOrderPage';
import AICreditPage from './pages/AICreditPage';
import OrderForm from './pages/OrderForm';
import VerifyWA from './pages/VerifyWA';
import VerificationSuccess from './pages/VerificationSuccess';
import OnboardingFlow from './pages/OnboardingFlow';
import PanduanIndex from './pages/PANDUAN/PanduanIndex';
import PanduanCategory from './pages/PANDUAN/PanduanCategory';
import PanduanDetail from './pages/PANDUAN/PanduanDetail';
import SubscriptionPayment from './pages/SUBSCRIPTION/SubscriptionPayment';
import CheckoutPage from './pages/SUBSCRIPTION/CheckoutPage';
import PaymentSuccess from './pages/SUBSCRIPTION/PaymentSuccess';
import OrderDashboardNew from './pages/ORDER/OrderDashboardNew';
import ExpenseManagement from './pages/EXPENSE/ExpenseManagement';
import IncomeManagement from './pages/INCOME/IncomeManagement';
import BillingActiveTenantPayment from './pages/BILLING/BillingActiveTenantPayment';
import BillingActiveTenantHistory from './pages/BILLING/BillingActiveTenantHistory';
import BillingActiveTenantChangePlan from './pages/BILLING/BillingActiveTenantChangePlan';
import InactiveBillingPage from './pages/INACTIVEBILLING/InactiveBillingPage';

// Komponen untuk mengecek auth
const AuthCheck = ({ children }) => {
  // Removed auto-logout logic to prevent issues when superadmin changes branch
  // Attendance logic will be handled in NavigationModal instead

  return children;
};

function App() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  // Listen for version update event from RoleRedirect
  useEffect(() => {
    const handleVersionUpdate = (event) => {
      const versionData = event.detail;
      if (versionData && versionData.hasUpdate) {
        setUpdateInfo(versionData);
        if (versionData.forceUpdate) {
          setShowBanner(false);
        } else {
          setShowBanner(true);
        }
      }
    };

    // Check sessionStorage on mount
    const storedUpdate = sessionStorage.getItem('app_version_update');
    if (storedUpdate) {
      try {
        const versionData = JSON.parse(storedUpdate);
        if (versionData && versionData.hasUpdate) {
          setUpdateInfo(versionData);
          if (versionData.forceUpdate) {
            setShowBanner(false);
          } else {
            setShowBanner(true);
          }
        }
      } catch (e) {
        console.error('Error parsing stored version update:', e);
      }
    }

    // Listen for custom event
    window.addEventListener('appVersionUpdate', handleVersionUpdate);

    return () => {
      window.removeEventListener('appVersionUpdate', handleVersionUpdate);
    };
  }, []);

  const handleUpdate = () => {
    // Hanya reload, jangan update version di storage
    // Version akan tetap lama sampai app benar-benar terupdate
    sessionStorage.removeItem('app_version_update');
    window.location.reload();
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    sessionStorage.removeItem('app_version_update');
  };

  return (
    <Router>
      {showBanner && updateInfo && !updateInfo.forceUpdate && (
        <VersionUpdateBanner
          updateInfo={updateInfo}
          onUpdate={handleUpdate}
          onDismiss={handleDismissBanner}
        />
      )}
      {updateInfo && updateInfo.forceUpdate && (
        <VersionUpdateModal
          updateInfo={updateInfo}
          onUpdate={handleUpdate}
        />
      )}
      <div className={showBanner && updateInfo && !updateInfo.forceUpdate ? 'pt-16' : ''}>
        <AuthCheck>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="/custom-order" element={<CustomOrderPage />} />
            <Route path="/ai-credit" element={<AICreditPage />} />
            <Route path="/order" element={<OrderForm />} />
            <Route path="/verify-wa" element={<VerifyWA />} />
            <Route path="/verify/:token" element={<VerificationSuccess />} />
            <Route path="/onboarding" element={<OnboardingFlow />} />
            <Route path="/pilih-role" element={<PilihRole />} />
            <Route path="/panduan" element={<PanduanIndex />} />
            <Route path="/panduan/:categoryId" element={<PanduanCategory />} />
            <Route path="/panduan/:categoryId/:itemId" element={<PanduanDetail />} />
            <Route path="/bug-report" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <BugReportPage />
              </RoleRedirect>
            } />
            <Route path="/feedback" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin', 'employee']}>
                <Feedback />
              </RoleRedirect>
            } />
            <Route path="/bug-report-form" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin', 'employee']}>
                <BugReport />
              </RoleRedirect>
            } />
            <Route path="/profile" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin', 'employee']}>
                <ProfilePage />
              </RoleRedirect>
            } />
            <Route path="/superapp-feedback" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppFeedbackManagement />
              </RoleRedirect>
            } />
            <Route path="/superapp-bug-reports" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppBugReportsManagement />
              </RoleRedirect>
            } />
            <Route path="/superapp-expenses" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppExpenseManagement />
              </RoleRedirect>
            } />
            <Route path="/app-versions" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppVersionManagement />
              </RoleRedirect>
            } />
            <Route path="/subscription-payment" element={<SubscriptionPayment />} />
            <Route path="/subscription-payment/:encryptedData" element={<SubscriptionPayment />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/billing-active-tenant" element={
              <BillingTenantManajemen />
            } />
            <Route path="/billing-active-tenant-payment" element={
              <BillingActiveTenantPayment />
            } />
            <Route path="/billing-active-tenant-history" element={
              <BillingActiveTenantHistory />
            } />
            <Route path="/billing-active-tenant-change-plan" element={
              <BillingActiveTenantChangePlan />
            } />
            <Route path="/inactive-tenant-billing" element={
              <InactiveBillingPage />
            } />
            <Route path="/billing-management-tenant" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin']}>
                <ShiftProviderWrapper>
                  <BillingManagement />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/order-detail/:id" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin']}>
                <OrderDetail />
              </RoleRedirect>
            } />
            <Route path="/orders" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin']}>
                <ShiftProviderWrapper>
                  <OrderDashboard />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/orders-new" element={
              <OrderDashboardNew />
            } />
            <Route path="/quick-order" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin']}>
                <ShiftProviderWrapper>
                  <QuickOrder />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/membership-purchase" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin']}>
                <ShiftProviderWrapper>
                  <MembershipPurchase />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/finance" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin']}>
                <ShiftProviderWrapper>
                  <FinanceDashboard />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/finance-transactions" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin']}>
                <ShiftProviderWrapper>
                  <FinanceDashboard />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/finance-management" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftProviderWrapper>
                  <FinanceManagement />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/finance-accounts" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftProviderWrapper>
                  <FinanceAccounts />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/finance-categories" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftProviderWrapper>
                  <FinanceCategories />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/finance-transactions" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <FinanceTransactions />
              </RoleRedirect>
            } />
            <Route path="/expense-management" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftProviderWrapper>
                  <ExpenseManagement />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/income-management" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftProviderWrapper>
                  <IncomeManagement />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/finance-reports" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftProviderWrapper>
                  <FinanceReports />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/laporan-keuangan" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftProviderWrapper>
                  <FinanceReport />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/laporan-operasional" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftProviderWrapper>
                  <OperationalReport />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/laporan-kinerja" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <LaporanKinerja />
              </RoleRedirect>
            } />
            <Route path="/shift-management" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftManagementOwner />
              </RoleRedirect>
            } />
            <Route path="/berandaowner" element={
              <RoleRedirect allowedRoles={BERANDA_ACCESS['/berandaowner']}>
                <ShiftProviderWrapper>
                  <BerandaOwner />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />

            <Route path="/berandasupervisor" element={
              <RoleRedirect allowedRoles={BERANDA_ACCESS['/berandasupervisor']}>
                <BerandaSupervisor />
              </RoleRedirect>
            } />

            <Route path="/berandastaff" element={
              <RoleRedirect allowedRoles={BERANDA_ACCESS['/berandastaff']}>
                <BerandaStaff />
              </RoleRedirect>
            } />

            <Route path="/tugas-harian" element={
              <RoleRedirect allowedRoles={['superadmin', 'supervisor', 'admin']}>
                <TugasHarian />
              </RoleRedirect>
            } />

            <Route path="/monitor-absensi" element={
              <RoleRedirect allowedRoles={['superadmin', 'supervisor', 'admin']}>
                <MonitorAbsensi />
              </RoleRedirect>
            } />

            <Route path="/branch-management" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftProviderWrapper>
                  <BranchManagement />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/stok-barang" element={
              <RoleRedirect allowedRoles={['superadmin', 'supervisor']}>
                <StockManagement />
              </RoleRedirect>
            } />
            <Route path="/analisis-karyawan" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftProviderWrapper>
                  <AnalisisKaryawan />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/analisis-karyawan/:id" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <EmployeeDetail />
              </RoleRedirect>
            } />
            <Route path="/pengaturan" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftProviderWrapper>
                  <PengaturanSistem />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/wa-setup" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <ShiftProviderWrapper>
                  <WaSetup />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/whatsapp-template-management" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <ShiftProviderWrapper>
                  <WhatsAppTemplateManagement />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/manajemen-karyawan" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftProviderWrapper>
                  <ManajemenKaryawan />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/absensi-karyawan" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin', 'employee']}>
                <ShiftProviderWrapper>
                  <AbsensiKaryawan />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/jadwal-kerja" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <ShiftProviderWrapper>
                  <WorkSchedulePage />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/treatment-management" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <ShiftProviderWrapper>
                  <TreatmentManagement />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/discount-management" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <ShiftProviderWrapper>
                  <DiscountManagement />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/product-category-management" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <ShiftProviderWrapper>
                  <ProductCategoryManagement />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/item-management" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <ShiftProviderWrapper>
                  <ItemManagement />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/item-management-admin" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <ShiftProviderWrapper>
                  <ItemManagement isFromAdmin={true} />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/customer-management" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <ShiftProviderWrapper>
                  <CustomerManagement />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/membership-management" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <ShiftProviderWrapper>
                  <MembershipManagement />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/followup-management" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <SubscriptionPlanGuard featureName="FollowUp Manual">
                  <ManualFollowUp />
                </SubscriptionPlanGuard>
              </RoleRedirect>
            } />
            <Route path="/beranda-marketing" element={
              <RoleRedirect allowedRoles={BERANDA_ACCESS['/beranda-marketing']}>
                <BerandaMarketing />
              </RoleRedirect>
            } />
            <Route path="/followup/sequences" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <SequenceManagement />
              </RoleRedirect>
            } />
            <Route path="/followup/sequences/create" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <SequenceForm />
              </RoleRedirect>
            } />
            <Route path="/followup/sequences/:id" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <SequenceForm />
              </RoleRedirect>
            } />
            <Route path="/followup/templates" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <SubscriptionPlanGuard featureName="Template FU">
                  <TemplateManagement />
                </SubscriptionPlanGuard>
              </RoleRedirect>
            } />
            <Route path="/followup/templates/create" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <SubscriptionPlanGuard featureName="Template FU">
                  <TemplateForm />
                </SubscriptionPlanGuard>
              </RoleRedirect>
            } />
            <Route path="/followup/templates/:id" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <SubscriptionPlanGuard featureName="Template FU">
                  <TemplateForm />
                </SubscriptionPlanGuard>
              </RoleRedirect>
            } />
            <Route path="/followup/reports" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <FollowUpReports />
              </RoleRedirect>
            } />
            <Route path="/followup/manual" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <ManualFollowUp />
              </RoleRedirect>
            } />
            <Route path="/followup/broadcast-planning" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <BroadcastPlanning />
              </RoleRedirect>
            } />
            <Route path="/campaign-dashboard" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <BerandaCampaign />
              </RoleRedirect>
            } />
            <Route path="/tenant-management" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftProviderWrapper>
                  <TenantManagement />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/printer-management" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <ShiftProviderWrapper>
                  <PrinterManagement />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/printer-settings" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <SubscriptionPlanGuard featureName="Struk Invoice">
                  <ShiftProviderWrapper>
                    <PrinterSettings />
                  </ShiftProviderWrapper>
                </SubscriptionPlanGuard>
              </RoleRedirect>
            } />
            <Route path="/invoice-digital-settings" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <SubscriptionPlanGuard featureName="Invoice Digital">
                  <ShiftProviderWrapper>
                    <InvoiceDigitalSettings />
                  </ShiftProviderWrapper>
                </SubscriptionPlanGuard>
              </RoleRedirect>
            } />
            <Route path="/points-settings" element={
              <RoleRedirect allowedRoles={['superadmin']}>
                <ShiftProviderWrapper>
                  <PointsSettings />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/printer-management-admin" element={
              <RoleRedirect allowedRoles={['superadmin', 'admin']}>
                <ShiftProviderWrapper>
                  <PrinterManagement isFromAdmin={true} />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/tenants" element={
              <RoleRedirect allowedRoles={['superapp-superadmin', 'superadmin']}>
                <TenantList />
              </RoleRedirect>
            } />
            <Route path="/tenants/create" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <TenantCreate />
              </RoleRedirect>
            } />
            <Route path="/tenants/:id" element={
              <RoleRedirect allowedRoles={['superapp-superadmin', 'superadmin']}>
                <TenantDetail />
              </RoleRedirect>
            } />
            <Route path="/tenants/:id/edit" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <TenantEdit />
              </RoleRedirect>
            } />
            <Route path="/superapp-dashboard" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppSuperAdminDashboard />
              </RoleRedirect>
            } />
            <Route path="/payment-management" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <PaymentManagement />
              </RoleRedirect>
            } />
            <Route path="/tenant-list" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppTenantList />
              </RoleRedirect>
            } />
            <Route path="/tenant-search" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppTenantSearch />
              </RoleRedirect>
            } />
            <Route path="/tenant-create" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <TenantCreate />
              </RoleRedirect>
            } />
            <Route path="/billing-management" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppBillingManagement />
              </RoleRedirect>
            } />
            <Route path="/billing-search" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppBillingSearch />
              </RoleRedirect>
            } />
            <Route path="/subscription-plans" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppSubscriptionPlans />
              </RoleRedirect>
            } />
            <Route path="/subscription-plans/create" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppCreateSubscriptionPlan />
              </RoleRedirect>
            } />
            <Route path="/subscription-plans/:id" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppSubscriptionPlanDetail />
              </RoleRedirect>
            } />
            <Route path="/subscription-plans/:id/edit" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppCreateSubscriptionPlan />
              </RoleRedirect>
            } />
            <Route path="/superapp-wa-setup" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppWaSetup />
              </RoleRedirect>
            } />
            <Route path="/payment-method-management" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <PaymentMethodManagement />
              </RoleRedirect>
            } />
            <Route path="/top-tenant-omzet" element={
              <RoleRedirect allowedRoles={['superapp-superadmin']}>
                <SuperAppTopTenantOmzet />
              </RoleRedirect>
            } />
            <Route path="/berandateknisi" element={
              <RoleRedirect allowedRoles={BERANDA_ACCESS['/berandateknisi']}>
                <BerandaTeknisi />
              </RoleRedirect>
            } />
            <Route path="/antrian/:estimasi" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin', 'employee']}>
                <Antrian />
              </RoleRedirect>
            } />
            <Route path="/antrian-v2" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin', 'employee']}>
                <AntrianV2 />
              </RoleRedirect>
            } />
            <Route path="/antrian-v2/:treatment" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin', 'employee']}>
                <AntrianV2 />
              </RoleRedirect>
            } />
            <Route path="/login" element={<LoginKaryawan />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/loginSuccess" element={<LoginSuccess />} />
            <Route path="/attendance" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin', 'employee']}>
                <UnifiedAttendancePage />
              </RoleRedirect>
            } />
            <Route path="/end-work" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin', 'employee']}>
                <EndWorkPage />
              </RoleRedirect>
            } />
            <Route path="/invoice" element={<Invoice />} />
            <Route path="/invoice/:token" element={<InvoiceDigital />} />
            <Route path="/kurir/transport" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin', 'employee']}>
                <UnifiedTransportPage />
              </RoleRedirect>
            } />
            <Route path="/transport" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin', 'employee']}>
                <UnifiedTransportPage />
              </RoleRedirect>
            } />
            <Route path="/berandakurir" element={
              <RoleRedirect allowedRoles={BERANDA_ACCESS['/berandakurir']}>
                <BerandaKurir />
              </RoleRedirect>
            } />
            <Route path="/berandadapur" element={
              <RoleRedirect allowedRoles={BERANDA_ACCESS['/berandadapur']}>
                <BerandaDapur />
              </RoleRedirect>
            } />
            <Route path="/berandaqc" element={
              <RoleRedirect allowedRoles={BERANDA_ACCESS['/berandaqc']}>
                <ShiftProviderWrapper>
                  <BerandaQC />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/berandaqc/history" element={
              <RoleRedirect allowedRoles={BERANDA_ACCESS['/berandaqc']}>
                <ShiftProviderWrapper>
                  <RiwayatQC />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/calendar" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin']}>
                <CalendarDashboard />
              </RoleRedirect>
            } />
            <Route path="/berandakasir" element={
              <RoleRedirect allowedRoles={BERANDA_ACCESS['/berandakasir']}>
                <ShiftProviderWrapper>
                  <BerandaKasir />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/pengaturan-admin" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin']}>
                <ShiftProviderWrapper>
                  <PengaturanAdmin />
                </ShiftProviderWrapper>
              </RoleRedirect>
            } />
            <Route path="/admin-notes" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin', 'employee']}>
                <AdminNotes />
              </RoleRedirect>
            } />
            <Route path="/admin-notes/new" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin', 'employee']}>
                <AdminNoteForm />
              </RoleRedirect>
            } />
            <Route path="/admin-notes/:id/edit" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin', 'employee']}>
                <AdminNoteForm />
              </RoleRedirect>
            } />
            <Route path="/berandakasir/antriankasir" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin', 'employee']}>
                <AntrianKasir />
              </RoleRedirect>
            } />
            <Route path="/berandakasir/antriankasir/:treatment" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin', 'employee']}>
                <AntrianKasir />
              </RoleRedirect>
            } />
            <Route path="/berandakasir/antriankasir/all" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin', 'employee']}>
                <AntrianKasir />
              </RoleRedirect>
            } />
            {/* Halaman absen lama — sudah digantikan /attendance (foto + GPS wajib) */}
            <Route path="/cekabsen" element={<Navigate to="/attendance" replace />} />
            <Route path="/cekgaji" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin']}>
                <CekGaji />
              </RoleRedirect>
            } />
            <Route path="/kontrolkerja" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin']}>
                <KontrolKerja />
              </RoleRedirect>
            } />
            <Route path="/kurir" element={
              <RoleRedirect allowedRoles={['admin', 'superadmin', 'employee']}>
                <AntrianKurir />
              </RoleRedirect>
            } />
            <Route path="/izin-success" element={<IzinSuccess />} />
          </Routes>
        </AuthCheck>
      </div>
    </Router>
  );
}

export default App;
