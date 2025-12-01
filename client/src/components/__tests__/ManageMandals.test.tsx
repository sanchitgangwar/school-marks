import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ManageMandals from '../ManageMandals';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Edit: () => <span data-testid="edit-icon" />,
    Trash2: () => <span data-testid="delete-icon" />,
    Search: () => <span data-testid="search-icon" />,
    Plus: () => <span data-testid="plus-icon" />,
    MapPin: () => <span data-testid="mappin-icon" />,
}));

const mockUser = {
    role: 'admin',
    district_id: null,
};

const mockDistricts = [{ id: 1, name: 'District A' }];
const mockMandals = [{ id: 1, name: 'Mandal A', district_id: 1 }];

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_API_URL: 'http://localhost:3000' } } });

describe('ManageMandals Component', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Mock global fetch
        // @ts-expect-error - Mocking fetch for tests
        globalThis.fetch = vi.fn((url: string, options?: RequestInit) => {
            if (url.includes('/districts')) return Promise.resolve({ json: () => Promise.resolve(mockDistricts) });
            if (url.includes('/mandals')) {
                // Check if it's a delete request
                if (url.includes('/mandals/1') && options?.method === 'DELETE') {
                    return Promise.resolve({ ok: true });
                }
                return Promise.resolve({ json: () => Promise.resolve(mockMandals) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
    });

    it('renders correctly', async () => {
        render(<ManageMandals currentUser={mockUser} />);
        expect(screen.getByText('Manage Mandals')).toBeInTheDocument();
        expect(screen.getByText('District')).toBeInTheDocument();
    });

    it('loads districts on mount', async () => {
        render(<ManageMandals currentUser={mockUser} />);
        await waitFor(() => {
            expect(screen.getByText('District A')).toBeInTheDocument();
        });
    });

    it('allows full selection flow', async () => {
        const user = userEvent.setup();
        render(<ManageMandals currentUser={mockUser} />);

        // Select District
        await waitFor(() => screen.getByText('District A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /district/i }), '1');

        // Wait for fetch to be called
        await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/mandals'), expect.anything()));

        // Check if mandals are loaded
        await waitFor(() => {
            expect(screen.getByText('Mandal A')).toBeInTheDocument();
        });
    });

    it('opens add mandal modal', async () => {
        const user = userEvent.setup();
        render(<ManageMandals currentUser={mockUser} />);

        // Simulate selection to show list and add button
        await waitFor(() => screen.getByText('District A'));
        await user.selectOptions(screen.getByRole('combobox', { name: /district/i }), '1');

        await waitFor(() => screen.getByText('Add Mandal'));

        await user.click(screen.getByText('Add Mandal'));
        expect(screen.getByText('Add New Mandal')).toBeInTheDocument();
    });
});
