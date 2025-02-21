import React, { useState, useEffect } from "react";
import {
    ArrowRight,
    Search,
    Fuel,
    Car,
    User,
    Phone,
    X,
    Check,
} from "lucide-react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

// TypeScript interfaces
interface UserData {
    id: number;
    stationId: number;
    stationName: string; // Add this line
    role: string;
}
interface VehicleDetails {
    id: number;
    plateNumber: string;
    driverId: number;
    driverName: string; // Added
    driverContact: string; // Added
    fuelType: string;
}

interface Transaction {
    id: number;
    stationId: number;
    vehiclePlateNumber: string;
    driverId: number;
    fuel_type: string;
    total_litres: number;
    timestamp: string;
}

interface FuelPriceResponse {
    price: number;
}

const RefuelingDashboard = () => {
    // State management
    const [quantity, setQuantity] = useState<string>("");
    const [plateNumber, setPlateNumber] = useState<string>("");
    const [showDriverInfo, setShowDriverInfo] = useState<boolean>(false);
    const [, setTransactions] = useState<Transaction[]>([]);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [unitPrice, setUnitPrice] = useState<number | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails | null>(
        null
    );
    const [loading, setLoading] = useState<boolean>(false);
    const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(true);
    const [isLoadingFuelPrice, setIsLoadingFuelPrice] = useState<boolean>(false);

    // Fetch user data on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            setIsLoadingUserData(true);
            try {
                const token = localStorage.getItem("accessToken");
                if (!token) {
                    throw new Error("No access token found");
                }

                const decodedToken: any = jwtDecode(token);
                if (!decodedToken.id) {
                    throw new Error("Invalid token format");
                }

                // Fetch user data
                const userResponse = await axios.get<UserData>(
                    `http://localhost:5000/api/users/${decodedToken.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!userResponse.data || !userResponse.data.stationId) {
                    throw new Error("Invalid user data received");
                }

                // Fetch station name using stationId
                const stationResponse = await axios.get(
                    `http://localhost:5000/api/stations/${userResponse.data.stationId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const stationName = stationResponse.data.name;
                console.log(stationResponse.data);
                // Update userData state with stationName
                setUserData({
                    ...userResponse.data,
                    stationName: stationName, // Add stationName to userData
                });
            } catch (error) {
                console.error("Error fetching user data:", error);
                setError("Failed to fetch user data. Please refresh the page.");
            } finally {
                setIsLoadingUserData(false);
            }
        };

        fetchUserData();
    }, []);

    // Fetch fuel price when vehicle details change
    useEffect(() => {
        const fetchFuelPrice = async () => {
            if (!userData?.stationId || !vehicleDetails?.fuelType) {
                setUnitPrice(null);
                return;
            }
            //   console.log(
            //     `StationId: ${userData.stationId} and fueltype: ${vehicleDetails.fuelType}`
            //   );
            setIsLoadingFuelPrice(true);
            try {
                const token = localStorage.getItem("accessToken");
                if (!token) throw new Error("No access token found");

                const response = await axios.get<FuelPriceResponse>(
                    `http://localhost:5000/api/fuel-prices/getfuelprice?stationId=${userData.stationId}&fuelType=${vehicleDetails.fuelType}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                // console.log(`my res:${response.data.price}`);
                // console.log(
                //   `stationId:${userData}, fueltype:${vehicleDetails.fuelType}`
                // );
                if (response.data) {
                    setUnitPrice(response.data.price);
                } else {
                    throw new Error("Invalid fuel price data received");
                }
            } catch (error) {
                console.error("Error fetching fuel price:", error);
                setError("Failed to fetch fuel price.");
                setUnitPrice(null);
            } finally {
                setIsLoadingFuelPrice(false);
            }
        };

        fetchFuelPrice();
    }, [userData?.stationId, vehicleDetails?.fuelType]);

    // Handle vehicle search
    const handleSearch = async () => {
        if (!plateNumber.trim()) {
            setError("Please enter a vehicle plate number.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");
        setVehicleDetails(null);
        setTransactions([]);

        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token found");

            const formattedPlate = plateNumber.trim().replace(/\s+/g, " ");
            const encodedPlate = encodeURIComponent(formattedPlate);

            // Step 1: Fetch vehicle details using the plate number
            const vehicleResponse = await axios.get<VehicleDetails>(
                `http://localhost:5000/api/vehicles/plate/${encodedPlate}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!vehicleResponse.data || !vehicleResponse.data.id) {
                throw new Error("Invalid vehicle data received");
            }

            // Step 2: Extract vehicleId from the vehicle details
            const vehicleId = vehicleResponse.data.id;

            // Step 3: Fetch driver information using the vehicleId
            const driverResponse = await axios.get(
                `http://localhost:5000/api/drivers/vehicle/${vehicleId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!driverResponse.data) {
                throw new Error("Driver not found for the given vehicle ID");
            }

            // Combine vehicle and driver information
            const combinedDetails = {
                ...vehicleResponse.data,
                driverName: driverResponse.data.name,
                driverContact: driverResponse.data.phone,
            };

            // Set the combined details in the state
            setVehicleDetails(combinedDetails);

            // Fetch transactions for the vehicle (if needed)
            const transactionsResponse = await axios.get<Transaction[]>(
                `http://localhost:5000/api/fuel-transactions/vehicle/${encodedPlate}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setTransactions(transactionsResponse.data);
            setShowDriverInfo(true);

            if (transactionsResponse.data.length > 0) {
                setSuccess("Vehicle found with previous refueling records.");
            } else {
                setSuccess("Vehicle found. No previous refueling records.");
            }
        } catch (error) {
            console.error("Error fetching vehicle or driver data:", error);
            setError("Vehicle or driver not found. Please check the plate number.");
            setShowDriverInfo(false);
            setVehicleDetails(null);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle recording a transaction
    const handleRecordTransaction = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        // Validate quantity
        if (!quantity || parseFloat(quantity) <= 0 || isNaN(parseFloat(quantity))) {
            setError("Please enter a valid quantity greater than 0.");
            return;
        }
        console.log(
            `${userData?.stationId}, ${vehicleDetails}, ${vehicleDetails?.driverId}`
        );
        // test record
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("No access token found");

        const formattedPlate = plateNumber.trim().replace(/\s+/g, " ");
        const encodedPlate = encodeURIComponent(formattedPlate);
        const vehicleResponse = await axios.get<VehicleDetails>(
            `http://localhost:5000/api/vehicles/plate/${encodedPlate}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (!vehicleResponse.data || !vehicleResponse.data.id) {
            throw new Error("Invalid vehicle data received");
        }

        // Step 2: Extract vehicleId from the vehicle details
        const vehicleId = vehicleResponse.data.id;
        const driverResponse = await axios.get(
            `http://localhost:5000/api/drivers/vehicle/${vehicleId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        // Validate required information
        if (!userData?.stationId || !driverResponse || !driverResponse.data.id) {
            setError("Missing required information. Please try again.");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token found");

            // Record the transaction
            await axios.post(
                "http://localhost:5000/api/fuel-transactions/record",
                {
                    stationId: userData.stationId,
                    vehiclePlateNumber: plateNumber.trim(),
                    driverId: driverResponse.data.id, // Use driverId from vehicleDetails
                    fuel_type: vehicleDetails?.fuelType,
                    total_litres: parseFloat(quantity),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // Success handling
            setSuccess("Fuel transaction recorded successfully!");
            setError("");
            setQuantity("");

            // Refresh transactions by calling handleSearch again
            handleSearch();
        } catch (error) {
            console.error("Error recording transaction:", error);
            setError("Failed to record transaction. Please try again.");
            setSuccess("");
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setShowDriverInfo(false);
        setPlateNumber("");
        setQuantity("");
        setError("");
        setSuccess("");
        setVehicleDetails(null);
        setTransactions([]);
        setUnitPrice(null);
    };

    // Calculate total amount
    const totalAmount =
        quantity && unitPrice ? parseFloat(quantity) * unitPrice : 0;

    return (
        <div
            className="min-vh-100 py-4 px-3 px-md-4 px-lg-5"
            style={{
                background: "linear-gradient(to bottom right, #EEF2FF, #F9FAFB)",
            }}
        >
            <div className="container-fluid max-width-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-5">
                    <h1 className="display-4 fw-bold text-dark mb-2">
                        Global Fleet Refueling System
                    </h1>
                    {isLoadingUserData ? (
                        <p className="text-secondary">Loading station information...</p>
                    ) : (
                        <p className="text-secondary">
                            Station: {userData?.stationName || "Not Available"}
                        </p>
                    )}
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
                                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                                disabled={loading || isLoadingUserData}
                            />
                            <button
                                onClick={handleSearch}
                                className="btn btn-primary d-flex align-items-center"
                                disabled={loading || isLoadingUserData || !plateNumber.trim()}
                            >
                                <Search className="me-2" size={16} />
                                {loading ? "Searching..." : "Search"}
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
                                            <p className="fw-medium mb-0">
                                                {vehicleDetails.driverName}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center">
                                        <Phone className="text-secondary me-2" size={16} />
                                        <div>
                                            <p className="text-secondary small mb-0">Contact</p>
                                            <p className="fw-medium mb-0">
                                                {vehicleDetails.driverContact}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Refueling Form */}
                {showDriverInfo && (
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
                                        <input
                                            type="text"
                                            value={userData?.stationName || "Not Available"}
                                            disabled
                                            className="form-control bg-light"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-medium text-secondary small">
                                            Fuel Type
                                        </label>
                                        <input
                                            type="text"
                                            value={vehicleDetails?.fuelType || "Not Available"}
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
                                            disabled={loading || isLoadingFuelPrice}
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-medium text-secondary small">
                                            Unit Price (RWF)
                                        </label>
                                        <input
                                            type="text"
                                            value={
                                                isLoadingFuelPrice
                                                    ? "Loading..."
                                                    : unitPrice
                                                        ? unitPrice.toLocaleString()
                                                        : "Not Available"
                                            }
                                            disabled
                                            className="form-control bg-light"
                                        />
                                    </div>
                                </div>

                                <div className="bg-light p-3 rounded mb-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="fw-medium text-secondary small">
                                            Total Amount
                                        </span>
                                        <span className="fs-5 fw-bold text-primary">
                                            {totalAmount.toLocaleString()} RWF
                                        </span>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end gap-3">
                                    <button
                                        type="button"
                                        className="btn btn-light d-flex align-items-center"
                                        onClick={resetForm}
                                        disabled={loading}
                                    >
                                        <X className="me-2" size={16} />
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary d-flex align-items-center"
                                        disabled={loading || !quantity || parseFloat(quantity) <= 0}
                                    >
                                        <ArrowRight className="me-2" size={16} />
                                        {loading ? "Recording..." : "Record Fuel"}
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