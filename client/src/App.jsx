import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { FullPageLoader } from './components/ui/FullPageLoader';

const Home = lazy(() => import('./pages/public/Home'));
const About = lazy(() => import('./pages/public/About'));
const Services = lazy(() => import('./pages/public/Services'));
const ServiceDetail = lazy(() => import('./pages/public/ServiceDetail'));
const Pricing = lazy(() => import('./pages/public/Pricing'));
const HowItWorks = lazy(() => import('./pages/public/HowItWorks'));
const Faq = lazy(() => import('./pages/public/Faq'));
const Contact = lazy(() => import('./pages/public/Contact'));
const ConfirmationPage = lazy(() => import('./pages/public/ConfirmationPage'));
const Policy = lazy(() => import('./pages/public/Policy'));
const NotFound = lazy(() => import('./pages/public/NotFound'));

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const NewRequest = lazy(() => import('./pages/student/NewRequest'));
const Orders = lazy(() => import('./pages/student/Orders'));
const OrderDetail = lazy(() => import('./pages/student/OrderDetail'));
const Quotations = lazy(() => import('./pages/student/Quotations'));
const Payments = lazy(() => import('./pages/student/Payments'));
const Documents = lazy(() => import('./pages/student/Documents'));
const StudentMessages = lazy(() => import('./pages/student/Messages'));
const Support = lazy(() => import('./pages/student/Support'));
const Consultations = lazy(() => import('./pages/student/Consultations'));
const PrivacyCenter = lazy(() => import('./pages/student/PrivacyCenter'));
const Profile = lazy(() => import('./pages/student/Profile'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/OrderDetail'));
const AdminQuotations = lazy(() => import('./pages/admin/Quotations'));
const AdminPayments = lazy(() => import('./pages/admin/Payments'));
const AdminStudents = lazy(() => import('./pages/admin/Students'));
const AdminStudentDetail = lazy(() => import('./pages/admin/StudentDetail'));
const AdminServices = lazy(() => import('./pages/admin/Services'));
const AdminSupport = lazy(() => import('./pages/admin/Support'));
const AdminCalendar = lazy(() => import('./pages/admin/Calendar'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews'));
const AdminTeam = lazy(() => import('./pages/admin/Team'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminPrivacy = lazy(() => import('./pages/admin/Privacy'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

const fallback = <FullPageLoader label="Loading" />;

export default function App() {
  return (
    <Suspense fallback={fallback}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="services" element={<Services />} />
          <Route path="services/:slug" element={<ServiceDetail />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="faq" element={<Faq />} />
          <Route path="contact" element={<Contact />} />
          <Route path="enquiry-confirmation/:reference" element={<ConfirmationPage />} />
          <Route path="privacy-policy" element={<Policy page="privacy" />} />
          <Route path="terms-of-service" element={<Policy page="terms" />} />
          <Route path="refund-policy" element={<Policy page="refund" />} />
          <Route path="academic-integrity-policy" element={<Policy page="integrity" />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute roles={['student']} />}>
          <Route path="dashboard" element={<DashboardLayout area="student" />}>
            <Route index element={<StudentDashboard />} />
            <Route path="requests/new" element={<NewRequest />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="payments" element={<Payments />} />
            <Route path="documents" element={<Documents />} />
            <Route path="messages" element={<StudentMessages />} />
            <Route path="support" element={<Support />} />
            <Route path="consultations" element={<Consultations />} />
            <Route path="privacy" element={<PrivacyCenter />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['owner', 'admin', 'consultant', 'support']} />}>
          <Route path="admin" element={<DashboardLayout area="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="quotations" element={<AdminQuotations />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="students/:id" element={<AdminStudentDetail />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="calendar" element={<AdminCalendar />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="privacy" element={<AdminPrivacy />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
