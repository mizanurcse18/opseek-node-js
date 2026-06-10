import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import AuthLayout from '@/layouts/AuthLayout';
import { PrivateRoute } from '@/guards/PrivateRoute';
import { PublicRoute } from '@/guards/PublicRoute';

import Login from '@/features/auth/pages/Login';
import ForgotPassword from '@/features/auth/pages/ForgotPassword';
import Dashboard from '@/features/dashboard/pages/Dashboard';
import UserList from '@/features/users/pages/UserList';
import Settings from '@/features/settings/pages/Settings';
import PaymentLink from '@/features/payment/pages/PaymentLink';
import ChangePassword from '@/features/settings/pages/ChangePassword';
import Role from '@/features/master-settings/security/role/pages/Role';
import Menu from '@/features/master-settings/security/menu/pages/Menu';
import Group from '@/features/master-settings/security/group/pages/Group';
import SystemVariable from '@/features/master-settings/security/system-variable/pages/SystemVariable';
import Division from '@/features/master-settings/security/division/pages/Division';
import District from '@/features/master-settings/security/district/pages/District';
import Thana from '@/features/master-settings/security/thana/pages/Thana';
import Company from '@/features/master-settings/security/company/pages/Company';
import UserLogTracker from '@/features/master-settings/security/user-log-tracker/pages/UserLogTracker';
import RequestLogMonitor from '@/features/master-settings/security/request-log-monitor/pages/RequestLogMonitor';
import SystemConfiguration from '@/features/master-settings/security/system-config/pages/SystemConfiguration';
import CacheManagement from '@/features/master-settings/security/cache-management/pages/CacheManagement';
import KycVerification from '@/features/stakeholders/kyc/pages/KycVerification';
import KycPreview from '@/features/stakeholders/kyc/pages/KycPreview';
import KycWorkflowDesigner from '@/features/stakeholders/kyc/pages/KycWorkflowDesigner';
import MailConfigurationPage from '@/features/support/mail/pages/MailConfigurationPage';
import MailGroupSetupPage from '@/features/support/mail/pages/MailGroupSetupPage';
import MailLogPage from '@/features/support/mail/pages/MailLogPage';
import MailPage from '@/features/support/mail/pages/MailPage';
import Warehouse from '@/features/scm/warehouse/pages/Warehouse';
import ProductPage from '@/features/scm/product/pages/ProductPage';
import CategoryPage from '@/features/scm/category/pages/CategoryPage';
import PurchaseRequisitionPage from '@/features/scm/purchase-requisition/pages/PurchaseRequisitionPage';
import PurchaseQuotationPage from '@/features/scm/purchase-quotation/pages/PurchaseQuotationPage';
import SupplierPage from '@/features/scm/supplier/pages/SupplierPage';
import PurchaseOrderPage from '@/features/scm/purchase-order/pages/PurchaseOrderPage';
import GoodsReceiptPage from '@/features/scm/goods-receipt/pages/GoodsReceiptPage';
import SalesPage from '@/features/scm/sales-order/pages/SalesPage';
import ReportBuilderPage from '@/features/report-builder/pages/ReportBuilderPage';
import ReportExecutorPage from '@/features/report-builder/pages/ReportExecutorPage';
import VisitPlanListPage from '@/features/sales/visit-plans/pages/VisitPlanListPage';
import VisitPlanDetailPage from '@/features/sales/visit-plans/pages/VisitPlanDetailPage';
import VisitPlanTemplateListPage from '@/features/sales/visit-plans/pages/VisitPlanTemplateListPage';
import DealerRoadmapPage from '@/features/sales/visit-plans/pages/DealerRoadmapPage';
import ChartOfAccountsPage from '@/features/finance/chart-of-accounts/pages/ChartOfAccountsPage';
import VouchersPage from '@/features/finance/vouchers/pages/VouchersPage';
import DsrAttendancePage from '@/features/sales/dsr/attendance/pages/DsrAttendancePage';
import DsrCollectionPage from '@/features/sales/dsr/collection/pages/DsrCollectionPage';
import DsrDailySalesPage from '@/features/sales/dsr/daily-sales/pages/DsrDailySalesPage';
import DsrExpensePage from '@/features/sales/dsr/expense/pages/DsrExpensePage';
import DsrTargetPage from '@/features/sales/dsr/target/pages/DsrTargetPage';
import DsrVisitPage from '@/features/sales/dsr/visit/pages/DsrVisitPage';
import AuditLogPage from '@/features/master-settings/security/audit-log/pages/AuditLogPage';
import FinancialYearPage from '@/features/master-settings/security/financial-year/pages/FinancialYearPage';
import GlobalSettingsPage from '@/features/settings/global/pages/GlobalSettingsPage';
import NotificationsPage from '@/features/support/notifications/pages/NotificationsPage';
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';

