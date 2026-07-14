import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';
import LoadingAnimation from './components/LoadingAnimation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PharmacyRegister from './pages/PharmacyRegister';
import DentistRegister from './pages/DentistRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Detection from './pages/Detection';
import ChatAssistant from './pages/ChatAssistant';
import Education from './pages/Education';
import Consultation from './pages/Consultation';
import History from './pages/History';
import Profile from './pages/Profile';
import Prescriptions from './pages/Prescriptions';
import OrderMedicines from './pages/OrderMedicines';
import OrderTracking from './pages/OrderTracking';
import DentistDashboard from './pages/DentistDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MedicineMarketplace from './pages/MedicineMarketplace';
import Cart from './pages/Cart';
import DirectOrders from './pages/DirectOrders';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/register-pharmacy" element={<PageTransition><PharmacyRegister /></PageTransition>} />
        <Route path="/register-dentist" element={<PageTransition><DentistRegister /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />

        <Route path="/dashboard" element={<ProtectedRoute roles={['user', 'admin']}><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/detect" element={<ProtectedRoute roles={['user', 'admin']}><PageTransition><Detection /></PageTransition></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute roles={['user', 'admin']}><PageTransition><ChatAssistant /></PageTransition></ProtectedRoute>} />
        <Route path="/education" element={<ProtectedRoute roles={['user', 'admin']}><PageTransition><Education /></PageTransition></ProtectedRoute>} />
        <Route path="/consultation" element={<ProtectedRoute roles={['user', 'admin', 'dentist']}><PageTransition><Consultation /></PageTransition></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute roles={['user', 'admin']}><PageTransition><History /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute roles={['user', 'admin', 'dentist']}><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="/prescriptions" element={<ProtectedRoute roles={['user', 'admin']}><PageTransition><Prescriptions /></PageTransition></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute roles={['user', 'admin']}><PageTransition><OrderTracking /></PageTransition></ProtectedRoute>} />
        <Route path="/orders/send/:prescriptionId" element={<ProtectedRoute roles={['user', 'admin']}><PageTransition><OrderMedicines /></PageTransition></ProtectedRoute>} />

        <Route path="/dentist" element={<ProtectedRoute roles={['dentist']}><PageTransition><DentistDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/pharmacy" element={<ProtectedRoute roles={['pharmacy']}><PageTransition><PharmacyDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute>} />

        <Route path="/medicines" element={<ProtectedRoute roles={['user', 'dentist', 'admin']}><PageTransition><MedicineMarketplace /></PageTransition></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute roles={['user', 'dentist', 'admin']}><PageTransition><Cart /></PageTransition></ProtectedRoute>} />
        <Route path="/direct-orders" element={<ProtectedRoute roles={['user', 'dentist', 'admin']}><PageTransition><DirectOrders /></PageTransition></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingAnimation fullScreen message="Loading Oral AI..." />;
  }

  return <AnimatedRoutes />;
}

export default App;
