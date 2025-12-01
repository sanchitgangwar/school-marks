import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ManageTests from '../ManageTests';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    FileText: () => <span data-testid="file-text-icon" />,
    Edit: () => <span data-testid="edit-icon" />,
    Trash2: () => <span data-testid="delete-icon" />,
    Plus: () => <span data-testid="plus-icon" />,
}));

const mockExams = [
    {
        id: 1,
        name: 'Quarterly Exams',
        name_telugu: 'త్రైమాసిక పరీక్షలు',
        exam_code: 'Q1-2024',
        start_date: '2024-09-01T00:00:00.000Z',
        end_date: '2024-09-10T00:00:00.000Z'
    }
];

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_API_URL: 'http://localhost:3000' } } });

describe('ManageTests Component', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Mock global fetch
        // @ts-ignore
        global.fetch = vi.fn((url) => {
            if (url.includes('/exams')) {
                // Check if it's a delete request
                if (url.includes('/exams/1') && arguments[1]?.method === 'DELETE') {
                    return Promise.resolve({ ok: true });
                }
                return Promise.resolve({ json: () => Promise.resolve(mockExams) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
    });

    it('renders correctly', async () => {
        render(<ManageTests />);
        expect(screen.getByText('Manage Tests')).toBeInTheDocument();
    });

    it('loads exams on mount', async () => {
        render(<ManageTests />);
        await waitFor(() => {
            expect(screen.getByText('Quarterly Exams')).toBeInTheDocument();
            expect(screen.getByText('Q1-2024')).toBeInTheDocument();
        });
    });

    it('opens add exam modal', async () => {
        const user = userEvent.setup();
        render(<ManageTests />);

        await waitFor(() => screen.getByText('Add Exam'));

        await user.click(screen.getByText('Add Exam'));
        expect(screen.getByText('Add New Exam')).toBeInTheDocument();
    });
});
