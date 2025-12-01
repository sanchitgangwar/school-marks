import { useState, useEffect } from 'react';
import { FileText, Edit, Trash2, Plus } from 'lucide-react';

const ManageTests = () => {
    const [exams, setExams] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [msg, setMsg] = useState('');

    const token = localStorage.getItem('authToken');
    const apiUrl = import.meta.env.VITE_API_URL;

    // Initial Form State
    const initialFormState = {
        name: '',
        name_telugu: '',
        exam_code: '',
        start_date: '',
        end_date: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    // 1. Load Initial Data (Exams)
    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = () => {
        fetch(`${apiUrl}/api/entities/exams`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(setExams);
    };

    // 2. Handlers
    const handleAddClick = () => {
        setEditingExam(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
        setMsg('');
    };

    const handleEditClick = (exam) => {
        setEditingExam(exam);
        setFormData({
            name: exam.name,
            name_telugu: exam.name_telugu,
            exam_code: exam.exam_code,
            start_date: exam.start_date ? exam.start_date.split('T')[0] : '',
            end_date: exam.end_date ? exam.end_date.split('T')[0] : ''
        });
        setIsModalOpen(true);
        setMsg('');
    };

    const handleDeleteClick = async (id) => {
        if (!confirm('Are you sure you want to delete this exam?')) return;
        try {
            const res = await fetch(`${apiUrl}/api/entities/exams/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchExams();
            } else {
                alert('Failed to delete exam');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting exam');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = editingExam
            ? `${apiUrl}/api/entities/exams/${editingExam.id}`
            : `${apiUrl}/api/entities/exams/add`;

        const method = editingExam ? 'PUT' : 'POST';

        try {
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to save');

            setIsModalOpen(false);
            fetchExams();
            setMsg(editingExam ? 'Exam updated successfully' : 'Exam added successfully');
        } catch (err) {
            console.error(err);
            setMsg('Error saving exam');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Tests</h2>

            {/* EXAM LIST */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Exams List
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{exams.length}</span>
                    </h3>
                    <button
                        onClick={handleAddClick}
                        className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition"
                    >
                        <Plus className="w-4 h-4" /> Add Exam
                    </button>
                </div>

                {exams.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No exams found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                <tr>
                                    <th className="p-3 w-16">Sl. No.</th>
                                    <th className="p-3">Exam Name</th>
                                    <th className="p-3">Code</th>
                                    <th className="p-3">Start Date</th>
                                    <th className="p-3">End Date</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {exams.map((exam, index) => (
                                    <tr key={exam.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-gray-500">{index + 1}</td>
                                        <td className="p-3 font-medium text-gray-800">
                                            {exam.name}
                                            {exam.name_telugu && <span className="block text-xs text-gray-500">{exam.name_telugu}</span>}
                                        </td>
                                        <td className="p-3 font-mono text-gray-600">{exam.exam_code}</td>
                                        <td className="p-3 text-gray-600">{exam.start_date ? new Date(exam.start_date).toLocaleDateString() : '-'}</td>
                                        <td className="p-3 text-gray-600">{exam.end_date ? new Date(exam.end_date).toLocaleDateString() : '-'}</td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEditClick(exam)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteClick(exam.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
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
                            <h3 className="font-bold text-lg text-gray-800">{editingExam ? 'Edit Exam' : 'Add New Exam'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {msg && <div className="p-2 bg-red-50 text-red-600 text-sm rounded">{msg}</div>}

                            <div>
                                <label className="block text-sm font-medium mb-1">Exam Name</label>
                                <input
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. Quarterly Exams 2025"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Exam Name in Telugu</label>
                                <input
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name_telugu}
                                    onChange={e => setFormData({ ...formData, name_telugu: e.target.value })}
                                    required
                                    placeholder="e.g. త్రైమాసిక పరీక్షలు 2025"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Exam Code</label>
                                <input
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.exam_code}
                                    onChange={e => setFormData({ ...formData, exam_code: e.target.value })}
                                    required
                                    placeholder="e.g. Q1-2024-GLOBAL"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.end_date}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Exam</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTests;
