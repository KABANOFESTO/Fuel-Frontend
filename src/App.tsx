import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ReactElement } from 'react';
// Import all your components
import Layout from './Admin_dashboard/Layout';
import Dashboard from './Admin_dashboard/Dashboard';
import LoginPage from './pages/Login';
import ForgotPassword from './pages/Forgot';
import StationManagement from './Admin_dashboard/StationManagement';
import UserManagement from './Admin_dashboard/UserManagement';
import VehicleManagement from './Admin_dashboard/VehicleManagement';
import DriverManagement from './Admin_dashboard/DriverManagement';
import Report from './Admin_dashboard/Reports';
import ProfileSettings from './Admin_dashboard/ProfileSettings';
import VehicleRefuelingValidation from './Admin_dashboard/VehicleRefuelingValidation';
import DashboardLayout from './Station_Dashboard/Slayout';
import DashboardMain from './Station_Dashboard/Sdashboard';
import RefuelingDashboard from './Station_Dashboard/RefuelingDashboard';
import ReportMain from './Station_Dashboard/Sreport';
import ProfileSetting from './Station_Dashboard/Sprofile';
import Bdashboard from './Boss_dashboard/Bdashboard';
import Blayout from './Boss_dashboard/Blayout';
import Breport from './Boss_dashboard/Breports';
import Profile from './Boss_dashboard/Bprofile';
import ResetPassword from './pages/ResetPassword';



interface ProtectedRouteProps {
  element: ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ element, allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  const accessToken = localStorage.getItem("accessToken");


  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {

    const decodedToken = jwtDecode(accessToken) as { role: string };

    if (allowedRoles && !allowedRoles.includes(decodedToken.role)) {

      switch (decodedToken.role) {
        case 'admin':
          return <Navigate to="/admin/dashboard" replace />;
        case 'station_worker':
          return <Navigate to="/station/dashboard" replace />;
        case 'viewer':
          return <Navigate to="/boss/dashboard" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }

    return element;
  } catch (error) {

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
};

function App() {
  return (
    <Routes>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgot" element={<ForgotPassword />} />


      <Route
        path="/admin"
        element={<ProtectedRoute element={<Layout />} allowedRoles={['admin']} />}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="stations" element={<StationManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="vehicles" element={<VehicleManagement />} />
        <Route path="drivers" element={<DriverManagement />} />
        <Route path="reports" element={<Report />} />
        <Route path="settings" element={<ProfileSettings />} />
        <Route path="fuel" element={<VehicleRefuelingValidation />} />
      </Route>


      <Route
        path="/station"
        element={<ProtectedRoute element={<DashboardLayout />} allowedRoles={['station_worker']} />}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardMain />} />
        <Route path="fuel-services" element={<RefuelingDashboard />} />
        <Route path="reports" element={<ReportMain />} />
        <Route path="profile" element={<ProfileSetting />} />
      </Route>


      <Route
        path="/boss"
        element={<ProtectedRoute element={<Blayout />} allowedRoles={['viewer']} />}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Bdashboard />} />
        <Route path="reports" element={<Breport />} />
        <Route path="profile" element={<Profile />} />
      </Route>


      <Route path="/" element={<Navigate to="/login" replace />} />


      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
function jwtDecode(accessToken: string): { role: string; } {
  const base64Url = accessToken.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}
