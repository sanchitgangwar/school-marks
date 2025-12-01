import { useState, useEffect } from 'react';
import {
  FileText, LogOut, Users, Map, Layers,
  MapPin, Building, PenTool, UserPlus, QrCode, Sheet
} from 'lucide-react';

import ManageUsers from '../../components/ManageUsers';
import ManageDistricts from '../../components/ManageDistricts';
import ManageMandals from '../../components/ManageMandals';
import ManageSchools from '../../components/ManageSchools';
import ManageTests from '../../components/ManageTests';
import ManageStudents from '../../components/ManageStudents';
import MarksEntryGrid from '../../components/MarksEntryGrid';
import BulkUploadMarks from '../../components/BulkUploadMarks';
import GenerateQRSelector from '../../components/GenerateQRSelector';
import AnalyticsDashboard from '../../components/AnalyticsDashboard';

import telanganaLogo from '../../assets/Telangana-LOGO.png';
import cpLogo from '../../assets/CPLogo.png';


// ==========================================
// 3. MAIN DASHBOARD COMPONENT
// ==========================================

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_URL;
      try {
        await fetch(`${apiUrl}/api/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        // Stats logic removed as we are using AnalyticsDashboard
      } catch {
        // Mock stats for preview if backend is offline
      }
    };
    fetchStats();
  }, []);

  const roleLabels = { 'admin': 'Super Admin', 'deo': 'District Education Officer', 'meo': 'Mandal Education Officer', 'school_admin': 'School Principal' };
  const hasAccess = (allowedRoles) => allowedRoles.includes(user.role);

  const renderContent = () => {
    switch (activeTab) {
      case 'users': return <ManageUsers currentUser={user} />;
      case 'add_district': return <ManageDistricts />;
      case 'add_mandal': return <ManageMandals currentUser={user} />;
      case 'add_school': return <ManageSchools currentUser={user} />;
      case 'add_test': return <ManageTests />;
      case 'add_student': return <ManageStudents currentUser={user} />;
      case 'add_marks': return <MarksEntryGrid user={user} />;
      case 'bulk_upload_marks': return <BulkUploadMarks user={user} />
      case 'generate_qr': return <GenerateQRSelector user={user} />;
      default: return <AnalyticsDashboard user={user} />;
    }
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
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Layers className="mr-3 h-5 w-5" />Dashboard</button>

          {hasAccess(['admin', 'deo', 'meo']) && (
            <button onClick={() => setActiveTab('users')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'users' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Users className="mr-3 h-5 w-5" /> Manage Users</button>
          )}

          <div className="pt-6 pb-2 px-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MANAGE</h3></div>

          {hasAccess(['admin']) && (<button onClick={() => setActiveTab('add_district')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'add_district' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Map className="mr-3 h-5 w-5" /> District</button>)}
          {hasAccess(['admin', 'deo']) && (<button onClick={() => setActiveTab('add_mandal')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'add_mandal' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><MapPin className="mr-3 h-5 w-5" /> Mandal</button>)}
          {hasAccess(['admin', 'deo', 'meo']) && (<button onClick={() => setActiveTab('add_school')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'add_school' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Building className="mr-3 h-5 w-5" /> School</button>)}
          {hasAccess(['admin', 'deo']) && (<button onClick={() => setActiveTab('add_test')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'add_test' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><FileText className="mr-3 h-5 w-5" /> Test / Exam</button>)}
          {hasAccess(['admin', 'deo', 'meo', 'school_admin']) && (<button onClick={() => setActiveTab('add_student')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'add_student' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><UserPlus className="mr-3 h-5 w-5" /> Student</button>)}
          {hasAccess(['admin', 'deo', 'meo', 'school_admin']) && (<button onClick={() => setActiveTab('add_marks')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'add_marks' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><PenTool className="mr-3 h-5 w-5" /> Marks</button>)}

          <div className="pt-6 pb-2 px-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bulk Upload</h3></div>
          {hasAccess(['admin', 'deo', 'meo', 'school_admin']) && (<button onClick={() => setActiveTab('bulk_upload_marks')} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'bulk_upload_marks' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Sheet className="mr-3 h-5 w-5" /> Marks</button>)}

          <div className="pt-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tools</div>
          <button onClick={() => setActiveTab('generate_qr')} className="flex items-center w-full text-left px-4 py-2 text-sm text-purple-600 font-bold hover:bg-purple-50 rounded"><QrCode className="mr-3 h-5 w-5" /> QR Stickers</button>
        </nav>
        <div className="p-4 border-t border-gray-100"><button onClick={onLogout} className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"><LogOut className="mr-3 h-5 w-5" /> Logout</button></div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex md:hidden justify-between items-center mb-6"><h1 className="font-bold text-xl">Portal</h1><button onClick={onLogout}><LogOut className="h-5 w-5 text-red-600" /></button></header>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 capitalize">{activeTab.replace(/_/g, ' ')}</h2>
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;