import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Corrected import

// Create axios instance with default config
const api = axios.create({
    baseURL: '/',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Interfaces for data types
interface LoginFormData {
    email: string;
    password: string;
}

interface TokenData {
    role: string;
}

interface TokenResponse {
    token: {
        accessToken: string;
        refreshToken: string;
    };
}

const LoginPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: ''
    });
    const [error, setError] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post<TokenResponse>('api/auth/login', formData);
            console.log('Full Response:', response);

            // Check if accessToken is present
            if (!response.data?.token?.accessToken) {
                console.error('No access token received:', response.data);
                throw new Error('No access token received');
            }

            const accessToken = response.data.token.accessToken;
            const refreshToken = response.data.token.refreshToken;

            try {
                // Decode access token to get user role
                const decodedToken = jwtDecode(accessToken) as TokenData;
                console.log('Decoded token:', decodedToken);

                if (!decodedToken.role) {
                    throw new Error('No role found in token');
                }

                // Store tokens in localStorage
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);

                // Route based on role
                switch (decodedToken.role) {
                    case 'admin':
                        navigate('/admin/dashboard');
                        break;
                    case 'station_worker':
                        navigate('/station/dashboard');
                        break;
                    case 'viewer':
                        navigate('/boss/dashboard');
                        break;
                    default:
                        setError(`Invalid role: ${decodedToken.role}`);
                        break;
                }
            } catch (decodeError) {
                console.error('Token decode error:', decodeError);
                setError('Invalid token format');
            }

        } catch (err) {
            console.error('Login error:', err);
            if (axios.isAxiosError(err)) {
                const errorMessage = err.response?.data?.message || err.message;
                console.error('Axios error details:', {
                    status: err.response?.status,
                    data: err.response?.data,
                    message: errorMessage
                });
                setError(`Login failed: ${errorMessage}`);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred');
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
            <div className="row w-100">
                {/* Left Section - Form */}
                <div className="col-lg-6 d-flex align-items-center justify-content-center">
                    <div className="w-75">
                        <h1 className="fw-bold mb-2">Welcome Back 👋</h1>
                        <p className="text-muted mb-4">Sign in to access your dashboard</p>

                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">
                                    Email <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="form-control"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="password" className="form-label">
                                    Password <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    className="form-control"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="d-flex justify-content-between mb-3">
                                <Link to="/change-password" className="text-primary text-decoration-none">
                                    
                                </Link>
                                <Link to="/forgot" className="text-danger text-decoration-none">
                                    Forgot Password 😯?
                                </Link>
                            </div>

                            <button type="submit" className="btn btn-primary w-100">
                                Login
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Section - Image */}
                <div className="col-lg-6 d-none d-lg-block">
                    <img src="/Images/sideImage.jpg" alt="Fuel pump" className="img-fluid w-100 h-100 object-fit-cover" />
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
