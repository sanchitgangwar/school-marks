import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ManageSchools from '../ManageSchools';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Edit: () => <span data-testid="edit-icon" />,
    Trash2: () => <span data-testid="delete-icon" />,
    Search: () => <span data-testid="search-icon" />,
    Plus: () => <span data-testid="plus-icon" />,
    Building: () => <span data-testid="building-icon" />,
}));

const mockUser = {
    role: 'admin',
    district_id: null,
    mandal_id: null,
};

const mockDistricts = [{ id: 1, name: 'District A' }];
const mockMandals = [{ id: 1, name: 'Mandal A' }];
const mockSchools = [
    { id: 1, name: 'School A', udise_code: '1234567890', address: 'Address A', district_id: 1, mandal_id: 1 }
];

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_API_URL: 'http://localhost:3000' } } });

describe('ManageSchools Component', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Mock global fetch
        // @ts-expect-error - Mocking fetch for tests
        globalThis.fetch = vi.fn((url: string, options?: RequestInit) => {
            console.log('Fetch called with:', url);
            if (url.includes('/districts')) return Promise.resolve({ json: () => Promise.resolve(mockDistricts) });
            if (url.includes('/mandals')) return Promise.resolve({ json: () => Promise.resolve(mockMandals) });
            if (url.includes('/schools')) {
                // Check if it's a delete request
                if (url.includes('/schools/1') && options?.method === 'DELETE') {
                    return Promise.resolve({ ok: true });
                }
                return Promise.resolve({ json: () => Promise.resolve(mockSchools) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
    });

    it('renders correctly', async () => {
        render(<ManageSchools currentUser={mockUser} />);
        expect(screen.getByText('Manage Schools')).toBeInTheDocument();
        expect(screen.getByText('District')).toBeInTheDocument();
    });

    it('loads districts on mount', async () => {
        render(<ManageSchools currentUser={mockUser} />);
        await waitFor(() => {
            expect(screen.getByText('District A')).toBeInTheDocument();
        });
    });

    it('allows full selection flow', async () => {
        const user = userEvent.setup();
        render(<ManageSchools currentUser={mockUser} />);

        // Select District
        await waitFor(() => screen.getByText('District A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /district/i }), '1');

        // Wait for fetch to be called
        await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/mandals'), expect.anything()));

        // Select Mandal
        await waitFor(() => screen.getByText('Mandal A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /mandal/i }), '1');

        await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/schools'), expect.anything()));

        // Check if schools are loaded
        await waitFor(() => {
            expect(screen.getByText('School A')).toBeInTheDocument();
            expect(screen.getByText('1234567890')).toBeInTheDocument();
        });
    });

    it('opens add school modal', async () => {
        const user = userEvent.setup();
        render(<ManageSchools currentUser={mockUser} />);

        // Simulate selection to show list and add button
        await waitFor(() => screen.getByText('District A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /district/i }), '1');

        await waitFor(() => screen.getByText('Mandal A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /mandal/i }), '1');

        await waitFor(() => screen.getByText('Add School'));

        await user.click(screen.getByText('Add School'));
        expect(screen.getByText('Add New School')).toBeInTheDocument();
    });
});
