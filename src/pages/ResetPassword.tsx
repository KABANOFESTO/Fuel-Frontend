import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const ResetPassword = () => {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState('');

    useEffect(() => {
        // Get token from URL query parameters
        const queryParams = new URLSearchParams(location.search);
        const tokenParam = queryParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError('Invalid or missing reset token');
        }
    }, [location]);

    const validatePassword = (password: string) => {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (!validatePassword(formData.password)) {
            setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
            return;
        }

        setIsLoading(true);

        try {
            axios.post(
                `/api/auth/reset-password?token=${token}`,
                {
                    newPassword: formData.password
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            setSuccess('Password has been reset successfully!');
            setFormData({ password: '', confirmPassword: '' });

            // Redirect to login page after 2 seconds
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error: any) {
            setError(
                error.response?.data?.message ||
                'Failed to reset password. Please try again.'
            );
        } finally {
            setIsLoading(false);
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
                        <h1 className="fw-bold mb-2">Reset Your Password 🔒</h1>
                        <p className="text-muted mb-4">Enter a new password to reset your account.</p>

                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="alert alert-success" role="alert">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="password" className="form-label">
                                    New Password <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    className="form-control"
                                    placeholder="Enter new password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                />
                                <small className="text-muted">
                                    Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.
                                </small>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="confirmPassword" className="form-label">
                                    Confirm Password <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className="form-control"
                                    placeholder="Re-enter new password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                disabled={isLoading || !token}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Resetting Password...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>

                        <div className="mt-3 text-center">
                            <Link to="/" className="text-primary text-decoration-none">Back to Login</Link>
                        </div>
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

export default ResetPassword;