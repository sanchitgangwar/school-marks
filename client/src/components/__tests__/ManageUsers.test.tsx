import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ManageUsers from '../ManageUsers';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Users: () => <span data-testid="users-icon" />,
    Edit: () => <span data-testid="edit-icon" />,
    Trash2: () => <span data-testid="delete-icon" />,
    Plus: () => <span data-testid="plus-icon" />,
    X: () => <span data-testid="close-icon" />,
}));

// Mock Data
const mockDistricts = [{ id: 1, name: 'District A' }];
const mockMandals = [{ id: 1, name: 'Mandal A', district_id: 1 }];
const mockSchools = [{ id: 1, name: 'School A', mandal_id: 1 }];
const mockUsers = [
    { id: 1, username: 'user1', role: 'school_admin', full_name: 'User One', school_name: 'School A', school_id: 1, mandal_id: 1, district_id: 1 },
    { id: 2, username: 'user2', role: 'deo', full_name: 'User Two', district_name: 'District A', district_id: 1 }
];

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_API_URL: 'http://localhost:3000' } } });

describe('ManageUsers Component', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Mock localStorage
        Storage.prototype.getItem = vi.fn(() => 'mock-token');

        // Mock global fetch
        // @ts-expect-error - Mocking global fetch
        global.fetch = vi.fn((url, options) => {
            if (url.includes('/entities/districts')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDistricts) });
            if (url.includes('/entities/mandals')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMandals) });
            if (url.includes('/entities/schools')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSchools) });

            if (url.includes('/admin/users')) {
                if (!options || !options.method || options.method === 'GET') {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
                }
                if (options.method === 'DELETE') {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: 'Deleted' }) });
                }
                if (options.method === 'PUT') {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: 'Updated' }) });
                }
            }

            if (url.includes('/admin/create-user')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: 'Created' }) });
            }

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        // Mock confirm
        global.confirm = vi.fn(() => true);
        // Mock scrollTo
        global.scrollTo = vi.fn();
    });

    const mockAdminUser = { role: 'admin', id: 999 };

    it('renders correctly and loads users', async () => {
        render(<ManageUsers currentUser={mockAdminUser} />);
        expect(screen.getByText('Manage Users')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('user1')).toBeInTheDocument();
            expect(screen.getByText('user2')).toBeInTheDocument();
        });
    });

    it('opens modal on create click', async () => {
        const user = userEvent.setup();
        render(<ManageUsers currentUser={mockAdminUser} />);

        const createBtn = screen.getByText('Create User');
        await user.click(createBtn);

        expect(screen.getByText('Create New User')).toBeInTheDocument();
    });

    it('populates form on edit click', async () => {
        const user = userEvent.setup();
        render(<ManageUsers currentUser={mockAdminUser} />);

        await waitFor(() => screen.getByText('user1'));

        const editBtns = screen.getAllByTitle('Edit');
        await user.click(editBtns[0]); // Edit user1

        expect(screen.getByText('Edit User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('user1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('User One')).toBeInTheDocument();
    });

    it('handles delete action', async () => {
        const user = userEvent.setup();
        render(<ManageUsers currentUser={mockAdminUser} />);

        await waitFor(() => screen.getByText('user1'));

        const deleteBtns = screen.getAllByTitle('Delete');
        await user.click(deleteBtns[0]); // Delete user1

        expect(global.confirm).toHaveBeenCalled();
        await waitFor(() => {
            expect(screen.getByText('User deleted successfully.')).toBeInTheDocument();
        });
    });

    it('submits edit form', async () => {
        const user = userEvent.setup();
        render(<ManageUsers currentUser={mockAdminUser} />);

        await waitFor(() => screen.getByText('user1'));

        // Click Edit
        const editBtns = screen.getAllByTitle('Edit');
        await user.click(editBtns[0]);

        // Change Full Name
        const nameInput = screen.getByDisplayValue('User One');
        await user.clear(nameInput);
        await user.type(nameInput, 'User One Updated');

        // Submit
        const submitBtn = screen.getByText('Update User');
        await user.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('User updated successfully!')).toBeInTheDocument();
        });
    });
});
