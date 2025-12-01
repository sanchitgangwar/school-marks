import { useState, useEffect } from 'react';
import { Edit, Trash2, Search, Plus } from 'lucide-react';

const ManageStudents = ({ currentUser }) => {
    // Selection State
    const [selectedDistrict, setSelectedDistrict] = useState(currentUser.district_id || '');
    const [selectedMandal, setSelectedMandal] = useState(currentUser.mandal_id || '');
    const [selectedSchool, setSelectedSchool] = useState(currentUser.school_id || '');

    // Data Lists
    const [districts, setDistricts] = useState([]);
    const [mandals, setMandals] = useState([]);
    const [schools, setSchools] = useState([]);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentStudentId, setCurrentStudentId] = useState(null);
    const [msg, setMsg] = useState('');

    // Form State
    const initialFormState = {
        name: '',
        name_telugu: '',
        gender: 'Male',
        pen_number: '',
        date_of_birth: '',
        parent_phone: '',
        class_id: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    const token = localStorage.getItem('authToken');
    const apiUrl = import.meta.env.VITE_API_URL;

    // 1. Initial Fetch (Districts & Classes)
    useEffect(() => {
        fetch(`${apiUrl}/api/entities/districts`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(setDistricts);

        fetch(`${apiUrl}/api/entities/classes`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setClasses(Array.isArray(data) ? data : []));
    }, []);

    // 2. Cascading Dropdowns
    useEffect(() => {
        if (selectedDistrict) {
            fetch(`${apiUrl}/api/entities/mandals?district_id=${selectedDistrict}`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => {
                    setMandals(data);
                });
        } else {
            setMandals([]);
        }
    }, [selectedDistrict]);

    useEffect(() => {
        if (selectedMandal) {
            fetch(`${apiUrl}/api/entities/schools?mandal_id=${selectedMandal}`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(setSchools);
        } else {
            setSchools([]);
        }
    }, [selectedMandal]);

    // 3. Fetch Students when School is Selected
    useEffect(() => {
        if (selectedSchool) {
            fetchStudents();
        } else {
            setStudents([]);
        }
    }, [selectedSchool]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/entities/students?school_id=${selectedSchool}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStudents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch students", err);
        } finally {
            setLoading(false);
        }
    };

    // 4. Handlers
    const handleAddClick = () => {
        setEditMode(false);
        setFormData(initialFormState);
        setShowModal(true);
        setMsg('');
    };

    const handleEditClick = (student) => {
        setEditMode(true);
        setCurrentStudentId(student.id);
        setFormData({
            name: student.name,
            name_telugu: student.name_telugu || '',
            gender: student.gender || 'Male',
            pen_number: student.pen_number,
            date_of_birth: student.date_of_birth ? student.date_of_birth.split('T')[0] : '',
            parent_phone: student.parent_phone,
            class_id: student.class_id
        });
        setShowModal(true);
        setMsg('');
    };

    const handleDeleteClick = async (id) => {
        if (!window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) return;

        try {
            const res = await fetch(`${apiUrl}/api/entities/students/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setStudents(prev => prev.filter(s => s.id !== id));
            } else {
                alert("Failed to delete student");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting student");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg('');

        const payload = {
            ...formData,
            district_id: selectedDistrict,
            mandal_id: selectedMandal,
            school_id: selectedSchool
        };

        try {
            const url = editMode
                ? `${apiUrl}/api/entities/students/${currentStudentId}`
                : `${apiUrl}/api/entities/students/add`;

            const method = editMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Operation failed");

            const savedStudent = await res.json();

            if (editMode) {
                setStudents(prev => prev.map(s => s.id === savedStudent.id ? savedStudent : s));
                setMsg('Student updated successfully!');
            } else {
                setStudents(prev => [...prev, savedStudent]);
                setMsg('Student added successfully!');
                setFormData(initialFormState); // Reset form for next add
            }

            // Close modal after short delay or immediately? Let's keep it open for "Add Another" flow if adding, close if editing?
            // For now, let's close it after success to keep it simple.
            setTimeout(() => setShowModal(false), 1000);

        } catch (err) {
            setMsg(`Error: ${err.message}`);
        }
    };

    // Permissions
    const isDistrictLocked = currentUser.role !== 'admin';
    const isMandalLocked = ['school_admin', 'meo'].includes(currentUser.role) || !selectedDistrict;
    const isSchoolLocked = currentUser.role === 'school_admin' || !selectedMandal;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Students</h2>

            {/* SELECTION FILTERS */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                    <label htmlFor="school-select" className="block text-xs font-bold uppercase text-gray-500 mb-1">School</label>
                    <select
                        id="school-select"
                        className={`w-full p-2 border rounded text-sm ${isSchoolLocked ? 'bg-gray-100' : 'bg-white'}`}
                        value={selectedSchool}
                        onChange={e => setSelectedSchool(e.target.value)}
                        disabled={isSchoolLocked}
                    >
                        <option value="">Select School</option>
                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            {/* STUDENT LIST */}
            {selectedSchool ? (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-700">Students List ({students.length})</h3>
                        <button
                            onClick={handleAddClick}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" /> Add Student
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading students...</div>
                    ) : students.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No students found in this school.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                    <tr>
                                        <th className="p-3 w-16">Sl. No.</th>
                                        <th className="p-3">PEN Number</th>
                                        <th className="p-3">Student Name</th>
                                        <th className="p-3">Class</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {students.map((student, index) => {
                                        const studentClass = classes.find(c => c.id === student.class_id);
                                        return (
                                            <tr key={student.id} className="hover:bg-gray-50">
                                                <td className="p-3 text-gray-500">{index + 1}</td>
                                                <td className="p-3 font-mono text-gray-600">{student.pen_number}</td>
                                                <td className="p-3 font-medium text-gray-800">
                                                    {student.name}
                                                    {student.name_telugu && <span className="block text-xs text-gray-500">{student.name_telugu}</span>}
                                                </td>
                                                <td className="p-3 text-gray-600">
                                                    {studentClass ? `Grade ${studentClass.grade_level}` : 'N/A'}
                                                </td>
                                                <td className="p-3 text-right flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(student)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(student.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
                    <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p>Please select a school to view and manage students.</p>
                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">
                                {editMode ? 'Edit Student' : 'Add New Student'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>

                        <div className="p-6">
                            {msg && (
                                <div className={`mb-4 p-3 rounded text-sm ${msg.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                    {msg}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Student Name (English)</label>
                                        <input
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-100 outline-none"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Student Name (Telugu)</label>
                                        <input
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-100 outline-none"
                                            value={formData.name_telugu}
                                            onChange={e => setFormData({ ...formData, name_telugu: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">PEN Number</label>
                                        <input
                                            className="w-full p-2 border rounded font-mono focus:ring-2 focus:ring-blue-100 outline-none"
                                            value={formData.pen_number}
                                            onChange={e => setFormData({ ...formData, pen_number: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Class</label>
                                        <select
                                            className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                                            value={formData.class_id}
                                            onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>Grade {c.grade_level}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Gender</label>
                                        <select
                                            className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                                            value={formData.gender}
                                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-100 outline-none"
                                            value={formData.date_of_birth}
                                            onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1">Parent Phone</label>
                                        <input
                                            type="tel"
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-100 outline-none"
                                            value={formData.parent_phone}
                                            onChange={e => setFormData({ ...formData, parent_phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700"
                                    >
                                        {editMode ? 'Update Student' : 'Save Student'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default ManageStudents;
