import { useState, useEffect, useCallback } from 'react';
import {
  Users, Edit, Trash2, Plus, X
} from 'lucide-react';

// --- 1. MANAGE USERS COMPONENT (Updated with Dropdowns) ---
const ManageUsers = ({ currentUser }) => {
  const [formData, setFormData] = useState({
    username: '', password: '', role: 'school_admin', full_name: '',
    district_id: currentUser.district_id || '',
    mandal_id: currentUser.mandal_id || '',
    school_id: currentUser.school_id || ''
  });

  // Dropdown Data
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [schools, setSchools] = useState([]);

  const [msg, setMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- FETCHING LOGIC ---
  const token = localStorage.getItem('authToken');

  // 1. Fetch Districts (Admin Only)
  useEffect(() => {
    if (currentUser.role === 'admin') {
      fetch(`${import.meta.env.VITE_API_URL}/api/entities/districts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setDistricts(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [currentUser, token]);

  // 2. Fetch Mandals (Dependent on District)
  useEffect(() => {
    // If I am Admin, use the selected district. If I am DEO, use my own district.
    const activeDistrictId = currentUser.role === 'admin' ? formData.district_id : currentUser.district_id;

    if (activeDistrictId) {
      fetch(`${import.meta.env.VITE_API_URL}/api/entities/mandals?district_id=${activeDistrictId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setMandals(Array.isArray(data) ? data : []))
        .catch(console.error);
    } else {
      setMandals([]);
    }
  }, [formData.district_id, currentUser, token]);

  // 3. Fetch Schools (Dependent on Mandal)
  useEffect(() => {
    // If I am Admin/DEO, use selected mandal. If MEO, use my own.
    const activeMandalId = ['admin', 'deo'].includes(currentUser.role) ? formData.mandal_id : currentUser.mandal_id;

    if (activeMandalId) {
      fetch(`${import.meta.env.VITE_API_URL}/api/entities/schools?mandal_id=${activeMandalId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setSchools(Array.isArray(data) ? data : []))
        .catch(console.error);
    } else {
      setSchools([]);
    }
  }, [formData.mandal_id, currentUser, token]);


  // Determine allowed roles to create based on hierarchy
  const getAllowedRoles = () => {
    const roles = [
      { val: 'deo', label: 'District Education Officer' },
      { val: 'meo', label: 'Mandal Education Officer' },
      { val: 'school_admin', label: 'School Admin/Headmaster' }
    ];

    if (currentUser.role === 'admin') return roles;
    if (currentUser.role === 'deo') return roles.slice(1);
    if (currentUser.role === 'meo') return roles.slice(2);
    return [];
  };

  // --- FETCH USERS ---
  const [users, setUsers] = useState([]);
  const fetchUsers = useCallback(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- EDIT/DELETE STATE ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setFormData({
      username: '', password: '', role: 'school_admin', full_name: '',
      district_id: currentUser.district_id || '',
      mandal_id: currentUser.mandal_id || '',
      school_id: currentUser.school_id || ''
    });
    setIsEditMode(false);
    setEditingId(null);
    // setMsg(''); // Don't clear message here
  };

  const handleAddClick = () => {
    resetForm();
    setIsModalOpen(true);
    setMsg('');
  };

  const handleEdit = (user) => {
    setFormData({
      username: user.username,
      password: '', // Blank for no change
      role: user.role,
      full_name: user.full_name,
      district_id: user.district_id || '',
      mandal_id: user.mandal_id || '',
      school_id: user.school_id || ''
    });
    setEditingId(user.id);
    setIsEditMode(true);
    setIsModalOpen(true);
    setMsg('');
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Delete failed");
      }
      setMsg("User deleted successfully.");
      fetchUsers();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditMode
      ? `${import.meta.env.VITE_API_URL}/api/admin/users/${editingId}`
      : `${import.meta.env.VITE_API_URL}/api/admin/create-user`;

    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Operation failed");

      const wasEdit = isEditMode;
      resetForm();
      setIsModalOpen(false);
      setMsg(wasEdit ? 'User updated successfully!' : 'User created successfully!');

      fetchUsers();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">

      {/* --- USER LIST --- */}
      <div className="bg-white p-6 rounded shadow border border-gray-200 max-w-6xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Manage Users
          </h2>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Create User
          </button>
        </div>

        {msg && <div className={`p-3 mb-4 rounded ${msg.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">Sl. No.</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Jurisdiction</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-4 text-center">No users found.</td></tr>
              ) : (
                users.map((u, index) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'deo' ? 'bg-blue-100 text-blue-800' :
                          u.role === 'meo' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">{u.full_name}</td>
                    <td className="px-4 py-3 text-xs">
                      {u.district_name && <div>Dist: {u.district_name}</div>}
                      {u.mandal_name && <div>Mandal: {u.mandal_name}</div>}
                      {u.school_name && <div>School: {u.school_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(u)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">{isEditMode ? 'Edit User' : 'Create New User'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  {getAllowedRoles().map(r => <option key={r.val} value={r.val}>{r.label}</option>)}
                </select>
              </div>

              {/* --- DYNAMIC DROPDOWNS --- */}

              {/* District Dropdown (Admin Only) */}
              {['admin'].includes(currentUser.role) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select District</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={formData.district_id}
                    onChange={e => setFormData({ ...formData, district_id: e.target.value, mandal_id: '', school_id: '' })}
                    required
                  >
                    <option value="">-- Select District --</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}

              {/* Mandal Dropdown (Admin & DEO) - Hidden if creating DEO */}
              {['admin', 'deo'].includes(currentUser.role) && formData.role !== 'deo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Mandal</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={formData.mandal_id}
                    onChange={e => setFormData({ ...formData, mandal_id: e.target.value, school_id: '' })}
                    required={formData.role !== 'deo'}
                    disabled={!formData.district_id && currentUser.role === 'admin'}
                  >
                    <option value="">-- Select Mandal --</option>
                    {mandals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              )}

              {/* School Dropdown (Admin, DEO, MEO) - Visible only if creating School Admin */}
              {formData.role === 'school_admin' && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select School</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={formData.school_id}
                    onChange={e => setFormData({ ...formData, school_id: e.target.value })}
                    required
                    disabled={(!formData.mandal_id && ['admin', 'deo'].includes(currentUser.role))}
                  >
                    <option value="">-- Select School --</option>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {/* Basic Creds */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" required
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password {isEditMode && '(Leave blank to keep current)'}</label>
                <input type="password" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" required={!isEditMode}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" required
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="col-span-2 flex gap-2 pt-4 border-t border-gray-100 mt-2 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                  {isEditMode ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageUsers;