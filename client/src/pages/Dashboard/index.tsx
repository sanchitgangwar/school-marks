import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  FileText, LogOut, Users, Map, Layers,
  MapPin, Building, PenTool, UserPlus, QrCode, Sheet
} from 'lucide-react';

import telanganaLogo from '../../assets/Telangana-LOGO.png';
import cpLogo from '../../assets/CPLogo.png';

// ==========================================
// 3. MAIN DASHBOARD LAYOUT COMPONENT
// ==========================================

const DashboardLayout = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = (path) => {
    if (path === '/dashboard') return 'dashboard';
    if (path.startsWith('/manage/users')) return 'users';
    if (path.startsWith('/manage/districts')) return 'add_district';
    if (path.startsWith('/manage/mandals')) return 'add_mandal';
    if (path.startsWith('/manage/schools')) return 'add_school';
    if (path.startsWith('/manage/tests')) return 'add_test';
    if (path.startsWith('/manage/students')) return 'add_student';
    if (path.startsWith('/manage/marks')) return 'add_marks';
    if (path.startsWith('/bulk-upload-marks')) return 'bulk_upload_marks';
    if (path.startsWith('/generate-qr')) return 'generate_qr';
    return 'dashboard';
  };

  const activeTab = getActiveTab(location.pathname);

  const roleLabels = { 'admin': 'Super Admin', 'deo': 'District Education Officer', 'meo': 'Mandal Education Officer', 'school_admin': 'School Principal' };
  const hasAccess = (allowedRoles) => allowedRoles.includes(user.role);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const getPageTitle = (tab) => {
    const titles = {
      'dashboard': 'Dashboard',
      'users': 'Manage Users',
      'add_district': 'Manage Districts',
      'add_mandal': 'Manage Mandals',
      'add_school': 'Manage Schools',
      'add_test': 'Manage Tests / Exams',
      'add_student': 'Manage Students',
      'add_marks': 'Marks Entry',
      'bulk_upload_marks': 'Bulk Upload Marks',
      'generate_qr': 'Generate QR Stickers'
    };
    return titles[tab] || 'Portal';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col overflow-y-auto h-screen sticky top-0">
        <div className="mb-6 p-2 border-b border-gray-100 pb-4">
          <div className="flex items-center justify-center gap-2 mb-2 border-b border-gray-100 py-4">
            <img src={telanganaLogo} alt="Telangana Logo" className="h-25 w-auto" />
            <img src={cpLogo} alt="Second Logo" className="h-25 w-auto" />
          </div>
          <div className="px-4 py-2">
            <h1 className="font-bold text-xl text-blue-800 leading-tight">Marks Portal</h1>
            <span className="text-xs text-gray-500 block">{roleLabels[user.role]}</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => handleNavigation('/dashboard')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Layers className="mr-3 h-5 w-5" />Dashboard</button>

          {hasAccess(['admin', 'deo', 'meo']) && (
            <button onClick={() => handleNavigation('/manage/users')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'users' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Users className="mr-3 h-5 w-5" /> Manage Users</button>
          )}

          <div className="pt-6 pb-2 px-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MANAGE</h3></div>

          {hasAccess(['admin']) && (<button onClick={() => handleNavigation('/manage/districts')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'add_district' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Map className="mr-3 h-5 w-5" /> District</button>)}
          {hasAccess(['admin', 'deo']) && (<button onClick={() => handleNavigation('/manage/mandals')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'add_mandal' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><MapPin className="mr-3 h-5 w-5" /> Mandal</button>)}
          {hasAccess(['admin', 'deo', 'meo']) && (<button onClick={() => handleNavigation('/manage/schools')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'add_school' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Building className="mr-3 h-5 w-5" /> School</button>)}
          {hasAccess(['admin', 'deo']) && (<button onClick={() => handleNavigation('/manage/tests')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'add_test' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><FileText className="mr-3 h-5 w-5" /> Test / Exam</button>)}
          {hasAccess(['admin', 'deo', 'meo', 'school_admin']) && (<button onClick={() => handleNavigation('/manage/students')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'add_student' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><UserPlus className="mr-3 h-5 w-5" /> Student</button>)}
          {hasAccess(['admin', 'deo', 'meo', 'school_admin']) && (<button onClick={() => handleNavigation('/manage/marks')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'add_marks' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><PenTool className="mr-3 h-5 w-5" /> Marks</button>)}

          <div className="pt-6 pb-2 px-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bulk Upload</h3></div>
          {hasAccess(['admin', 'deo', 'meo', 'school_admin']) && (<button onClick={() => handleNavigation('/bulk-upload-marks')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'bulk_upload_marks' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Sheet className="mr-3 h-5 w-5" /> Marks</button>)}

          <div className="pt-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tools</div>
          <button onClick={() => handleNavigation('/generate-qr')} className="flex items-center w-full text-left px-4 py-2 text-sm text-purple-600 font-bold hover:bg-purple-50 rounded"><QrCode className="mr-3 h-5 w-5" /> QR Stickers</button>
        </nav>
        <div className="p-4 border-t border-gray-100"><button onClick={onLogout} className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"><LogOut className="mr-3 h-5 w-5" /> Logout</button></div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex md:hidden justify-between items-center mb-6"><h1 className="font-bold text-xl">Portal</h1><button onClick={onLogout}><LogOut className="h-5 w-5 text-red-600" /></button></header>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 capitalize">{getPageTitle(activeTab)}</h2>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;