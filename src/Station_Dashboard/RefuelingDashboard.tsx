import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Fuel, Car, User, Phone, X, Check } from 'lucide-react';
import axios from 'axios';

const RefuelingDashboard = () => {
    const [quantity, setQuantity] = useState('');
    const [plateNumber, setPlateNumber] = useState('');
    const [showDriverInfo, setShowDriverInfo] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [unitPrice, setUnitPrice] = useState<number | null>(null);
    const [selectedStation, setSelectedStation] = useState<number>(2);
    const [selectedFuelType, setSelectedFuelType] = useState<string>('diesel');
    const [vehicleDetails, setVehicleDetails] = useState<any>(null);

    // Mock data for stations and fuel types (replace with API data if available)
    const stations = [
        { id: 1, name: 'Station 1' },
        { id: 2, name: 'Station 2' },
        { id: 3, name: 'Station 3' }
    ];

    const fuelTypes = [
        { id: 'diesel', name: 'Diesel' },
        { id: 'petrol', name: 'Petrol' }
    ];

    const fetchFuelPrice = async (stationId: number, fuelType: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No access token found');
            }

            const priceResponse = await axios.get(
                '/api/fuel-prices/getfuelprice',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        stationId,
                        fuelType
                    }
                }
            );

            if (priceResponse.data) {
                setUnitPrice(priceResponse.data);
            } else {
                throw new Error('Failed to fetch fuel price.');
            }
        } catch (error) {
            console.error('Error fetching fuel price:', error);
            setError('Error fetching fuel price. Please try again.');
        }
    };

    // Fetch fuel price when station or fuel type changes
    useEffect(() => {
        if (showDriverInfo && transactions.length === 0) {
            fetchFuelPrice(selectedStation, selectedFuelType);
        }
    }, [selectedStation, selectedFuelType, showDriverInfo, transactions.length]);

    const handleSearch = async () => {
        if (!plateNumber.trim()) {
            setError('Please enter a vehicle plate number.');
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No access token found');
            }

            // First, fetch vehicle details
            const vehicleResponse = await axios.get(
                `/api/vehicles/plate/${plateNumber}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (vehicleResponse.data.error === "Vehicle not found") {
                setError('Vehicle not found in the system.');
                setShowDriverInfo(false);
                return;
            }

            setVehicleDetails(vehicleResponse.data);

            // Then fetch transaction history
            const transactionsResponse = await axios.get(
                `/api/fuel-transactions/vehicle/${plateNumber}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (transactionsResponse.data.length > 0) {
                setTransactions(transactionsResponse.data);
                setShowDriverInfo(true);
                setError('');
                setSuccess('Vehicle has already been refueled.');
            } else {
                setTransactions([]);
                setShowDriverInfo(true);
                setError('No refueling records found for this vehicle.');
                setSuccess('');
                await fetchFuelPrice(selectedStation, selectedFuelType);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Error fetching data. Please try again.');
            setSuccess('');
            setShowDriverInfo(false);
        }
    };

    const totalAmount = quantity && unitPrice ? parseFloat(quantity) * unitPrice : 0;

    interface TransactionResponse {
        stationId: number;
        vehiclePlateNumber: string;
        driverId: number;
        fuel_type: string;
        total_litres: number;
    }

    const handleRecordTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!quantity) {
            setError('Please enter the quantity.');
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No access token found');
            }

            axios.post<TransactionResponse>(
                '/api/fuel-transactions/record',
                {
                    stationId: selectedStation,
                    vehiclePlateNumber: plateNumber,
                    driverId: vehicleDetails?.driverId || 2, // Use actual driver ID from vehicle details
                    fuel_type: selectedFuelType,
                    total_litres: parseFloat(quantity)
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setSuccess('Fuel transaction recorded successfully!');
            setError('');
            setQuantity('');
        } catch (error) {
            console.error('Error recording transaction:', error);
            setError('Error recording transaction. Please try again.');
            setSuccess('');
        }
    };

    return (
        <div className="min-vh-100 py-4 px-3 px-md-4 px-lg-5" style={{ background: 'linear-gradient(to bottom right, #EEF2FF, #F9FAFB)' }}>
            <div className="container-fluid max-width-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-5">
                    <h1 className="display-4 fw-bold text-dark mb-2">
                        Global Fleet Refueling System
                    </h1>
                    <p className="text-secondary">Manage vehicle refueling efficiently across borders</p>
                </div>

                {/* Search Card */}
                <div className="card shadow mb-4 hover-shadow">
                    <div className="card-header bg-white border-bottom-0 py-3">
                        <h5 className="card-title mb-0 d-flex align-items-center">
                            <Car className="me-2 text-primary" size={20} />
                            Vehicle Lookup
                        </h5>
                    </div>
                    <div className="card-body">
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Enter Vehicle Plate Number"
                                className="form-control form-control-lg"
                                value={plateNumber}
                                onChange={(e) => setPlateNumber(e.target.value)}
                            />
                            <button
                                onClick={handleSearch}
                                className="btn btn-primary d-flex align-items-center"
                            >
                                <Search className="me-2" size={16} />
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                {/* Driver Information */}
                {showDriverInfo && vehicleDetails && (
                    <div className="card shadow mb-4 hover-shadow">
                        <div className="card-header bg-white border-bottom-0 py-3">
                            <h5 className="card-title mb-0 d-flex align-items-center">
                                <User className="me-2 text-primary" size={20} />
                                Driver Information
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center">
                                        <User className="text-secondary me-2" size={16} />
                                        <div>
                                            <p className="text-secondary small mb-0">Driver Name</p>
                                            <p className="fw-medium mb-0">{vehicleDetails.driverName || 'KABANO Festo'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center">
                                        <Phone className="text-secondary me-2" size={16} />
                                        <div>
                                            <p className="text-secondary small mb-0">Contact</p>
                                            <p className="fw-medium mb-0">{vehicleDetails.driverContact || '+250785206973'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Refueling Form */}
                {showDriverInfo && transactions.length === 0 && (
                    <div className="card shadow hover-shadow">
                        <div className="card-header bg-white border-bottom-0 py-3">
                            <h5 className="card-title mb-0 d-flex align-items-center">
                                <Fuel className="me-2 text-primary" size={20} />
                                Record Refueling
                            </h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleRecordTransaction}>
                                <div className="row g-4 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label fw-medium text-secondary small">
                                            Station
                                        </label>
                                        <select
                                            className="form-select"
                                            value={selectedStation}
                                            onChange={(e) => setSelectedStation(Number(e.target.value))}
                                        >
                                            {stations.map(station => (
                                                <option key={station.id} value={station.id}>
                                                    {station.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-medium text-secondary small">
                                            Fuel Type
                                        </label>
                                        <select
                                            className="form-select"
                                            value={selectedFuelType}
                                            onChange={(e) => setSelectedFuelType(e.target.value)}
                                        >
                                            {fuelTypes.map(type => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-medium text-secondary small">
                                            Plate Number
                                        </label>
                                        <input
                                            type="text"
                                            value={plateNumber}
                                            disabled
                                            className="form-control bg-light"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-medium text-secondary small">
                                            Quantity (Liters)
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Enter quantity"
                                            className="form-control"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-medium text-secondary small">
                                            Unit Price (RWF)
                                        </label>
                                        <input
                                            type="text"
                                            value={unitPrice ? unitPrice.toLocaleString() : 'Loading...'}
                                            disabled
                                            className="form-control bg-light"
                                        />
                                    </div>
                                </div>

                                <div className="bg-light p-3 rounded mb-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="fw-medium text-secondary small">Total Amount</span>
                                        <span className="fs-5 fw-bold text-primary">
                                            {totalAmount.toLocaleString()} RWF
                                        </span>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end gap-3">
                                    <button
                                        type="button"
                                        className="btn btn-light d-flex align-items-center"
                                        onClick={() => {
                                            setShowDriverInfo(false);
                                            setPlateNumber('');
                                            setQuantity('');
                                            setError('');
                                            setSuccess('');
                                            setVehicleDetails(null);
                                        }}
                                    >
                                        <X className="me-2" size={16} />
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary d-flex align-items-center"
                                    >
                                        <ArrowRight className="me-2" size={16} />
                                        Record Fuel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Success and Error Messages */}
                {success && (
                    <div className="alert alert-success d-flex align-items-center mt-4">
                        <Check className="me-2" size={16} />
                        {success}
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger d-flex align-items-center mt-4">
                        <X className="me-2" size={16} />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RefuelingDashboard;