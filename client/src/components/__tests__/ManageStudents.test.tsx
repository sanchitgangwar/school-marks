import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ManageStudents from '../ManageStudents';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Edit: () => <span data-testid="edit-icon" />,
    Trash2: () => <span data-testid="delete-icon" />,
    Search: () => <span data-testid="search-icon" />,
    Plus: () => <span data-testid="plus-icon" />,
}));

const mockUser = {
    role: 'admin',
    district_id: null,
    mandal_id: null,
    school_id: null,
};

const mockDistricts = [{ id: 1, name: 'District A' }];
const mockMandals = [{ id: 1, name: 'Mandal A' }];
const mockSchools = [{ id: 1, name: 'School A' }];
const mockClasses = [{ id: 1, grade_level: 10 }];
const mockStudents = [
    { id: 101, name: 'John Doe', pen_number: '12345', class_id: 1, parent_phone: '9999999999' }
];

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_API_URL: 'http://localhost:3000' } } });

describe('ManageStudents Component', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Mock global fetch
        // @ts-ignore
        global.fetch = vi.fn((url) => {
            console.log('Fetch called with:', url);
            if (url.includes('/districts')) return Promise.resolve({ json: () => Promise.resolve(mockDistricts) });
            if (url.includes('/classes')) return Promise.resolve({ json: () => Promise.resolve(mockClasses) });
            if (url.includes('/mandals')) return Promise.resolve({ json: () => Promise.resolve(mockMandals) });
            if (url.includes('/schools')) return Promise.resolve({ json: () => Promise.resolve(mockSchools) });
            if (url.includes('/students')) return Promise.resolve({ json: () => Promise.resolve(mockStudents) });
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
    });

    it('renders correctly', async () => {
        render(<ManageStudents currentUser={mockUser} />);
        expect(screen.getByText('Manage Students')).toBeInTheDocument();
        expect(screen.getByText('District')).toBeInTheDocument();
    });

    it('loads districts on mount', async () => {
        render(<ManageStudents currentUser={mockUser} />);
        await waitFor(() => {
            expect(screen.getByText('District A')).toBeInTheDocument();
        });
    });

    it('allows full selection flow', async () => {
        const user = userEvent.setup();
        render(<ManageStudents currentUser={mockUser} />);

        // Select District
        await waitFor(() => screen.getByText('District A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /district/i }), '1');

        // Wait for fetch to be called
        await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/mandals'), expect.anything()));

        // Select Mandal
        await waitFor(() => screen.getByText('Mandal A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /mandal/i }), '1');

        await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/schools'), expect.anything()));

        // Select School
        await waitFor(() => screen.getByText('School A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /school/i }), '1');

        // Check if students are loaded
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
    });

    it('opens add student modal', async () => {
        const user = userEvent.setup();
        render(<ManageStudents currentUser={mockUser} />);

        // Simulate school selection to show list and add button
        await waitFor(() => screen.getByText('District A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /district/i }), '1');

        await waitFor(() => screen.getByText('Mandal A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /mandal/i }), '1');

        await waitFor(() => screen.getByText('School A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /school/i }), '1');

        await waitFor(() => screen.getByText('Add Student'));

        await user.click(screen.getByText('Add Student'));
        expect(screen.getByText('Add New Student')).toBeInTheDocument();
    });
});
