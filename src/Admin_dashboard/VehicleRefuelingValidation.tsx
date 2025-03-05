import React, { useState } from 'react';
import { Check, Calendar } from 'lucide-react';
import { Card } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import axios from 'axios';

interface FuelTransaction {
    id: number;
    fuel_type: string;
    total_litres: string;
    totalPrice: string;
    createdAt: string;
    Vehicle: {
        plateNumber: string;
        model: string;
        fuelType: string;
    };
    Driver: {
        name: string;
    };
    Station: {
        name: string;
    };
}

const VehicleRefuelingValidation: React.FC = () => {
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [isEligible, setIsEligible] = useState(false);
    const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
    const [vehicleDetails, setVehicleDetails] = useState<{
        plateNumber: string;
        model: string;
        fuelType: string;
        driverName: string;
    } | null>(null);

    const getConfig = () => {
        const token = localStorage.getItem('accessToken');
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    const handleValidation = async () => {
        if (!vehicleNumber.trim()) {
            alert('Please enter a vehicle plate number.');
            return;
        }

        try {
            const response = await axios.get(
                `/api/fuel-transactions/vehicle/${vehicleNumber}`,
                getConfig()
            );
            const data = response.data;

            if (data.length > 0) {
                setIsEligible(true);
                setTransactions(data);
                setVehicleDetails({
                    plateNumber: data[0].Vehicle.plateNumber,
                    model: data[0].Vehicle.model,
                    fuelType: data[0].Vehicle.fuelType,
                    driverName: data[0].Driver.name
                });
            } else {
                setIsEligible(false);
                setTransactions([]);
                setVehicleDetails(null);
                alert('No transactions found for this vehicle.');
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            alert('Error fetching transactions. Please try again.');
        }
    };

    return (
        <div className="container py-4">
            <Card className="p-4 mb-4">
                <h2 className="mb-3">Vehicle Refueling Validation</h2>
                <div className="d-flex gap-3">
                    <Form.Control
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        placeholder="Enter Vehicle Number"
                    />
                    <Button onClick={handleValidation}>Validate Vehicle</Button>
                </div>
                {isEligible && (
                    <div className="mt-3 p-3 border rounded bg-success text-white d-flex align-items-center gap-2">
                        <Check />
                        <span>Vehicle is eligible for refueling</span>
                    </div>
                )}
            </Card>

            {vehicleDetails && (
                <Card className="p-4 mb-4">
                    <h3 className="mb-2">Vehicle Details</h3>
                    <p><strong>Vehicle:</strong> {vehicleDetails.model}</p>
                    <p><strong>Driver:</strong> {vehicleDetails.driverName}</p>
                    <p><strong>Fuel Type:</strong> {vehicleDetails.fuelType}</p>
                    <p><strong>Last Refuel:</strong> {transactions[0]?.createdAt ? new Date(transactions[0].createdAt).toLocaleString() : 'N/A'}</p>
                </Card>
            )}

            <Card className="p-4">
                <h3 className="mb-3">Fuel Transactions History</h3>
                <div className="d-flex gap-3 mb-3">
                    <Form.Control placeholder="Search Transaction History" />
                    <Form.Control placeholder="All Station" className="w-25" />
                    <Form.Control placeholder="mm/dd/yy" className="w-25" />
                    <Calendar className="text-muted mt-2" />
                </div>
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Vehicle</th>
                            <th>Driver</th>
                            <th>Station</th>
                            <th>Fuel Type</th>
                            <th>Quantity (L)</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction) => (
                            <tr key={transaction.id}>
                                <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                                <td>{transaction.Vehicle.plateNumber}</td>
                                <td>{transaction.Driver.name}</td>
                                <td>{transaction.Station.name}</td>
                                <td className={`text-${transaction.fuel_type === 'Petrol' ? 'success' : 'info'}`}>
                                    {transaction.fuel_type}
                                </td>
                                <td>{transaction.total_litres}</td>
                                <td>{transaction.totalPrice} RWF</td>
                                <td className="text-success">Completed</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default VehicleRefuelingValidation;