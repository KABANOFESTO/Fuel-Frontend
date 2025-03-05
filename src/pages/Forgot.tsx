import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            axios.post(
                '/api/auth/forgot-password',
                { email },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            setSuccess('Password reset link has been sent to your email!');
            setEmail(''); // Clear the email field after success
        } catch (error: any) {
            setError(
                error.response?.data?.message ||
                'Failed to send reset link. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
            <div className="row w-100">
                {/* Left Section - Form */}
                <div className="col-lg-6 d-flex align-items-center justify-content-center">
                    <div className="w-75">
                        <h1 className="fw-bold mb-2">Forgot Password? 🤔</h1>
                        <p className="text-muted mb-4">Enter your email to receive a password reset link.</p>

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
                                <label htmlFor="email" className="form-label">
                                    Email <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="form-control"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>

                        <div className="mt-3 text-center">
                            <Link to="/login" className="text-primary text-decoration-none">Back to Login</Link>
                        </div>
                        <div className="mt-3 text-center">
                            <Link to="/register" className="text-primary text-decoration-none">Trick</Link>
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

export default ForgotPassword;