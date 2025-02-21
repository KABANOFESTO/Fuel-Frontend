import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Edit, Trash2 } from 'lucide-react';

interface Vehicle {
    id?: number;
    plateNumber: string;
    model: string;
    fuelType: string;
    status?: string;
    driver?: string;
    contact?: string;
}

const VehicleManagement: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [searchPlate, setSearchPlate] = useState('');
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [formData, setFormData] = useState<Vehicle>({
        plateNumber: '',
        model: '',
        fuelType: ''
    });

    const getConfig = () => {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            console.error('No access token found in localStorage');
        }

        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            console.log('Fetching vehicles with config:', getConfig());
            const response = await axios.get('/api/vehicles/all', getConfig());
            console.log('Fetched vehicles:', response.data);
            setVehicles(response.data);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            handleApiError(error);
        }
    };

    const searchVehicle = async () => {
        if (!searchPlate.trim()) {
            fetchVehicles();
            return;
        }
        try {
            console.log('Searching vehicle with plate:', searchPlate);
            const response = await axios.get(
                `/api/vehicles/plate/${searchPlate}`,
                getConfig()
            );
            console.log('Search result:', response.data);
            if (response.data) {
                setVehicles([response.data]);
            } else {
                setVehicles([]);
                alert('No vehicle found with this plate number');
            }
        } catch (error) {
            console.error('Error searching vehicle:', error);
            handleApiError(error);
            setVehicles([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log('Form data being submitted:', formData);

            // Validate plate number format
            const plateNumberRegex = /^[A-Z]{3}\s\d{3}[A-Z]$/;
            if (!plateNumberRegex.test(formData.plateNumber)) {
                alert('Please enter a valid plate number format (e.g., RAF 660B)');
                return;
            }

            // Validate model
            if (formData.model.trim().length < 3) {
                alert('Vehicle model must be at least 3 characters long');
                return;
            }

            // Validate fuel type
            if (!['diesel', 'petrol'].includes(formData.fuelType)) {
                alert('Please select a valid fuel type');
                return;
            }

            // Create a payload with validated data
            const payload = {
                plateNumber: formData.plateNumber.toUpperCase(),
                model: formData.model.trim(),
                fuelType: formData.fuelType
            };

            if (editingVehicle?.id) {
                const response = await axios.put(
                    `/api/vehicles/update/${editingVehicle.id}`,
                    payload,
                    getConfig()
                );
                console.log('Update response:', response.data);
            } else {
                const response = await axios.post(
                    '/api/vehicles/register',
                    payload,
                    getConfig()
                );
                console.log('Registration response:', response.data);
            }

            await fetchVehicles();
            toggleModal();
            setFormData({ plateNumber: '', model: '', fuelType: '' });
            alert(editingVehicle ? 'Vehicle updated successfully!' : 'Vehicle registered successfully!');
        } catch (error: any) {
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.config?.headers
            });

            if (error.response?.status === 400) {
                const errorMessage = error.response.data.message || 'Invalid vehicle data. Please check your inputs.';
                alert(errorMessage);
            } else if (error.response?.status === 401) {
                alert('Session expired. Please login again.');
            } else if (error.response?.status === 409) {
                alert('Vehicle with this plate number already exists.');
            } else {
                alert('Error saving vehicle. Please try again.');
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this vehicle?')) {
            try {
                console.log('Deleting vehicle:', id);
                await axios.delete(
                    `/api/vehicles/delete/${id}`,
                    getConfig()
                );
                console.log('Vehicle deleted successfully');
                await fetchVehicles();
                alert('Vehicle deleted successfully!');
            } catch (error) {
                console.error('Error deleting vehicle:', error);
                handleApiError(error);
                alert('Error deleting vehicle. Please try again.');
            }
        }
    };

    const handleApiError = (error: any) => {
        console.error('API Error:', error.response?.data);
        if (error.response?.status === 401) {
            console.log('Unauthorized - redirecting to login');
            // Add your login redirect logic here
            // window.location.href = '/login';
        }
    };

    const handleEdit = (vehicle: Vehicle) => {
        console.log('Editing vehicle:', vehicle);
        setEditingVehicle(vehicle);
        setFormData({
            plateNumber: vehicle.plateNumber,
            model: vehicle.model,
            fuelType: vehicle.fuelType
        });
        setIsModalOpen(true);
    };

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        if (!isModalOpen) {
            setEditingVehicle(null);
            setFormData({ plateNumber: '', model: '', fuelType: '' });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="container py-4">
            <header className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex gap-2 w-50">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search for Vehicle by Plate Number"
                        value={searchPlate}
                        onChange={(e) => setSearchPlate(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchVehicle()}
                    />
                    <button className="btn btn-secondary" onClick={searchVehicle}>
                        Search
                    </button>
                </div>
                <button className="btn btn-primary" onClick={toggleModal}>+ Add New Vehicle</button>
            </header>

            <div className="card">
                <div className="card-body">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Plate Number</th>
                                <th>Model</th>
                                <th>Fuel Type</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.map((vehicle, index) => (
                                <tr key={index}>
                                    <td>{vehicle.plateNumber}</td>
                                    <td>{vehicle.model}</td>
                                    <td>
                                        <span className={`badge ${vehicle.fuelType === 'petrol' ? 'bg-success' : 'bg-info'}`}>
                                            {vehicle.fuelType}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge bg-success">
                                            {vehicle.status || 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-link p-0 me-2"
                                            onClick={() => handleEdit(vehicle)}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="btn btn-link text-danger p-0"
                                            onClick={() => vehicle.id && handleDelete(vehicle.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal show d-block" tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                                </h5>
                                <button type="button" className="btn-close" onClick={toggleModal}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <input
                                            type="text"
                                            placeholder="Enter vehicle model"
                                            className="form-control"
                                            name="model"
                                            value={formData.model}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <input
                                            type="text"
                                            placeholder="Enter Plate Number (e.g., RAF 660B)"
                                            className="form-control"
                                            name="plateNumber"
                                            value={formData.plateNumber}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <select
                                            className="form-select"
                                            name="fuelType"
                                            value={formData.fuelType}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select fuel type</option>
                                            <option value="diesel">diesel</option>
                                            <option value="petrol">petrol</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={toggleModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingVehicle ? 'Update' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleManagement;