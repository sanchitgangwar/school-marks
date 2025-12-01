import { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Upload, Loader } from 'lucide-react';

// ==========================================
// 1. BULK UPLOAD COMPONENT (Updated with Subject)
// ==========================================
const BulkUploadMarks = ({ user }) => {
  const [context, setContext] = useState({
    district_id: user.district_id || '',
    mandal_id: user.mandal_id || '',
    school_id: user.school_id || '',
    exam_id: '',
    subject_id: ''
  });

  const [lists, setLists] = useState({ districts: [], mandals: [], schools: [], exams: [], subjects: [], students: [], classes: [] });
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [logs, setLogs] = useState([]);
  const token = localStorage.getItem('authToken');

  // --- DROPDOWN FETCHES ---
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/entities/districts`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json()).then(data => setLists(p => ({ ...p, districts: Array.isArray(data) ? data : [] })));
  }, []);

  useEffect(() => {
    if (context.district_id) {
      fetch(`${import.meta.env.VITE_API_URL}/api/entities/mandals?district_id=${context.district_id}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json()).then(data => setLists(p => ({ ...p, mandals: Array.isArray(data) ? data : [] })));
    }
  }, [context.district_id]);

  useEffect(() => {
    if (context.mandal_id) {
      fetch(`${import.meta.env.VITE_API_URL}/api/entities/schools?mandal_id=${context.mandal_id}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json()).then(data => setLists(p => ({ ...p, schools: Array.isArray(data) ? data : [] })));
    }
  }, [context.mandal_id]);

  useEffect(() => {
    if (context.school_id) {
      const h = { 'Authorization': `Bearer ${token}` };
      fetch(`${import.meta.env.VITE_API_URL}/api/entities/exams?school_id=${context.school_id}`, { headers: h })
        .then(res => res.json()).then(data => setLists(p => ({ ...p, exams: Array.isArray(data) ? data : [] })));

      fetch(`${import.meta.env.VITE_API_URL}/api/entities/subjects`, { headers: h })
        .then(res => res.json()).then(data => setLists(p => ({ ...p, subjects: Array.isArray(data) ? data : [] })));

      // Fetch Classes (Global) to map IDs to Names
      fetch(`${import.meta.env.VITE_API_URL}/api/entities/classes`, { headers: h })
        .then(res => res.json()).then(data => setLists(p => ({ ...p, classes: Array.isArray(data) ? data : [] })));

      fetch(`${import.meta.env.VITE_API_URL}/api/entities/students?school_id=${context.school_id}`, { headers: h })
        .then(res => res.json()).then(data => setLists(p => ({ ...p, students: Array.isArray(data) ? data : [] })));
    }
  }, [context.school_id]);


  // --- 2. SMART TEMPLATE GENERATOR ---
  const downloadTemplate = () => {
    const activeSchool = lists.schools.find(s => s.id === context.school_id) || { name: 'SCHOOL_NAME', udise_code: 'UDISE' };
    const activeExam = lists.exams.find(e => e.id === context.exam_id) || { name: 'TEST_NAME' };

    const isAllSubjects = context.subject_id === 'all';
    const activeSubject = !isAllSubjects ? lists.subjects.find(s => s.id === context.subject_id) : null;

    // Base Headers
    let headers = [
      'SCHOOL_NAME', 'UDISE_CODE', 'TEST_NAME',
      'PEN_NUMBER', 'STUDENT_NAME', 'CLASS'
    ];

    if (isAllSubjects) {
      // Add column for EACH subject
      lists.subjects.forEach(sub => {
        const baseName = sub.name.toUpperCase().replace(/\s+/g, '_');
        headers.push(baseName);          // Marks Column
        headers.push(`${baseName}_GRADE`); // Grade Column
      });
    } else {
      // Single Subject Columns
      headers.push('SUBJECT_NAME', 'MARKS_OBTAINED', 'MAX_MARKS', 'GRADE');
    }

    let rows = [];

    if (lists.students.length > 0) {
      rows = lists.students.map(s => {
        const cls = lists.classes.find(c => c.id === s.class_id);
        const className = cls ? `Grade ${cls.grade_level}` : '';

        const row = [
          `"${activeSchool.name}"`,
          `"${activeSchool.udise_code}"`,
          `"${activeExam.name}"`,
          `"${s.pen_number}"`,
          `"${s.name}"`,
          `"${className}"`
        ];

        if (isAllSubjects) {
          // Empty columns for each subject (Marks + Grade)
          lists.subjects.forEach(() => {
            row.push(''); // Marks
            row.push(''); // Grade
          });
        } else {
          // Single Subject Pre-fill
          row.push(`"${activeSubject?.name || ''}"`, '', '100', '');
        }
        return row;
      });
    } else {
      // Dummy Row
      const row = ['"ZPHS"', '"361450"', '"Q1"', '"220349"', '"Ravi"', '"Grade 10"'];
      if (isAllSubjects) {
        lists.subjects.forEach(() => {
          row.push(''); // Marks
          row.push(''); // Grade
        });
      } else {
        row.push(`"${activeSubject?.name || 'Math'}"`, '85', '100', 'A2');
      }
      rows = [row];
    }

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Marks_${isAllSubjects ? 'All_Subjects' : (activeSubject?.name || 'Subject')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 3. FILE PARSING ---
  const handleFileUpload = async () => {
    if (!file || !context.exam_id) {
      setLogs(["Error: Please select Exam, Subject and File."]);
      return;
    }
    setUploadStatus('processing');
    setLogs(["Reading file..."]);

    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target.result;
      const rows = String(text).split("\n").map(row => {
        const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        return matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : [];
      });

      // Header Row (Index 0)
      const headerRow = rows[0];
      const isAllSubjectsMode = context.subject_id === 'all';

      // Identify Subject Columns if in All Subjects mode
      const subjectColumnMap = {}; // { index: { subjectId, type: 'marks' | 'grade' } }

      if (isAllSubjectsMode) {
        headerRow.forEach((col, idx) => {
          if (idx > 5) { // Skip first 6 static columns
            const colName = col.toUpperCase();
            const isGradeCol = colName.endsWith('_GRADE');
            const baseName = isGradeCol ? colName.replace('_GRADE', '') : colName;
            const subName = baseName.replace(/_/g, ' ');

            const subject = lists.subjects.find(s => s.name.toLowerCase() === subName.toLowerCase());
            if (subject) {
              subjectColumnMap[idx] = {
                subjectId: subject.id,
                type: isGradeCol ? 'grade' : 'marks'
              };
            }
          }
        });

        if (Object.keys(subjectColumnMap).length === 0) {
          setUploadStatus('error');
          setLogs(["Error: Could not identify any subject columns in the CSV header."]);
          return;
        }
      }

      const dataRows = rows.slice(1).filter(r => r.length >= 4 && r[3]);

      const payloadBatch = [];
      const errorLogs = [];

      dataRows.forEach((row, idx) => {
        // 0:School, 1:UDISE, 2:Test, 3:PEN, 4:Name, 5:Class
        const pen = row[3];

        const student = lists.students.find(s => s.pen_number === pen);
        if (!student) {
          errorLogs.push(`Row ${idx + 2}: Student PEN '${pen}' not found.`);
          return;
        }

        if (isAllSubjectsMode) {
          // Group data by subject for this row
          const rowDataBySubject: Record<number, { marks?: string; grade?: string }> = {}; // { subjectId: { marks, grade } }

          for (const [colIdx, info] of Object.entries(subjectColumnMap)) {
            const val = row[colIdx];
            if (val !== undefined && typeof info === 'object' && 'subjectId' in info && 'type' in info) {
              const typedInfo = info as { subjectId: number; type: 'marks' | 'grade' };
              if (!rowDataBySubject[typedInfo.subjectId]) rowDataBySubject[typedInfo.subjectId] = {};
              rowDataBySubject[typedInfo.subjectId][typedInfo.type] = val.trim();
            }
          }

          // Process each subject found in this row
          for (const [subId, data] of Object.entries(rowDataBySubject)) {
            const marksStr = data.marks;
            const gradeStr = data.grade || '';

            if (marksStr && marksStr !== '') {
              if (isNaN(parseFloat(marksStr))) {
                errorLogs.push(`Row ${idx + 2}: Invalid marks '${marksStr}' for subject ID ${subId}.`);
                continue;
              }
              payloadBatch.push({
                student_id: student.id,
                subject_id: subId,
                marks: parseFloat(marksStr),
                max_marks: 100,
                grade: gradeStr
              });
            }
          }

        } else {
          // Single Subject Mode
          // 6:Subject, 7:Marks, 8:Max, 9:Grade
          const subName = row[6];
          const marks = row[7];
          const max = row[8];
          const grade = row[9] || '';

          let subjectId = lists.subjects.find(s => s.name.toLowerCase() === subName?.toLowerCase())?.id;
          if (!subjectId && context.subject_id) subjectId = context.subject_id;

          if (!subjectId) {
            errorLogs.push(`Row ${idx + 2}: Subject '${subName}' unknown.`);
            return;
          }

          if (isNaN(parseFloat(marks)) || marks === '') {
            if (marks !== '') errorLogs.push(`Row ${idx + 2}: Invalid marks '${marks}'.`);
            return;
          }

          payloadBatch.push({
            student_id: student.id,
            subject_id: subjectId,
            marks: parseFloat(marks),
            max_marks: parseFloat(max) || 100,
            grade: grade
          });
        }
      });

      if (payloadBatch.length === 0) {
        setUploadStatus('error');
        setLogs(["No valid data rows found.", ...errorLogs]);
        return;
      }

      const groupedBySubject = {};
      payloadBatch.forEach(item => {
        if (!groupedBySubject[item.subject_id]) groupedBySubject[item.subject_id] = [];
        groupedBySubject[item.subject_id].push(item);
      });

      setLogs(prev => [...prev, `Found ${payloadBatch.length} valid marks. Uploading...`]);

      try {
        for (const [subId, marksData] of Object.entries(groupedBySubject)) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/marks/bulk-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              exam_id: context.exam_id,
              subject_id: subId,
              marks_data: marksData
            })
          });
          if (!res.ok) throw new Error("API Error");
        }
        setUploadStatus('success');
        setLogs(prev => [...prev, "Success! Database updated.", ...errorLogs]);
      } catch (err) {
        setUploadStatus('error');
        setLogs(prev => [...prev, "Server Error.", ...errorLogs]);
      }
    };

    reader.readAsText(file);
  };

  const isDistrictLocked = user.role !== 'admin';
  const isMandalLocked = ['school_admin', 'meo'].includes(user.role) || !context.district_id;
  const isSchoolLocked = user.role === 'school_admin' || !context.mandal_id;

  return (
    <div className="bg-white p-6 rounded shadow border border-gray-200 max-w-4xl">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <FileSpreadsheet className="h-6 w-6 text-green-600" /> Bulk Upload Marks
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: Context Selection */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-700 border-b pb-2">1. Select Context</h3>

          <div>
            <label htmlFor="district-select" className="text-xs font-bold text-gray-500 uppercase">District</label>
            <select id="district-select" className={`w-full p-2 border rounded ${isDistrictLocked ? 'bg-gray-100' : ''}`} value={context.district_id} onChange={e => setContext({ ...context, district_id: e.target.value })} disabled={isDistrictLocked}>
              <option value="">Select District</option>
              {lists.districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="mandal-select" className="text-xs font-bold text-gray-500 uppercase">Mandal</label>
            <select id="mandal-select" className={`w-full p-2 border rounded ${isMandalLocked ? 'bg-gray-100' : ''}`} value={context.mandal_id} onChange={e => setContext({ ...context, mandal_id: e.target.value })} disabled={isMandalLocked}>
              <option value="">Select Mandal</option>
              {lists.mandals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="school-select" className="text-xs font-bold text-gray-500 uppercase">School</label>
            <select id="school-select" className={`w-full p-2 border rounded ${isSchoolLocked ? 'bg-gray-100' : ''}`} value={context.school_id} onChange={e => setContext({ ...context, school_id: e.target.value })} disabled={isSchoolLocked}>
              <option value="">Select School</option>
              {lists.schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="exam-select" className="text-xs font-bold text-gray-500 uppercase">Test / Exam</label>
            <select id="exam-select" className="w-full p-2 border rounded" value={context.exam_id} onChange={e => setContext({ ...context, exam_id: e.target.value })} disabled={!context.school_id}>
              <option value="">Select Exam</option>
              {lists.exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="subject-select" className="text-xs font-bold text-gray-500 uppercase">Subject</label>
            <select id="subject-select" className="w-full p-2 border rounded" value={context.subject_id} onChange={e => setContext({ ...context, subject_id: e.target.value })} disabled={!context.school_id}>
              <option value="">Select Subject</option>
              <option value="all" className="font-bold text-blue-600">-- All Subjects --</option>
              {lists.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* RIGHT: File Actions */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-700 border-b pb-2">2. Upload File</h3>

          <div className="bg-blue-50 p-4 rounded border border-blue-100">
            <h4 className="font-bold text-blue-800 text-sm mb-2">Instructions:</h4>
            <ul className="list-disc list-inside text-xs text-blue-700 space-y-1">
              <li>Select <strong>Subject</strong> (or All Subjects) to pre-fill the template.</li>
              <li>Download the <strong>Smart Template</strong>.</li>
              <li>Fill in <strong>Marks</strong>.</li>
              <li>Do not change PEN numbers.</li>
            </ul>
            <button onClick={downloadTemplate} disabled={!context.subject_id} className="mt-3 flex items-center gap-2 bg-white border border-blue-300 text-blue-700 px-3 py-1.5 rounded text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <Download className="h-4 w-4" /> Download Template
            </button>
          </div>

          <div className="mt-4">
            <label htmlFor="csv-upload" className="block text-sm font-medium mb-1">Select CSV File</label>
            <input id="csv-upload" type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} className="w-full p-2 border rounded bg-gray-50" />
          </div>

          <button
            onClick={handleFileUpload}
            disabled={!file || !context.exam_id || uploadStatus === 'processing'}
            className="w-full flex justify-center items-center gap-2 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 disabled:opacity-50"
          >
            {uploadStatus === 'processing' ? <Loader className="animate-spin h-5 w-5" /> : <Upload className="h-5 w-5" />}
            Upload Marks
          </button>
        </div>
      </div>

      {/* LOGS */}
      {logs.length > 0 && (
        <div className="mt-6 bg-gray-900 text-gray-100 p-4 rounded text-xs font-mono h-40 overflow-y-auto">
          <div className="font-bold border-b border-gray-700 pb-1 mb-2">Processing Logs:</div>
          {logs.map((l, i) => <div key={i} className={l.includes('Error') ? 'text-red-400' : 'text-green-400'}>{l}</div>)}
        </div>
      )}
    </div>
  );
};
export default BulkUploadMarks;