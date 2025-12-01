import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ManageDistricts from '../ManageDistricts';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Edit: () => <span data-testid="edit-icon" />,
    Trash2: () => <span data-testid="delete-icon" />,
    Plus: () => <span data-testid="plus-icon" />,
    Map: () => <span data-testid="map-icon" />,
}));

const mockDistricts = [{ id: 1, name: 'District A', state: 'Telangana' }];

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_API_URL: 'http://localhost:3000' } } });

describe('ManageDistricts Component', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Mock global fetch
        // @ts-ignore
        global.fetch = vi.fn((url) => {
            if (url.includes('/districts')) {
                // Check if it's a delete request
                if (url.includes('/districts/1') && arguments[1]?.method === 'DELETE') {
                    return Promise.resolve({ ok: true });
                }
                return Promise.resolve({ json: () => Promise.resolve(mockDistricts) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
    });

    it('renders correctly', async () => {
        render(<ManageDistricts />);
        expect(screen.getByText('Manage Districts')).toBeInTheDocument();
    });

    it('loads districts on mount', async () => {
        render(<ManageDistricts />);
        await waitFor(() => {
            expect(screen.getByText('District A')).toBeInTheDocument();
        });
    });

    it('opens add district modal', async () => {
        const user = userEvent.setup();
        render(<ManageDistricts />);

        await waitFor(() => screen.getByText('Add District'));

        await user.click(screen.getByText('Add District'));
        expect(screen.getByText('Add New District')).toBeInTheDocument();
    });
});
