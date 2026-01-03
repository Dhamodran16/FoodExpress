// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useEffect } from 'react';
import { getAuth, updateProfile, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';

const VALID_PAYMENT_METHODS = ['Google Pay', 'Apple Pay', 'Cash on Delivery', 'Credit/Debit Card'];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

const Profile: React.FC = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  // Editable profile fields
  const [profileData, setProfileData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [, setSelectedImage] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState<any>({
    label: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false,
  });
  const [addresses, setAddresses] = useState<any[]>([]);

  // Add missing handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL,
      });
      // Update backend
      await fetch(`${API_URL}/api/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      setShowSuccessMessage('Updated');
      setIsEditing(false);
      await fetchProfileFromBackend(user.uid);
    } catch (err) {
      setShowSuccessMessage('Failed to update profile.');
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    setLoading(true);
    try {
      // 1. Delete from MongoDB
      const mongoResponse = await fetch(`${API_URL}/api/users/${user.uid}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!mongoResponse.ok) {
        throw new Error('Failed to delete user from database');
      }

      // 2. Delete from Firebase
      await user.delete();

      // 3. Clear local storage
      window.localStorage.removeItem('userId');
      
      // 4. Sign out and redirect
      await signOut(auth);
      window.location.replace('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      setShowSuccessMessage('Failed to delete account. Please try again.');
    }
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedImage(ev.target?.result as string);
        setProfileData((prev: any) => ({ ...prev, photoURL: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    alert('Camera capture not implemented in this demo.');
  };

  const handleAddOrEditAddress = async (address: any, addressId: any = null) => {
    if (!user) return;
    await fetch(`${API_URL}/api/users/${user.uid}/address`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, addressId }),
    });
    await fetchProfileFromBackend(user.uid);
  };

  const handleRemoveAddress = async (addressId: any) => {
    if (!user) return;
    await fetch(`${API_URL}/api/users/${user.uid}/address/${addressId}`, {
      method: 'DELETE',
    });
    await fetchProfileFromBackend(user.uid);
  };

  const handleAddAddress = async () => {
    if (!newAddress.label || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.postalCode) return;
    setShowAddressModal(false);
    if (!user) return;
    await handleAddOrEditAddress(newAddress);
    setNewAddress({
      label: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      isDefault: false,
    });
  };

  const handleSetDefaultAddress = async (id: any) => {
    const addr = addresses.find(a => a._id === id || a.id === id);
    if (!addr) return;
    await handleAddOrEditAddress({ ...addr, isDefault: true }, addr._id || addr.id);
  };

  // Unused function - password change is handled inline
  /*
  const _handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      const errorModal = document.createElement('div');
      errorModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      errorModal.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="text-center">
            <i class="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Password Mismatch</h3>
            <p class="text-gray-600 mb-4">New password and confirm password do not match.</p>
            <button class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors !rounded-button">
              Close
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(errorModal);
      const closeButton = errorModal.querySelector('button');
      closeButton?.addEventListener('click', () => errorModal.remove());
      return;
    }
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const res = await fetch(`${API_URL}/api/users/${user.uid}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: profileData.password === null ? undefined : passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      if (!res.ok) {
        const errorModal = document.createElement('div');
        errorModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        errorModal.innerHTML = `
          <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div class="text-center">
              <i class="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Password Not Matched</h3>
              <p class="text-gray-600 mb-4">Current password is incorrect.</p>
              <button class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors !rounded-button">
                Close
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(errorModal);
        const closeButton = errorModal.querySelector('button');
        closeButton?.addEventListener('click', () => errorModal.remove());
        return;
      }
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // Refetch profile after password update
      await fetchProfileFromBackend(user.uid);
      const successModal = document.createElement('div');
      successModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      successModal.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="text-center">
            <i class="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Password Updated</h3>
            <p class="text-gray-600 mb-4">Your password has been successfully updated.</p>
            <button class="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors !rounded-button">
              Close
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(successModal);
      const closeButton = successModal.querySelector('button');
      closeButton?.addEventListener('click', () => successModal.remove());
    } catch (err) {
      const errorModal = document.createElement('div');
      errorModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      errorModal.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="text-center">
            <i class="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Error</h3>
            <p class="text-gray-600 mb-4">Failed to update password.</p>
            <button class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors !rounded-button">
              Close
            </button>
        </div>
      </div>
      `;
      document.body.appendChild(errorModal);
      const closeButton = errorModal.querySelector('button');
      closeButton?.addEventListener('click', () => errorModal.remove());
    }
  };
  */

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    window.location.replace('/');
  };

  const isProfileComplete = () => {
    if (!profileData) return false;
    return (
      typeof profileData.displayName === 'string' && profileData.displayName.trim() !== '' &&
      typeof profileData.email === 'string' && profileData.email.trim() !== '' &&
      typeof profileData.phone === 'string' && profileData.phone.trim() !== '' &&
      typeof profileData.address === 'string' && profileData.address.trim() !== '' &&
      typeof profileData.deliveryAddress === 'string' && profileData.deliveryAddress.trim() !== '' &&
      typeof profileData.preferredPaymentMethod === 'string' && VALID_PAYMENT_METHODS.includes(profileData.preferredPaymentMethod)
    );
  };

  const fetchProfileFromBackend = async (uid: string) => {
    const res = await fetch(`${API_URL}/api/users/${uid}`);
    if (res.ok) {
      const profile = await res.json();
      setProfileData(profile);
      setAddresses(profile.addresses || []);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      const res = await fetch(`${API_URL}/api/users/${user.uid}`);
      if (res.ok) {
        const profile = await res.json();
        setProfileData(profile);
        setAddresses(profile.addresses || []);
      }
      setLoading(false);
    };
    fetchProfile();
    // Fallback: reload profile on page reload
    window.addEventListener('focus', fetchProfile);
    return () => window.removeEventListener('focus', fetchProfile);
  }, [user]);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  // const defaultAddress = addresses.find(addr => addr.isDefault); // Unused variable

  console.log('Profile Data:', profileData);
  console.log('Is Profile Complete:', isProfileComplete());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <i className="fas fa-utensils text-orange-500 text-2xl mr-2"></i>
                <span className="font-bold text-xl text-gray-800">FoodDelivery</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => navigate('/')}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer whitespace-nowrap bg-transparent"
                >
                  Home
                </button>
                <button
                  onClick={() => navigate('/restaurants')}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer whitespace-nowrap bg-transparent"
                >
                  Restaurants
                </button>
                <button
                  onClick={() => navigate('/orders')}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer whitespace-nowrap bg-transparent"
                >
                  Orders
                </button>
                <span className="border-orange-500 text-orange-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer whitespace-nowrap">
                  Profile
                </span>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button type="button" onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 !rounded-button cursor-pointer whitespace-nowrap">
                <i className="fas fa-sign-out-alt mr-2"></i>
                Logout
              </button>
            </div>
            <div className="flex items-center sm:hidden">
              <button type="button" className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 !rounded-button cursor-pointer whitespace-nowrap">
                <i className="fas fa-bars"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <div className="pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="flex flex-col items-center mt-8 mb-10">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)'
                }}
              >
                <FaUserCircle className="text-white text-5xl" />
              </div>
              <div 
                className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-2 shadow-md cursor-pointer"
                onClick={() => setShowImageUploadModal(true)}
              >
                <i className="fas fa-camera text-white"></i>
              </div>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-800">
              {(profileData.displayName || '').trim() !== ''
                ? profileData.displayName
                : (profileData.email ? profileData.email.split('@')[0] : '')}
            </h1>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 !rounded-button cursor-pointer whitespace-nowrap"
            >
              <i className="fas fa-pencil-alt mr-2"></i>
              Edit Profile
            </button>
          </div>
          {showSuccessMessage && (
            <div className={`mb-4 px-4 py-3 rounded relative ${showSuccessMessage === 'Updated' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
              <span className="block sm:inline">{showSuccessMessage === 'Updated' ? 'Your profile has been updated and stored in MongoDB!' : showSuccessMessage}</span>
            </div>
          )}
          {!loading && !isProfileComplete() && (
            <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">Your profile is incomplete. Please fill out all required fields to continue ordering.</span>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
                  <p className="mt-1 text-sm text-gray-500">Update your account details and personal information.</p>
                </div>
                <div className="px-6 py-6 space-y-6">
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fas fa-user text-gray-400"></i>
                      </div>
                      <input
                        type="text"
                        name="displayName"
                        id="displayName"
                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                        value={profileData.displayName || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      {isEditing && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <i className="fas fa-pencil-alt text-gray-400"></i>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fas fa-envelope text-gray-400"></i>
                      </div>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                        value={profileData.email || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      {isEditing && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <i className="fas fa-pencil-alt text-gray-400"></i>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fas fa-phone text-gray-400"></i>
                      </div>
                      <input
                        type="text"
                        name="phone"
                        id="phone"
                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                        value={profileData.phone || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      {isEditing && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <i className="fas fa-pencil-alt text-gray-400"></i>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Home Address</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fas fa-home text-gray-400"></i>
                      </div>
                      <input
                        type="text"
                        name="address"
                        id="address"
                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                        value={profileData.address || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      {isEditing && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <i className="fas fa-pencil-alt text-gray-400"></i>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="preferredPaymentMethod" className="block text-sm font-medium text-gray-700">Preferred Payment Method</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <select
                        name="preferredPaymentMethod"
                        id="preferredPaymentMethod"
                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                        value={profileData.preferredPaymentMethod || ''}
                        onChange={handleSelectChange}
                        disabled={!isEditing}
                      >
                        <option value="">Select a payment method</option>
                        {VALID_PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                      {isEditing && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <i className="fas fa-pencil-alt text-gray-400"></i>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label>Password</label>
                    <div>
                      {profileData.password === null ? (
                        <>
                          <span className="text-yellow-600">Password not set (Google login)</span>
                          <button onClick={() => setShowPasswordModal(true)} className="ml-2 text-blue-600 underline">Set Password</button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 text-right">
                  {isEditing ? (
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 !rounded-button cursor-pointer whitespace-nowrap"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveChanges}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 !rounded-button cursor-pointer whitespace-nowrap"
                      >
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 !rounded-button cursor-pointer whitespace-nowrap"
                    >
                      Edit Information
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Account Actions & Order Preferences */}
            <div className="space-y-6">
              {/* Account Actions */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Account Actions</h3>
                  <p className="mt-1 text-sm text-gray-500">Manage your account settings.</p>
                </div>
                <div className="px-6 py-6 space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 !rounded-button cursor-pointer whitespace-nowrap"
                  >
                    <i className="fas fa-key mr-2"></i>
                    {profileData.password === null ? 'Set Password' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 !rounded-button cursor-pointer whitespace-nowrap"
                  >
                    <i className="fas fa-sync-alt mr-2"></i>
                    Update Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 !rounded-button cursor-pointer whitespace-nowrap"
                  >
                    <i className="fas fa-trash-alt mr-2"></i>
                    Delete Account
                  </button>
                </div>
              </div>
              {/* Image Upload Modal */}
              {showImageUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-medium text-gray-900">Upload Profile Picture</h3>
                      <button onClick={() => setShowImageUploadModal(false)} className="text-gray-400 hover:text-gray-500" title="Close image upload modal">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Upload from Device */}
                      <label className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <i className="fas fa-upload text-3xl text-orange-500 mb-2"></i>
                        <span className="text-sm font-medium text-gray-700">Upload from Device</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                      
                      {/* Take Photo */}
                      <button
                        onClick={handleCameraCapture}
                        className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        title="Take photo with camera"
                      >
                        <i className="fas fa-camera text-3xl text-orange-500 mb-2"></i>
                        <span className="text-sm font-medium text-gray-700">Take Photo</span>
                      </button>
                      
                      {/* Choose from Gallery */}
                      <label className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <i className="fas fa-images text-3xl text-orange-500 mb-2"></i>
                        <span className="text-sm font-medium text-gray-700">Choose from Gallery</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                      
                      {/* Upload File */}
                      <label className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <i className="fas fa-file-upload text-3xl text-orange-500 mb-2"></i>
                        <span className="text-sm font-medium text-gray-700">Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                    
                    <div className="mt-6 text-center text-sm text-gray-500">
                      Supported formats: JPG, PNG, GIF (max. 5MB)
                    </div>
                  </div>
                </div>
              )}

              {/* Password Change Modal */}
              {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {profileData.password === null ? 'Set Password' : 'Change Password'}
                      </h3>
                      <button onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordError('');
                        setPasswordSuccess('');
                      }} className="text-gray-400 hover:text-gray-500" title="Close password modal">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setPasswordError('');
                      setPasswordSuccess('');
                      if (passwordData.newPassword !== passwordData.confirmPassword) {
                        setPasswordError('New password and confirm password do not match.');
                        return;
                      }
                      if (passwordData.newPassword.length < 6) {
                        setPasswordError('Password must be at least 6 characters.');
                        return;
                      }
                      try {
                        const auth = getAuth();
                        const user = auth.currentUser;
                        if (!user) throw new Error('Not authenticated');
                        const res = await fetch(`${API_URL}/api/users/${user.uid}/password`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            currentPassword: profileData.password === null ? undefined : passwordData.currentPassword,
                            newPassword: passwordData.newPassword
                          })
                        });
                        if (!res.ok) {
                          const err = await res.json();
                          setPasswordError(err.message || 'Failed to update password.');
                          return;
                        }
                        setPasswordSuccess('Password updated successfully!');
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setTimeout(() => setShowPasswordModal(false), 1500);
                      } catch (err) {
                        setPasswordError('Failed to update password.');
                      }
                    }}>
                      {profileData.password !== null && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700">Current Password</label>
                          <input
                            type="password"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                            value={passwordData.currentPassword}
                            onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            required
                          />
                        </div>
                      )}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input
                          type="password"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          value={passwordData.newPassword}
                          onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                        <input
                          type="password"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          value={passwordData.confirmPassword}
                          onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          required
                        />
                      </div>
                      {passwordError && <div className="text-red-600 mb-2">{passwordError}</div>}
                      {passwordSuccess && <div className="text-green-600 mb-2">{passwordSuccess}</div>}
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowPasswordModal(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 !rounded-button"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-orange-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 !rounded-button"
                        >
                          {profileData.password === null ? 'Set Password' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              {/* Add Address Modal */}
              {showAddressModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Add New Address</h3>
                      <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-500" title="Close address modal">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        className="border rounded p-2"
                        placeholder="Label (e.g. Home, Work)"
                        value={newAddress.label || ''}
                        onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                      />
                      <input
                        type="text"
                        className="border rounded p-2"
                        placeholder="Street"
                        value={newAddress.street || ''}
                        onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                      />
                      <input
                        type="text"
                        className="border rounded p-2"
                        placeholder="City"
                        value={newAddress.city || ''}
                        onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                      />
                      <input
                        type="text"
                        className="border rounded p-2"
                        placeholder="State"
                        value={newAddress.state || ''}
                        onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                      />
                      <input
                        type="text"
                        className="border rounded p-2"
                        placeholder="Postal Code"
                        value={newAddress.postalCode || ''}
                        onChange={e => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      />
                      <label className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          checked={!!newAddress.isDefault}
                          onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                          className="mr-2"
                        />
                        Set as default address
                      </label>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => setShowAddressModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 !rounded-button"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddAddress}
                        className="px-4 py-2 bg-orange-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 !rounded-button"
                      >
                        Add Address
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Addresses Section */}
              <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                <div className="px-6 py-5 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium leading-6 text-gray-900">My Addresses</h3>
                      <p className="mt-1 text-sm text-gray-500">Manage your delivery addresses.</p>
                    </div>
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 !rounded-button"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add Address
                    </button>
                  </div>
                </div>
                <div className="px-6 py-6 space-y-4">
                  {addresses.map((addr) => (
                    <div key={addr._id || addr.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <i className="fas fa-map-marker-alt text-orange-500 text-lg"></i>
                        </div>
                        <div>
                          <div>
                            <span>{addr.label}:</span>
                            <span>
                              {[addr.street, addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}
                            </span>
                          </div>
                          {addr.isDefault ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                              Default
                            </span>
                          ) : (
                            <button
                              onClick={async () => {
                                await handleSetDefaultAddress(addr._id || addr.id);
                              }}
                              className="text-sm text-orange-600 hover:text-orange-700 mt-1"
                              title="Set as default address"
                            >
                              Set as Default
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRemoveAddress(addr._id || addr.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                          title="Remove address"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 !rounded-button cursor-pointer whitespace-nowrap"
        title="Back to top"
      >
        <i className="fas fa-arrow-up"></i>
      </button>
    </div>
  );
};

export default Profile;