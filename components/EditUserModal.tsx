import React, { useState, useEffect } from 'react';
import type { User } from '../types';

interface EditUserModalProps {
    user: User;
    onClose: () => void;
    onSave: (email: string, details: { name: string; mobile: string; role: User['role'] }) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        role: 'customer' as User['role'],
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                mobile: user.mobile,
                role: user.role,
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(user.email, formData);
    };

    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-brand-white dark:bg-brand-gray-dark rounded-lg shadow-2xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                           <h2 className="text-xl font-bold text-brand-blackcurrant dark:text-brand-blackcurrant">Edit User: {user.name}</h2>
                           <button type="button" onClick={onClose} className="text-brand-blackcurrant dark:text-brand-blackcurrant text-2xl hover:text-brand-blackcurrant dark:hover:text-brand-blackcurrant">&times;</button>
                        </div>
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-brand-blackcurrant dark:text-brand-blackcurrant">Email (Cannot be changed)</label>
                                <input type="email" value={user.email} disabled className="mt-1 block w-full p-2 border rounded-md bg-brand-white dark:bg-brand-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-blackcurrant dark:text-brand-blackcurrant">Full Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-brand-blackcurrant dark:text-brand-blackcurrant">Mobile Number</label>
                                <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-blackcurrant dark:text-brand-blackcurrant">Role</label>
                                <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md">
                                    <option value="customer">Customer</option>
                                    <option value="seller">Seller</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-brand-white dark:bg-brand-gray-darker px-6 py-3 flex justify-end gap-4 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-brand-white-dark text-brand-blackcurrant rounded-md hover:bg-brand-white">Cancel</button>
                        <button type="submit" className="px-4 py-2 btn-brand-primary text-brand-white rounded-md">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
