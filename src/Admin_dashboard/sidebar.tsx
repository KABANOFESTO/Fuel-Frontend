import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

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
    const [user, setUser] = useState<User | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Check if screen is mobile on mount and when window resizes
    useEffect(() => {
        const handleResize = () => {
            // Auto-collapse sidebar on small screens
            setIsCollapsed(window.innerWidth < 992);
            // Close mobile menu when resizing to larger screens
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };

        // Set initial state
        handleResize();

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Clean up
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    throw new Error('No access token found');
                }

                const decodedToken = jwtDecode<DecodedToken>(token);

                const response = await axios.get(`/api/users/${decodedToken.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                setUser(response.data);
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
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/');
    };

    // Toggle sidebar collapse state
    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Calculate sidebar width based on state
    const sidebarWidth = isCollapsed ? '80px' : '250px';

    // Determine if we should render mobile or desktop version
    typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <>
            {/* Mobile toggle button - visible only on small screens */}
            <button
                className="btn btn-primary d-md-none position-fixed top-0 start-0 m-3 z-3"
                onClick={toggleMobileMenu}
                style={{ zIndex: 1030 }}
            >
                {isMobileMenuOpen ? '✕' : '☰'}
            </button>

            {/* Desktop Sidebar */}
            <aside
                className={`d-none d-md-flex flex-column vh-100 bg-light border-end position-fixed transition-all ${isMobileMenuOpen ? 'show' : ''}`}
                style={{
                    width: sidebarWidth,
                    transition: 'width 0.3s ease-in-out',
                    zIndex: 1020
                }}
            >
                {/* Collapse toggle button */}
                <button
                    className="btn btn-sm btn-light position-absolute top-0 end-0 m-2"
                    onClick={toggleSidebar}
                >
                    {isCollapsed ? '→' : '←'}
                </button>

                {/* User Profile Section */}
                <div className={`d-flex ${isCollapsed ? 'justify-content-center' : 'align-items-center'} mb-4 p-3 bg-white rounded shadow-sm`}>
                    <div className="position-relative">
                        <img
                            src={user?.picture || '/Images/avatar.png'}
                            alt="Profile"
                            className="rounded-circle"
                            width="50"
                            height="50"
                        />
                        <span className="position-absolute bottom-0 end-0 bg-success rounded-circle p-1 border border-2 border-white"></span>
                    </div>
                    {!isCollapsed && (
                        <div className="ms-3">
                            <h2 className="h6 mb-0 fw-bold">{user?.name || 'Loading...'}</h2>
                            <p className="text-muted small mb-0">{user?.role || 'Admin'}</p>
                        </div>
                    )}
                </div>

                {/* Menu Section */}
                <nav className="flex-grow-1 overflow-auto">
                    {!isCollapsed && <p className="text-secondary small mb-3 px-3">MENU</p>}
                    <ul className="nav flex-column">
                        {menuItems.map((item) => (
                            <li key={item.path} className="nav-item mb-2">
                                <Link
                                    to={item.path}
                                    className={`nav-link d-flex ${isCollapsed ? 'justify-content-center' : 'align-items-center'} py-2 px-3 rounded ${location.pathname === item.path ? 'bg-primary text-white' : 'text-dark hover-bg-light'
                                        }`}
                                    style={{ transition: 'background-color 0.2s' }}
                                    title={isCollapsed ? item.label : ''}
                                >
                                    <span className={`${isCollapsed ? '' : 'me-3'} fs-5`}>{item.icon}</span>
                                    {!isCollapsed && <span className="fs-6">{item.label}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Logout Section */}
                <div className="mt-auto p-3 bg-white rounded shadow-sm">
                    <button
                        onClick={handleLogout}
                        className={`btn btn-outline-danger w-100 d-flex ${isCollapsed ? 'justify-content-center' : 'align-items-center justify-content-start'} py-2 px-3`}
                        title={isCollapsed ? 'Logout' : ''}
                    >
                        <span className={`${isCollapsed ? '' : 'me-2'} fs-5`}>🚪</span>
                        {!isCollapsed && <span className="fs-6">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar - overlay style when activated */}
            <div
                className={`d-md-none position-fixed vh-100 bg-light border-end transition-all ${isMobileMenuOpen ? 'show' : 'hide'}`}
                style={{
                    width: '250px',
                    transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s ease-in-out',
                    zIndex: 1020,
                    top: 0,
                    left: 0
                }}
            >
                {/* User Profile Section */}
                <div className="d-flex align-items-center mb-4 p-3 mt-5 bg-white rounded shadow-sm">
                    <div className="position-relative">
                        <img
                            src={user?.picture || '/Images/avatar.png'}
                            alt="Profile"
                            className="rounded-circle me-3"
                            width="50"
                            height="50"
                        />
                        <span className="position-absolute bottom-0 end-0 bg-success rounded-circle p-1 border border-2 border-white"></span>
                    </div>
                    <div>
                        <h2 className="h6 mb-0 fw-bold">{user?.name || 'Loading...'}</h2>
                        <p className="text-muted small mb-0">{user?.role || 'Admin'}</p>
                    </div>
                </div>

                {/* Menu Section */}
                <nav className="flex-grow-1 overflow-auto">
                    <p className="text-secondary small mb-3 px-3">MENU</p>
                    <ul className="nav flex-column">
                        {menuItems.map((item) => (
                            <li key={item.path} className="nav-item mb-2">
                                <Link
                                    to={item.path}
                                    className={`nav-link d-flex align-items-center py-2 px-3 rounded ${location.pathname === item.path ? 'bg-primary text-white' : 'text-dark hover-bg-light'
                                        }`}
                                    style={{ transition: 'background-color 0.2s' }}
                                    onClick={() => setIsMobileMenuOpen(false)} // Close mobile menu after navigation
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
            </div>

            {/* Dark overlay for mobile menu */}
            {isMobileMenuOpen && (
                <div
                    className="position-fixed top-0 left-0 w-100 h-100 bg-dark d-md-none"
                    style={{
                        opacity: 0.5,
                        zIndex: 1010
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}
        </>
    );
};

export default Sidebar;