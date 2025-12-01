import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BulkUploadMarks from '../BulkUploadMarks';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    FileSpreadsheet: () => <span data-testid="spreadsheet-icon" />,
    Download: () => <span data-testid="download-icon" />,
    Upload: () => <span data-testid="upload-icon" />,
    Loader: () => <span data-testid="loader-icon" />,
}));

// Mock Data
const mockDistricts = [{ id: 1, name: 'District A' }];
const mockMandals = [{ id: 1, name: 'Mandal A', district_id: 1 }];
const mockSchools = [{ id: 1, name: 'School A', mandal_id: 1, udise_code: '123' }];
const mockExams = [{ id: 1, name: 'Exam 1' }];
const mockSubjects = [{ id: 1, name: 'Math' }, { id: 2, name: 'Science' }];
const mockStudents = [{ id: 1, name: 'Student A', pen_number: 'PEN123', class_id: 1 }];
const mockClasses = [{ id: 1, grade_level: 10 }];

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_API_URL: 'http://localhost:3000' } } });

describe('BulkUploadMarks Component', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Mock global fetch
        // @ts-ignore
        global.fetch = vi.fn((url) => {
            if (url.includes('/entities/districts')) return Promise.resolve({ json: () => Promise.resolve(mockDistricts) });
            if (url.includes('/entities/mandals')) return Promise.resolve({ json: () => Promise.resolve(mockMandals) });
            if (url.includes('/entities/schools')) return Promise.resolve({ json: () => Promise.resolve(mockSchools) });
            if (url.includes('/entities/exams')) return Promise.resolve({ json: () => Promise.resolve(mockExams) });
            if (url.includes('/entities/subjects')) return Promise.resolve({ json: () => Promise.resolve(mockSubjects) });
            if (url.includes('/entities/students')) return Promise.resolve({ json: () => Promise.resolve(mockStudents) });
            if (url.includes('/entities/classes')) return Promise.resolve({ json: () => Promise.resolve(mockClasses) });
            if (url.includes('/marks/bulk-update')) return Promise.resolve({ ok: true });

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
    });

    const mockUser = { role: 'admin' };

    it('renders correctly', async () => {
        render(<BulkUploadMarks user={mockUser} />);
        expect(screen.getByText('Bulk Upload Marks')).toBeInTheDocument();
        expect(screen.getByText('1. Select Context')).toBeInTheDocument();
        expect(screen.getByText('2. Upload File')).toBeInTheDocument();
    });

    it('loads districts on mount', async () => {
        render(<BulkUploadMarks user={mockUser} />);
        await waitFor(() => {
            expect(screen.getByText('District A')).toBeInTheDocument();
        });
    });

    it('allows full context selection', async () => {
        const user = userEvent.setup();
        render(<BulkUploadMarks user={mockUser} />);

        // Select District
        await waitFor(() => screen.getByText('District A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /District/i }), '1');

        // Select Mandal
        await waitFor(() => screen.getByText('Mandal A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /Mandal/i }), '1');

        // Select School
        await waitFor(() => screen.getByText('School A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /School/i }), '1');

        // Select Exam
        await waitFor(() => screen.getByText('Exam 1'));
        await user.selectOptions(screen.getByRole('combobox', { name: /Test \/ Exam/i }), '1');

        // Select Subject
        await waitFor(() => screen.getByText('Math'));
        await user.selectOptions(screen.getByRole('combobox', { name: /Subject/i }), '1');

        // Check if "All Subjects" is available
        expect(screen.getByText('-- All Subjects --')).toBeInTheDocument();
    });

    it('handles file upload for single subject', async () => {
        const user = userEvent.setup();
        render(<BulkUploadMarks user={mockUser} />);

        // Setup Context
        await waitFor(() => screen.getByText('District A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /District/i }), '1');
        await waitFor(() => screen.getByText('Mandal A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /Mandal/i }), '1');
        await waitFor(() => screen.getByText('School A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /School/i }), '1');
        await waitFor(() => screen.getByText('Exam 1'));
        await user.selectOptions(screen.getByRole('combobox', { name: /Test \/ Exam/i }), '1');
        await waitFor(() => screen.getByText('Math'));
        await user.selectOptions(screen.getByRole('combobox', { name: /Subject/i }), '1');

        // Mock File
        const file = new File(['"School","UDISE","Test","PEN","Name","Class","Subject","Marks","Max","Grade"\n"School A","123","Exam 1","PEN123","Student A","Grade 10","Math","90","100","A1"'], 'marks.csv', { type: 'text/csv' });
        const input = screen.getByLabelText('Select CSV File');
        await user.upload(input, file);

        // Upload
        const uploadBtn = screen.getByText('Upload Marks');
        await user.click(uploadBtn);

        await waitFor(() => {
            expect(screen.getByText(/Success! Database updated/i)).toBeInTheDocument();
        });
    });

    it('handles file upload for all subjects with grades', async () => {
        const user = userEvent.setup();
        render(<BulkUploadMarks user={mockUser} />);

        // Setup Context
        await waitFor(() => screen.getByText('District A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /District/i }), '1');
        await waitFor(() => screen.getByText('Mandal A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /Mandal/i }), '1');
        await waitFor(() => screen.getByText('School A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /School/i }), '1');
        await waitFor(() => screen.getByText('Exam 1'));
        await user.selectOptions(screen.getByRole('combobox', { name: /Test \/ Exam/i }), '1');

        // Select All Subjects
        await waitFor(() => screen.getByText('-- All Subjects --'));
        await user.selectOptions(screen.getByRole('combobox', { name: /Subject/i }), 'all');

        // Mock File with Grades
        // Columns: School, UDISE, Test, PEN, Name, Class, MATH, MATH_GRADE, SCIENCE, SCIENCE_GRADE
        const csvContent = '"School","UDISE","Test","PEN","Name","Class","MATH","MATH_GRADE","SCIENCE","SCIENCE_GRADE"\n' +
            '"School A","123","Exam 1","PEN123","Student A","Grade 10","90","A1","85","A2"';

        const file = new File([csvContent], 'marks_all.csv', { type: 'text/csv' });
        const input = screen.getByLabelText('Select CSV File');
        await user.upload(input, file);

        // Upload
        const uploadBtn = screen.getByText('Upload Marks');
        await user.click(uploadBtn);

        await waitFor(() => {
            expect(screen.getByText(/Success! Database updated/i)).toBeInTheDocument();
        });
    });
});
