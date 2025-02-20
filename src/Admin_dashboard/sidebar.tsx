import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode to decode the token
import axios from 'axios'; // Import axios for making HTTP requests

interface MenuItem {
    path: string;
    icon: string;
    label: string;
}

interface DecodedToken {
    id: number;
    role: string;
}

interface User {
    id: number;
    name: string;
    picture?: string;
    role: string; 
}

const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null); // State to store user data

    // Fetch user data on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    throw new Error('No access token found');
                }

                // Decode the token to get the user ID
                const decodedToken = jwtDecode<DecodedToken>(token);

                // Fetch user data using the decoded user ID
                const response = await axios.get(`/api/users/${decodedToken.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                setUser(response.data); // Set the user data
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    const menuItems: MenuItem[] = [
        { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/admin/stations', icon: '⛽', label: 'Station Management' },
        { path: '/admin/users', icon: '👥', label: 'User Management' },
        { path: '/admin/vehicles', icon: '🚗', label: 'Vehicle Management' },
        { path: '/admin/drivers', icon: '🧑', label: 'Driver Management' },
        { path: '/admin/fuel', icon: '⛽', label: 'Fuel Replenishment' },
        { path: '/admin/reports', icon: '📈', label: 'Reports & Analytics' },
        { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
    ];

    const handleLogout = () => {
        // Clear tokens from localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Navigate to login page
        navigate('/');
    };

    return (
        <aside className="d-flex flex-column vh-100 bg-light p-3 border-end position-fixed" style={{ width: '250px' }}>
            {/* User Profile Section */}
            <div className="d-flex align-items-center mb-4 p-3 bg-white rounded shadow-sm">
                {/* Display user's profile picture or default avatar */}
                <div className="position-relative">
                    <img
                        src={user?.picture || '/Images/avatar.png'} // Use default avatar if no picture is available
                        alt="Profile"
                        className="rounded-circle me-3"
                        width="50"
                        height="50"
                    />
                    {/* Add a small badge for online status (optional) */}
                    <span className="position-absolute bottom-0 end-0 bg-success rounded-circle p-1 border border-2 border-white"></span>
                </div>
                <div>
                    <h2 className="h6 mb-0 fw-bold">{user?.name || 'Loading...'}</h2> {/* Display user's name */}
                    <p className="text-muted small mb-0">{user?.role || 'Admin'}</p> {/* Display user's role (optional) */}
                </div>
            </div>

            {/* Menu Section */}
            <nav className="flex-grow-1">
                <p className="text-secondary small mb-3 px-3">MENU</p>
                <ul className="nav flex-column">
                    {menuItems.map((item) => (
                        <li key={item.path} className="nav-item mb-2">
                            <Link
                                to={item.path}
                                className={`nav-link d-flex align-items-center py-2 px-3 rounded ${location.pathname === item.path ? 'bg-primary text-white' : 'text-dark hover-bg-light'
                                    }`}
                                style={{ transition: 'background-color 0.2s' }}
                            >
                                <span className="me-3 fs-5">{item.icon}</span>
                                <span className="fs-6">{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Logout Section */}
            <div className="mt-auto p-3 bg-white rounded shadow-sm">
                <button
                    onClick={handleLogout}
                    className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-start py-2 px-3"
                >
                    <span className="me-2 fs-5">🚪</span>
                    <span className="fs-6">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;