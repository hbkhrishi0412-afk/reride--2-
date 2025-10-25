
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import PasswordInput from './PasswordInput';

interface ProfileProps {
  currentUser: User;
  onUpdateProfile: (details: { 
    name: string; 
    mobile: string; 
    avatarUrl?: string;
    dealershipName?: string;
    bio?: string;
    logoUrl?: string;
  }) => void;
  onUpdatePassword: (passwords: { current: string; new: string }) => Promise<boolean>;
}

const ProfileInput: React.FC<{ 
  label: string; 
  name: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  type?: string; 
  disabled?: boolean; 
  placeholder?: string;
}> = ({ label, name, value, onChange, type = 'text', disabled = false, placeholder }) => (
  <div className="space-y-1">
    <label htmlFor={name} className="text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
    />
  </div>
);

const Profile: React.FC<ProfileProps> = ({ currentUser, onUpdateProfile, onUpdatePassword }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name,
    mobile: currentUser.mobile,
    avatarUrl: currentUser.avatarUrl || '',
    dealershipName: (currentUser as any).dealershipName || '',
    bio: (currentUser as any).bio || '',
    logoUrl: (currentUser as any).logoUrl || '',
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setFormData({
      name: currentUser.name,
      mobile: currentUser.mobile,
      avatarUrl: currentUser.avatarUrl || '',
      dealershipName: (currentUser as any).dealershipName || '',
      bio: (currentUser as any).bio || '',
      logoUrl: (currentUser as any).logoUrl || '',
    });
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setFormData(prev => ({ ...prev, logoUrl: event.target.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setFormData(prev => ({ ...prev, avatarUrl: event.target.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordError) setPasswordError('');
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setFormData({ 
        name: currentUser.name, 
        mobile: currentUser.mobile, 
        avatarUrl: currentUser.avatarUrl || '',
        dealershipName: (currentUser as any).dealershipName || '',
        bio: (currentUser as any).bio || '',
        logoUrl: (currentUser as any).logoUrl || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsEditing(false);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordData.new.length < 6) {
        setPasswordError("New password must be at least 6 characters long.");
        return;
    }

    const success = await onUpdatePassword({ current: passwordData.current, new: passwordData.new });
    if (success) {
      setPasswordData({ current: '', new: '', confirm: '' });
    } else {
        setPasswordError("Your current password was incorrect.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-2 text-gray-600">Manage your account settings</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Details Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
                  {!isEditing && (
                    <button 
                      onClick={handleEditToggle}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleProfileSave}>
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="relative">
                      <img
                        src={formData.avatarUrl || `https://i.pravatar.cc/80?u=${currentUser.email}`}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                      {isEditing && (
                        <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <input id="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarUpload} />
                        </label>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{formData.name}</p>
                      <p className="text-sm text-gray-500">{currentUser.email}</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <ProfileInput
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your full name"
                    />
                    
                    <ProfileInput
                      label="Mobile Number"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter mobile number"
                    />

                    {currentUser.role === 'seller' && (
                      <>
                        <ProfileInput
                          label="Dealership Name"
                          name="dealershipName"
                          value={formData.dealershipName}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter dealership name"
                        />
                        
                        {/* Dealership Logo */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Dealership Logo</label>
                          <div className="flex items-center space-x-3">
                            <img
                              src={formData.logoUrl || `https://i.pravatar.cc/60?u=${currentUser.email}`}
                              alt="Dealership Logo"
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                            />
                            {isEditing && (
                              <div>
                                <label htmlFor="logo-upload" className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
                                  Upload Logo
                                </label>
                                <input id="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoUpload} />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">About Your Dealership</label>
                          <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="Tell customers about your dealership..."
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                      <button 
                        type="button" 
                        onClick={handleEditToggle}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
                
                <form onSubmit={handlePasswordSave}>
                  <div className="space-y-4">
                    <PasswordInput
                      label="Current Password"
                      name="current"
                      value={passwordData.current}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    <PasswordInput
                      label="New Password"
                      name="new"
                      value={passwordData.new}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    <PasswordInput
                      label="Confirm New Password"
                      name="confirm"
                      value={passwordData.confirm}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    {passwordError && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                        {passwordError}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button 
                      type="submit" 
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={!passwordData.current || !passwordData.new || !passwordData.confirm}
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
