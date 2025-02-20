import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Alert } from 'react-bootstrap';


interface Station {
    id?: number;
    name: string;
    location: string;
}

interface StationCardProps {
    station: Station;
    onEdit: (station: Station) => void;
    onDelete: (id: number) => void;
}

interface PriceFormData {
    stationId: number;
    fuelType: string;
    price: number;
}

interface AuthState {
    isAuthenticated: boolean;
    authChecked: boolean;
}

// API configuration
const API_BASE_URL = '/';
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Function to get stored access token
const getStoredAccessToken = (): string | null => {
    return localStorage.getItem('accessToken');
};

// Axios request interceptor
axiosInstance.interceptors.request.use((config) => {
    const accessToken = getStoredAccessToken();
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Axios response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken: refreshToken
                    });

                    if (response.data.accessToken) {
                        localStorage.setItem('accessToken', response.data.accessToken);
                        axiosInstance.defaults.headers.common['Authorization'] =
                            `Bearer ${response.data.accessToken}`;
                        return axiosInstance(originalRequest);
                    }
                }
            } catch (refreshError) {
                console.error('Error refreshing token:', refreshError);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

const StationCard: React.FC<StationCardProps> = ({ station, onEdit, onDelete }) => (
    <div className="card mb-3">
        <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="card-title">{station.name}</h5>
                    <p className="card-text text-muted">
                        <i className="bi bi-geo-alt"></i> {station.location}
                    </p>
                </div>
                <div>
                    <Button
                        variant="outline-primary"
                        className="me-2"
                        onClick={() => onEdit(station)}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outline-danger"
                        onClick={() => station.id && onDelete(station.id)}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    </div>
);

const StationManagement: React.FC = () => {
    const [stations, setStations] = useState<Station[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentStation, setCurrentStation] = useState<Station | null>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        authChecked: false
    });

    const [formData, setFormData] = useState<Station>({
        name: '',
        location: '',
    });

    const [priceFormData, setPriceFormData] = useState<PriceFormData>({
        stationId: 0,
        fuelType: 'petrol',
        price: 0
    });

    useEffect(() => {
        checkAuthAndFetchStations();
    }, []);

    const checkAuthAndFetchStations = async () => {
        const accessToken = getStoredAccessToken();
        if (!accessToken) {
            setAuthState({
                isAuthenticated: false,
                authChecked: true
            });
            setError('Please log in to access station management.');
            return;
        }

        setAuthState({
            isAuthenticated: true,
            authChecked: true
        });
        await fetchStations();
    };

    const handleError = (error: any) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            const errorMessage = 'Your session has expired. Please log in again.';
            setError(errorMessage);
            setAuthState({
                isAuthenticated: false,
                authChecked: true
            });
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            return;
        }

        const errorMessage = error.response?.data?.message ||
            error.message ||
            'An unexpected error occurred';
        setError(errorMessage);
    };

    const fetchStations = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/stations/all');
            setStations(response.data);
            setError('');
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStation = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axiosInstance.post('stations/create', formData);
            setStations([...stations, response.data]);
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentStation?.id) return;

        setLoading(true);
        try {
            const response = await axiosInstance.put(
                `stations/update/${currentStation.id}`,
                formData
            );
            setStations(stations.map(station =>
                station.id === currentStation.id ? response.data : station
            ));
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStation = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this station?')) {
            return;
        }

        setLoading(true);
        try {
            await axiosInstance.delete(`stations/delete/${id}`);
            setStations(stations.filter(station => station.id !== id));
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSetPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axiosInstance.post('fuel-prices/setPrice', priceFormData);
            setIsPriceModalOpen(false);
            resetPriceForm();
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePriceInputChange = (
        e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
    ) => {
        const { name, value } = e.target;
        setPriceFormData(prev => ({
            ...prev,
            [name]: name === 'price' ? Number(value) : value
        }));
    };

    const handleEdit = (station: Station) => {
        setCurrentStation(station);
        setFormData({
            name: station.name,
            location: station.location
        });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            location: '',
        });
        setCurrentStation(null);
        setIsEditing(false);
    };

    const resetPriceForm = () => {
        setPriceFormData({
            stationId: 0,
            fuelType: 'petrol',
            price: 0
        });
    };

    if (!authState.authChecked) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!authState.isAuthenticated) {
        return (
            <div className="container mt-5">
                <Alert variant="warning">
                    <Alert.Heading>Authentication Required</Alert.Heading>
                    <p>
                        You need to be logged in to access the Station Management system.
                        Please log in with your credentials to continue.
                    </p>
                    <hr />
                    <div className="d-flex justify-content-end">
                        <Button
                            variant="primary"
                            onClick={() => window.location.href = '/login'}
                        >
                            Go to Login
                        </Button>
                    </div>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container-fluid bg-light min-vh-100" style={{width: '82%', margin: '0px 260px'}}>
            <div className="row">
                <div className="col-md-10 offset-md-1 py-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 className="h3">Station Management</h1>
                            <p className="text-muted">Manage your fuel stations</p>
                        </div>
                        <div>
                            <Button
                                variant="primary"
                                className="me-2"
                                onClick={() => {
                                    resetForm();
                                    setIsModalOpen(true);
                                }}
                                disabled={loading}
                            >
                                Add New Station
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setIsPriceModalOpen(true)}
                                disabled={loading}
                            >
                                Price Settings
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError('')}>
                            <Alert.Heading>Error</Alert.Heading>
                            <p>{error}</p>
                            {(error.includes('session has expired') || error.includes('Please log in')) && (
                                <div className="mt-2">
                                    <Button
                                        variant="outline-danger"
                                        onClick={() => window.location.href = '/login'}
                                    >
                                        Go to Login
                                    </Button>
                                </div>
                            )}
                        </Alert>
                    )}

                    {loading && (
                        <div className="text-center py-4">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    )}

                    <div className="station-list">
                        {stations.map((station) => (
                            <StationCard
                                key={station.id}
                                station={station}
                                onEdit={handleEdit}
                                onDelete={handleDeleteStation}
                            />
                        ))}
                    </div>

                    {/* Station Modal */}
                    <Modal show={isModalOpen} onHide={() => {
                        setIsModalOpen(false);
                        resetForm();
                    }}>
                        <Modal.Header closeButton>
                            <Modal.Title>
                                {isEditing ? 'Edit Station' : 'Add New Station'}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <form onSubmit={isEditing ? handleUpdateStation : handleCreateStation}>
                                <div className="mb-3">
                                    <label className="form-label">Station Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="d-flex justify-content-end gap-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            resetForm();
                                        }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading}
                                    >
                                        {loading ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
                                    </Button>
                                </div>
                            </form>
                        </Modal.Body>
                    </Modal>

                    {/* Price Settings Modal */}
                    <Modal show={isPriceModalOpen} onHide={() => {
                        setIsPriceModalOpen(false);
                        resetPriceForm();
                    }}>
                        <Modal.Header closeButton>
                            <Modal.Title>Price Settings</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <form onSubmit={handleSetPrice}>
                                <div className="mb-3">
                                    <label className="form-label">Station</label>
                                    <select
                                        name="stationId"
                                        value={priceFormData.stationId}
                                        onChange={handlePriceInputChange}
                                        className="form-select"
                                        required
                                        disabled={loading}
                                    >
                                        <option value="">Select Station</option>
                                        {stations.map((station) => (
                                            <option key={station.id} value={station.id}>
                                                {station.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Fuel Type</label>
                                    <select
                                        name="fuelType"
                                        value={priceFormData.fuelType}
                                        onChange={handlePriceInputChange}
                                        className="form-select"
                                        required
                                        disabled={loading}
                                    >
                                        <option value="petrol">Petrol</option>
                                        <option value="diesel">Diesel</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Price</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={priceFormData.price}
                                        onChange={handlePriceInputChange}
                                        className="form-control"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="d-flex justify-content-end gap-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setIsPriceModalOpen(false);
                                            resetPriceForm();
                                        }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading}
                                    >
                                        {loading ? 'Saving...' : 'Set Price'}
                                    </Button>
                                </div>
                            </form>
                        </Modal.Body>
                    </Modal>
                </div>
            </div>
        </div>
    );
};

export default StationManagement;