import { ROUTES } from '@/constants/routes';

const basename = import.meta.env.VITE_BASE_ROUTE ?? '/';

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: ROUTES.HOME,
        element: <AuthLayout />,
        children: [
          { index: true, element: <Login /> },
          { path: ROUTES.LOGIN, element: <Login /> },
          { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPassword /> },
        ],
      },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        path: ROUTES.HOME,
        element: <AdminLayout />,
        children: [
          { path: ROUTES.DASHBOARD, element: <Dashboard /> },
          { path: '/payment/link', element: <PaymentLink /> },
          { path: '/access/users', element: <UserList /> },
          { path: ROUTES.USERS, element: <UserList /> },
          { path: '/users/:roleType', element: <UserList /> },
          { path: ROUTES.SUPER_USER, element: <UserList isSuperUser /> },
          { path: ROUTES.SETTINGS, element: <Settings /> },
          { path: '/settings/password', element: <ChangePassword /> },
          { path: ROUTES.ROLE, element: <Role /> },
          { path: ROUTES.ROLE_SUPERUSER, element: <Role isSuperUser /> },
          { path: ROUTES.MENU, element: <Menu /> },
          { path: ROUTES.GROUP, element: <Group /> },
          { path: ROUTES.GROUP_SUPERUSER, element: <Group isSuperUser /> },
          { path: ROUTES.SYSTEM_VARIABLE, element: <SystemVariable /> },
          { path: ROUTES.SYSTEM_VARIABLE_SUPERUSER, element: <SystemVariable isSuperUser /> },
          { path: ROUTES.DIVISION, element: <Division /> },
          { path: ROUTES.DIVISION_SUPERUSER, element: <Division isSuperUser /> },
          { path: ROUTES.DISTRICT, element: <District /> },
          { path: ROUTES.DISTRICT_SUPERUSER, element: <District isSuperUser /> },
          { path: ROUTES.THANA, element: <Thana /> },
          { path: ROUTES.THANA_SUPERUSER, element: <Thana isSuperUser /> },
          { path: ROUTES.USER_LOG_TRACKER, element: <UserLogTracker /> },
          { path: ROUTES.USER_LOG_TRACKER_SUPERUSER, element: <UserLogTracker isSuperUser /> },
          { path: ROUTES.REQUEST_LOG_MONITOR, element: <RequestLogMonitor /> },
          { path: ROUTES.REQUEST_LOG_MONITOR_SUPERUSER, element: <RequestLogMonitor /> },
          { path: ROUTES.SYSTEM_CONFIGURATION, element: <SystemConfiguration /> },
          { path: ROUTES.SYSTEM_CONFIGURATION_SUPERUSER, element: <SystemConfiguration isSuperUser /> },
          { path: ROUTES.CACHE_MANAGEMENT, element: <CacheManagement /> },
          { path: ROUTES.CACHE_MANAGEMENT_SUPERUSER, element: <CacheManagement isSuperUser /> },
          { path: ROUTES.STAKEHOLDER_KYC, element: <KycVerification /> },
          { path: ROUTES.STAKEHOLDER_KYC_PREVIEW, element: <KycPreview /> },
          { path: ROUTES.KYC_WORKFLOW_DESIGNER, element: <KycWorkflowDesigner /> },
          { path: ROUTES.COMPANY, element: <Company /> },
          { path: ROUTES.WAREHOUSE, element: <Warehouse /> },
          { path: ROUTES.WAREHOUSE_SUPERUSER, element: <Warehouse isSuperUser /> },
          { path: ROUTES.PRODUCT, element: <ProductPage /> },
          { path: ROUTES.PRODUCT_SUPERUSER, element: <ProductPage isSuperUser /> },
          { path: ROUTES.CATEGORY, element: <CategoryPage /> },
          { path: ROUTES.CATEGORY_SUPERUSER, element: <CategoryPage isSuperUser /> },
          { path: ROUTES.PURCHASE_REQUISITION, element: <PurchaseRequisitionPage /> },
          { path: ROUTES.PURCHASE_REQUISITION_SUPERUSER, element: <PurchaseRequisitionPage isSuperUser /> },
          { path: ROUTES.PURCHASE_QUOTATION, element: <PurchaseQuotationPage /> },
          { path: ROUTES.PURCHASE_QUOTATION_SUPERUSER, element: <PurchaseQuotationPage isSuperUser /> },
          { path: ROUTES.SUPPLIER, element: <SupplierPage /> },
          { path: ROUTES.SUPPLIER_SUPERUSER, element: <SupplierPage isSuperUser /> },
          { path: ROUTES.PURCHASE_ORDER, element: <PurchaseOrderPage /> },
          { path: ROUTES.PURCHASE_ORDER_SUPERUSER, element: <PurchaseOrderPage isSuperUser /> },
          { path: ROUTES.GOODS_RECEIPT, element: <GoodsReceiptPage /> },
          { path: ROUTES.GOODS_RECEIPT_SUPERUSER, element: <GoodsReceiptPage isSuperUser /> },
          { path: ROUTES.SALES_ORDER, element: <SalesPage /> },
          { path: ROUTES.SALES_ORDER_SUPERUSER, element: <SalesPage isSuperUser /> },
          { path: ROUTES.REPORT_BUILDER, element: <ReportBuilderPage /> },
          { path: '/reports/run', element: <ReportExecutorPage /> },
          { path: ROUTES.MAIL_CONFIGURATION, element: <MailConfigurationPage /> },
          { path: ROUTES.MAIL_CONFIGURATION_SUPERUSER, element: <MailConfigurationPage isSuperUser /> },
          { path: ROUTES.MAIL_GROUP_SETUP, element: <MailGroupSetupPage /> },
          { path: ROUTES.MAIL_GROUP_SETUP_SUPERUSER, element: <MailGroupSetupPage isSuperUser /> },
          { path: ROUTES.MAIL_LOG, element: <MailLogPage /> },
          { path: ROUTES.MAIL_LOG_SUPERUSER, element: <MailLogPage isSuperUser /> },
          { path: ROUTES.MAIL_UNIFIED, element: <MailPage /> },
          { path: ROUTES.MAIL_UNIFIED_SUPERUSER, element: <MailPage isSuperUser /> },
          { path: ROUTES.VISIT_PLANS, element: <VisitPlanListPage /> },
          { path: ROUTES.VISIT_PLANS_SUPERUSER, element: <VisitPlanListPage isSuperUser /> },
          { path: ROUTES.VISIT_PLAN_DETAIL, element: <VisitPlanDetailPage /> },
          { path: ROUTES.VISIT_PLAN_DETAIL_SUPERUSER, element: <VisitPlanDetailPage isSuperUser /> },
          { path: ROUTES.VISIT_PLAN_TEMPLATES, element: <VisitPlanTemplateListPage /> },
          { path: ROUTES.VISIT_PLAN_TEMPLATES_SUPERUSER, element: <VisitPlanTemplateListPage isSuperUser /> },
          { path: ROUTES.DEALER_ROADMAP, element: <DealerRoadmapPage /> },
          { path: ROUTES.DEALER_ROADMAP_SUPERUSER, element: <DealerRoadmapPage isSuperUser /> },
          { path: ROUTES.CHART_OF_ACCOUNTS, element: <ChartOfAccountsPage /> },
          { path: ROUTES.VOUCHERS, element: <VouchersPage /> },
          { path: ROUTES.DSR_ATTENDANCE, element: <DsrAttendancePage /> },
          { path: ROUTES.DSR_COLLECTION, element: <DsrCollectionPage /> },
          { path: ROUTES.DSR_DAILY_SALES, element: <DsrDailySalesPage /> },
          { path: ROUTES.DSR_EXPENSE, element: <DsrExpensePage /> },
          { path: ROUTES.DSR_TARGET, element: <DsrTargetPage /> },
          { path: ROUTES.DSR_VISIT, element: <DsrVisitPage /> },
          { path: ROUTES.FINANCIAL_YEAR, element: <FinancialYearPage /> },
          { path: ROUTES.AUDIT_LOG, element: <AuditLogPage /> },
          { path: ROUTES.GLOBAL_SETTINGS, element: <GlobalSettingsPage /> },
          { path: ROUTES.NOTIFICATIONS, element: <NotificationsPage /> },
          { path: ROUTES.UNAUTHORIZED, element: <Unauthorized /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />
  }
], { basename });
