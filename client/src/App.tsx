import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Code-splitting: Load pages dynamically
const LoginPage = lazy(() => import('./pages/Login'));
const DashboardLayout = lazy(() => import('./pages/Dashboard'));
const PublicReportCard = lazy(() => import('./pages/PublicReportCard'));
const QRCodePrintView = lazy(() => import('./pages/QRCodePrintView'));

// Lazy load components for Dashboard routes
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const ManageUsers = lazy(() => import('./components/ManageUsers'));
const ManageDistricts = lazy(() => import('./components/ManageDistricts'));
const ManageMandals = lazy(() => import('./components/ManageMandals'));
const ManageSchools = lazy(() => import('./components/ManageSchools'));
const ManageTests = lazy(() => import('./components/ManageTests'));
const ManageStudents = lazy(() => import('./components/ManageStudents'));
const MarksEntryGrid = lazy(() => import('./components/MarksEntryGrid'));
const BulkUploadMarks = lazy(() => import('./components/BulkUploadMarks'));
const GenerateQRSelector = lazy(() => import('./components/GenerateQRSelector'));

// Helper Components for Auth Logic
const ProtectedLayout = ({ user, children }) => {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const LoginWrapper = ({ user, onLogin }) => {
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  if (user) {
    return <Navigate to={from} replace />;
  }
  return <LoginPage onLogin={onLogin} />;
};

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in (persist session)
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('userData');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  return (
    <Router>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <Routes>
          {/* Public Route: Student Result Link */}
          <Route path="/student/:token" element={<PublicReportCard />} />

          {/* Auth Route: Login */}
          <Route path="/login" element={<LoginWrapper user={user} onLogin={handleLogin} />} />

          {/* Protected Routes: Dashboard Layout */}
          <Route element={
            <ProtectedLayout user={user}>
              <DashboardLayout user={user} onLogout={handleLogout} />
            </ProtectedLayout>
          }>
            <Route path="/dashboard" element={<AnalyticsDashboard user={user} />} />
            <Route path="/manage/users" element={<ManageUsers currentUser={user} />} />
            <Route path="/manage/districts" element={<ManageDistricts />} />
            <Route path="/manage/mandals" element={<ManageMandals currentUser={user} />} />
            <Route path="/manage/schools" element={<ManageSchools currentUser={user} />} />
            <Route path="/manage/tests" element={<ManageTests />} />
            <Route path="/manage/students" element={<ManageStudents currentUser={user} />} />
            <Route path="/manage/marks" element={<MarksEntryGrid user={user} />} />
            <Route path="/bulk-upload-marks" element={<BulkUploadMarks user={user} />} />
            <Route path="/generate-qr" element={<GenerateQRSelector user={user} />} />
          </Route>

          {/* Protected Route: QR Code Print */}
          <Route path="/print-qrs/:schoolId" element={<QRCodePrintView />} />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;