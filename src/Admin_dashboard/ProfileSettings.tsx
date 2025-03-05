import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    id: number;
    role: string;
}

const ProfileSettings = () => {
    const [name, setName] = useState('Fabrice');
    const [email, setEmail] = useState('Fabrice@gmail.com');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [notification, setNotification] = useState(true);
    const [editingPicture, setEditingPicture] = useState(false);
    const [profilePicture, setProfilePicture] = useState('/Images/profile.jpeg');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [role, setRole] = useState('');
    const [userId, setUserId] = useState<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    throw new Error('No access token found');
                }

                const decodedToken = jwtDecode<DecodedToken>(token);
                setUserId(decodedToken.id);

                const response = await axios.get(`/api/users/${decodedToken.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const userData = response.data;
                setName(userData.name);
                setEmail(userData.email);
                setRole(userData.role);
                setProfilePicture(userData.picture || '/Images/avatar.png'); // Set default picture if none exists
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    const handlePictureClick = () => {
        setEditingPicture(true);
    };

    const handleSavePicture = () => {
        setEditingPicture(false);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) {
            setError('User ID is missing. Please log in again.');
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No access token found');
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);

            if (selectedFile) {
                formData.append('picture', selectedFile);
            }

            await axios.put(
                `/api/users/update/${userId}`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setSuccess('Profile updated successfully!');
            setError('');
            setProfilePicture(URL.createObjectURL(selectedFile!)); // Update profile picture preview
        } catch (error) {
            console.error('Error updating profile:', error);
            setError('Error updating profile. Please try again.');
            setSuccess('');
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No access token found');
            }

            await axios.put(
                '/api/auth/change-password',
                {
                    oldPassword,
                    newPassword
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setSuccess('Password changed successfully!');
            setError('');
            setOldPassword('');
            setNewPassword('');
        } catch (error) {
            setError('Error changing password. Please check your old password and try again.');
            setSuccess('');
        }
    };

    return (
        <div className="p-5" style={{ width: '80%', marginLeft: '15%' }}>
            <h2>Profile Settings</h2>
            <div className="text-center">
                <div className="rounded-circle overflow-hidden" style={{ width: 100, height: 100, cursor: 'pointer' }} onClick={handlePictureClick}>
                    <img src={profilePicture} alt="Profile" style={{ width: '100%', height: '100%' }} />
                </div>
                <a href="#" className="d-block text-primary mt-2" onClick={handlePictureClick}>
                    <Camera size={16} className="me-2" />
                    Update Profile Picture
                </a>
            </div>

            {editingPicture && (
                <div className="mt-3">
                    <input
                        type="file"
                        className="form-control"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                setSelectedFile(e.target.files[0]);
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    if (event.target) {
                                        setProfilePicture(event.target.result as string);
                                    }
                                };
                                reader.readAsDataURL(e.target.files[0]);
                            }
                        }}
                    />
                    <button className="btn btn-success mt-2" onClick={handleSavePicture}>
                        Save
                    </button>
                </div>
            )}

            <form onSubmit={handleUpdateProfile} className="mt-4">
                <div className="mb-3">
                    <label>Name:</label>
                    <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label>Email:</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label>Role:</label>
                    <input
                        type="text"
                        className="form-control"
                        value={role}
                        readOnly
                    />
                </div>
                <button type="submit" className="btn btn-primary">
                    Update Profile
                </button>
            </form>

            <form onSubmit={handleChangePassword} className="mt-4">
                <h3>Change Password</h3>
                <div className="mb-3">
                    <label>Current Password:</label>
                    <input
                        type="password"
                        className="form-control"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label>New Password:</label>
                    <input
                        type="password"
                        className="form-control"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">
                    Change Password
                </button>
            </form>

            {error && <div className="alert alert-danger mt-3">{error}</div>}
            {success && <div className="alert alert-success mt-3">{success}</div>}

            <div className="mt-4">
                <label>Notification Settings:</label>
                <div className="form-check form-switch">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        checked={notification}
                        onChange={(e) => setNotification(e.target.checked)}
                    />
                    <label className="form-check-label">Enable Notifications</label>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;