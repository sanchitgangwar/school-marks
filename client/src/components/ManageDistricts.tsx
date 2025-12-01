import { useState, useEffect } from 'react';
import { Map, Edit, Trash2, Plus } from 'lucide-react';

const ManageDistricts = () => {
    const [districts, setDistricts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDistrict, setEditingDistrict] = useState(null);
    const [msg, setMsg] = useState('');

    const token = localStorage.getItem('authToken');
    const apiUrl = import.meta.env.VITE_API_URL;

    // Initial Form State
    const initialFormState = {
        name: '',
        state: 'Telangana' // Hardcoded as per previous implementation
    };
    const [formData, setFormData] = useState(initialFormState);

    // 1. Load Initial Data (Districts)
    useEffect(() => {
        fetchDistricts();
    }, []);

    const fetchDistricts = () => {
        fetch(`${apiUrl}/api/entities/districts`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(setDistricts);
    };

    // 2. Handlers
    const handleAddClick = () => {
        setEditingDistrict(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
        setMsg('');
    };

    const handleEditClick = (district) => {
        setEditingDistrict(district);
        setFormData({
            name: district.name,
            state: district.state || 'Telangana'
        });
        setIsModalOpen(true);
        setMsg('');
    };

    const handleDeleteClick = async (id) => {
        if (!confirm('Are you sure you want to delete this district?')) return;
        try {
            const res = await fetch(`${apiUrl}/api/entities/districts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchDistricts();
            } else {
                alert('Failed to delete district');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting district');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = editingDistrict
            ? `${apiUrl}/api/entities/districts/${editingDistrict.id}`
            : `${apiUrl}/api/entities/districts/add`;

        const method = editingDistrict ? 'PUT' : 'POST';

        try {
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to save');

            setIsModalOpen(false);
            fetchDistricts();
            setMsg(editingDistrict ? 'District updated successfully' : 'District added successfully');
        } catch (err) {
            console.error(err);
            setMsg('Error saving district');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Districts</h2>

            {/* DISTRICT LIST */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Map className="w-4 h-4" /> Districts List
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{districts.length}</span>
                    </h3>
                    <button
                        onClick={handleAddClick}
                        className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition"
                    >
                        <Plus className="w-4 h-4" /> Add District
                    </button>
                </div>

                {districts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No districts found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                <tr>
                                    <th className="p-3 w-16">Sl. No.</th>
                                    <th className="p-3">District Name</th>
                                    <th className="p-3">State</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {districts.map((district, index) => (
                                    <tr key={district.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-gray-500">{index + 1}</td>
                                        <td className="p-3 font-medium text-gray-800">{district.name}</td>
                                        <td className="p-3 text-gray-600">{district.state || 'Telangana'}</td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEditClick(district)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteClick(district.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
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

            {/* ADD/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">{editingDistrict ? 'Edit District' : 'Add New District'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {msg && <div className="p-2 bg-red-50 text-red-600 text-sm rounded">{msg}</div>}

                            <div>
                                <label className="block text-sm font-medium mb-1">District Name</label>
                                <input
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. Hyderabad"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">State</label>
                                <input
                                    className="w-full p-2 border rounded bg-gray-100 text-gray-500 cursor-not-allowed"
                                    value={formData.state}
                                    disabled
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save District</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageDistricts;
