import { useState, useEffect } from 'react';
import { Building, Edit, Trash2, Plus, Search } from 'lucide-react';

const ManageSchools = ({ currentUser }) => {
    const [districts, setDistricts] = useState([]);
    const [mandals, setMandals] = useState([]);
    const [schools, setSchools] = useState([]);

    const [selectedDistrict, setSelectedDistrict] = useState(currentUser.district_id || '');
    const [selectedMandal, setSelectedMandal] = useState(currentUser.mandal_id || '');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchool, setEditingSchool] = useState(null);
    const [msg, setMsg] = useState('');

    const token = localStorage.getItem('authToken');
    const apiUrl = import.meta.env.VITE_API_URL;

    // Permissions
    const isDistrictLocked = currentUser.role !== 'admin';
    const isMandalLocked = ['school_admin', 'meo'].includes(currentUser.role) || (!selectedDistrict && currentUser.role === 'admin');

    // Initial Form State
    const initialFormState = {
        name: '',
        name_telugu: '',
        udise_code: '',
        address: '',
        address_telugu: '',
        district_id: '',
        mandal_id: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    // 1. Load Initial Data (Districts)
    useEffect(() => {
        fetch(`${apiUrl}/api/entities/districts`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                setDistricts(data);
                if (currentUser.district_id) setSelectedDistrict(currentUser.district_id);
            });
    }, []);

    // 2. Cascading Dropdowns
    useEffect(() => {
        if (selectedDistrict) {
            fetch(`${apiUrl}/api/entities/mandals?district_id=${selectedDistrict}`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(setMandals);
        } else {
            setMandals([]);
        }
    }, [selectedDistrict]);

    // 3. Fetch Schools when Mandal is selected
    useEffect(() => {
        if (selectedMandal) {
            fetchSchools();
        } else {
            setSchools([]);
        }
    }, [selectedMandal]);

    const fetchSchools = () => {
        fetch(`${apiUrl}/api/entities/schools?mandal_id=${selectedMandal}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(setSchools);
    };

    // 4. Handlers
    const handleAddClick = () => {
        setEditingSchool(null);
        setFormData({ ...initialFormState, district_id: selectedDistrict, mandal_id: selectedMandal });
        setIsModalOpen(true);
        setMsg('');
    };

    const handleEditClick = (school) => {
        setEditingSchool(school);
        setFormData({
            name: school.name,
            name_telugu: school.name_telugu || '',
            udise_code: school.udise_code,
            address: school.address || '',
            address_telugu: school.address_telugu || '',
            district_id: school.district_id,
            mandal_id: school.mandal_id
        });
        setIsModalOpen(true);
        setMsg('');
    };

    const handleDeleteClick = async (id) => {
        if (!confirm('Are you sure you want to delete this school?')) return;
        try {
            const res = await fetch(`${apiUrl}/api/entities/schools/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchSchools();
            } else {
                alert('Failed to delete school');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting school');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = editingSchool
            ? `${apiUrl}/api/entities/schools/${editingSchool.id}`
            : `${apiUrl}/api/schools/create`; // Use specific create endpoint for schools if generic doesn't support custom logic, but generic PUT is fine for edit. 
        // Actually, for consistency, let's check if we can use generic POST. 
        // The previous AddSchoolForm used /api/schools/create. Let's stick to that for creation to be safe, or generic if available.
        // The user instructions said "Change AddSchoolForm to list schools... then allow user to edit, delete, or add".
        // I'll use the generic PUT for update and the existing /api/schools/create for creation as it might have specific logic.

        const method = editingSchool ? 'PUT' : 'POST';

        try {
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to save');

            setIsModalOpen(false);
            fetchSchools();
            setMsg(editingSchool ? 'School updated successfully' : 'School added successfully');
        } catch (err) {
            console.error(err);
            setMsg('Error saving school');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Schools</h2>

            {/* SELECTION FILTERS */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="district-select" className="block text-xs font-bold uppercase text-gray-500 mb-1">District</label>
                    <select
                        id="district-select"
                        className={`w-full p-2 border rounded text-sm ${isDistrictLocked ? 'bg-gray-100' : 'bg-white'}`}
                        value={selectedDistrict}
                        onChange={e => setSelectedDistrict(e.target.value)}
                        disabled={isDistrictLocked}
                    >
                        <option value="">Select District</option>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="mandal-select" className="block text-xs font-bold uppercase text-gray-500 mb-1">Mandal</label>
                    <select
                        id="mandal-select"
                        className={`w-full p-2 border rounded text-sm ${isMandalLocked ? 'bg-gray-100' : 'bg-white'}`}
                        value={selectedMandal}
                        onChange={e => setSelectedMandal(e.target.value)}
                        disabled={isMandalLocked}
                    >
                        <option value="">Select Mandal</option>
                        {mandals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            </div>

            {/* SCHOOL LIST */}
            {selectedMandal ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <Building className="w-4 h-4" /> Schools List
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{schools.length}</span>
                        </h3>
                        <button
                            onClick={handleAddClick}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition"
                        >
                            <Plus className="w-4 h-4" /> Add School
                        </button>
                    </div>

                    {schools.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No schools found in this mandal.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                    <tr>
                                        <th className="p-3 w-16">Sl. No.</th>
                                        <th className="p-3">UDISE Code</th>
                                        <th className="p-3">School Name</th>
                                        <th className="p-3">Address</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {schools.map((school, index) => (
                                        <tr key={school.id} className="hover:bg-gray-50">
                                            <td className="p-3 text-gray-500">{index + 1}</td>
                                            <td className="p-3 font-mono text-gray-600">{school.udise_code}</td>
                                            <td className="p-3 font-medium text-gray-800">
                                                {school.name}
                                                {school.name_telugu && <span className="block text-xs text-gray-500">{school.name_telugu}</span>}
                                            </td>
                                            <td className="p-3 text-gray-600">
                                                {school.address}
                                                {school.address_telugu && <span className="block text-xs text-gray-400">{school.address_telugu}</span>}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditClick(school)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(school.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Please select a district and mandal to view schools.</p>
                </div>
            )}

            {/* ADD/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">{editingSchool ? 'Edit School' : 'Add New School'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {msg && <div className="p-2 bg-red-50 text-red-600 text-sm rounded">{msg}</div>}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">School Name (English)</label>
                                    <input
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">School Name (Telugu)</label>
                                    <input
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.name_telugu}
                                        onChange={e => setFormData({ ...formData, name_telugu: e.target.value })}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">UDISE Code</label>
                                <input
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.udise_code}
                                    onChange={e => setFormData({ ...formData, udise_code: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Address (English)</label>
                                    <input
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Address (Telugu)</label>
                                    <input
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.address_telugu}
                                        onChange={e => setFormData({ ...formData, address_telugu: e.target.value })}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save School</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageSchools;
