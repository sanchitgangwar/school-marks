import { useState, useEffect } from 'react';
import { MapPin, Edit, Trash2, Plus, Search } from 'lucide-react';

const ManageMandals = ({ currentUser }) => {
    const [districts, setDistricts] = useState([]);
    const [mandals, setMandals] = useState([]);

    const [selectedDistrict, setSelectedDistrict] = useState(currentUser.district_id || '');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMandal, setEditingMandal] = useState(null);
    const [msg, setMsg] = useState('');

    const token = localStorage.getItem('authToken');
    const apiUrl = import.meta.env.VITE_API_URL;

    // Permissions
    const isDistrictLocked = currentUser.role !== 'admin';

    // Initial Form State
    const initialFormState = {
        name: '',
        name_telugu: '',
        district_id: ''
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

    // 2. Fetch Mandals when District is selected
    useEffect(() => {
        if (selectedDistrict) {
            fetchMandals();
        } else {
            setMandals([]);
        }
    }, [selectedDistrict]);

    const fetchMandals = () => {
        fetch(`${apiUrl}/api/entities/mandals?district_id=${selectedDistrict}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(setMandals);
    };

    // 3. Handlers
    const handleAddClick = () => {
        setEditingMandal(null);
        setFormData({ ...initialFormState, district_id: selectedDistrict });
        setIsModalOpen(true);
        setMsg('');
    };

    const handleEditClick = (mandal) => {
        setEditingMandal(mandal);
        setFormData({
            name: mandal.name,
            name_telugu: mandal.name_telugu || '',
            district_id: mandal.district_id
        });
        setIsModalOpen(true);
        setMsg('');
    };

    const handleDeleteClick = async (id) => {
        if (!confirm('Are you sure you want to delete this mandal?')) return;
        try {
            const res = await fetch(`${apiUrl}/api/entities/mandals/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchMandals();
            } else {
                alert('Failed to delete mandal');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting mandal');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Use generic PUT for update, and specific add endpoint for creation as per previous pattern
        const endpoint = editingMandal
            ? `${apiUrl}/api/entities/mandals/${editingMandal.id}`
            : `${apiUrl}/api/entities/mandals/add`;

        const method = editingMandal ? 'PUT' : 'POST';

        try {
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to save');

            setIsModalOpen(false);
            fetchMandals();
            setMsg(editingMandal ? 'Mandal updated successfully' : 'Mandal added successfully');
        } catch (err) {
            console.error(err);
            setMsg('Error saving mandal');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Mandals</h2>

            {/* SELECTION FILTERS */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 max-w-md">
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
            </div>

            {/* MANDAL LIST */}
            {selectedDistrict ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Mandals List
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{mandals.length}</span>
                        </h3>
                        <button
                            onClick={handleAddClick}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition"
                        >
                            <Plus className="w-4 h-4" /> Add Mandal
                        </button>
                    </div>

                    {mandals.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No mandals found in this district.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                    <tr>
                                        <th className="p-3 w-16">Sl. No.</th>
                                        <th className="p-3">Mandal Name</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {mandals.map((mandal, index) => (
                                        <tr key={mandal.id} className="hover:bg-gray-50">
                                            <td className="p-3 text-gray-500">{index + 1}</td>
                                            <td className="p-3 font-medium text-gray-800">
                                                {mandal.name}
                                                {mandal.name_telugu && <span className="block text-xs text-gray-500">{mandal.name_telugu}</span>}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditClick(mandal)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(mandal.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
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
                    <p>Please select a district to view mandals.</p>
                </div>
            )}

            {/* ADD/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">{editingMandal ? 'Edit Mandal' : 'Add New Mandal'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {msg && <div className="p-2 bg-red-50 text-red-600 text-sm rounded">{msg}</div>}

                            <div>
                                <label className="block text-sm font-medium mb-1">Mandal Name (English)</label>
                                <input
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mandal Name (Telugu)</label>
                                <input
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name_telugu}
                                    onChange={e => setFormData({ ...formData, name_telugu: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Mandal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageMandals;
