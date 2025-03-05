import React, { useState, useEffect } from 'react';
import { Trash2, Filter } from 'lucide-react';
import { Card, Modal } from 'react-bootstrap';
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
    const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<FuelTransaction[]>([]);
    const [station, setStation] = useState('');
    const [date, setDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const itemsPerPage = 10;

    const getConfig = () => {
        const token = localStorage.getItem('accessToken');
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    // Fetch all transactions on component mount
    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await axios.get('/api/fuel-transactions', getConfig());
            const data = response.data;
            setTransactions(data);
            setFilteredTransactions(data);
            setTotalPages(Math.ceil(data.length / itemsPerPage));
        } catch (error) {
            console.error('Error fetching transactions:', error);
            alert('Error fetching transactions. Please try again.');
        }
    };

    // Handle vehicle number search (keyup)
    const handleVehicleSearch = (searchTerm: string) => {
        setVehicleNumber(searchTerm);

        const filtered = transactions.filter(transaction =>
            transaction.Vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setFilteredTransactions(filtered);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        setCurrentPage(1);
    };

    // Handle station filter
    const handleStationFilter = (stationName: string) => {
        setStation(stationName);

        const filtered = transactions.filter(transaction =>
            transaction.Station.name.toLowerCase().includes(stationName.toLowerCase()) &&
            (vehicleNumber ? transaction.Vehicle.plateNumber.toLowerCase().includes(vehicleNumber.toLowerCase()) : true)
        );

        setFilteredTransactions(filtered);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        setCurrentPage(1);
    };

    // Handle date filter
    const handleDateFilter = (filterDate: string) => {
        setDate(filterDate);

        const filtered = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.createdAt).toLocaleDateString();
            const filterDateFormatted = new Date(filterDate).toLocaleDateString();

            return (
                transactionDate === filterDateFormatted &&
                (vehicleNumber ? transaction.Vehicle.plateNumber.toLowerCase().includes(vehicleNumber.toLowerCase()) : true) &&
                (station ? transaction.Station.name.toLowerCase().includes(station.toLowerCase()) : true)
            );
        });

        setFilteredTransactions(filtered);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        setCurrentPage(1);
    };

    // Delete transaction
    const handleDeleteTransaction = async (id: number) => {
        try {
            await axios.delete(`/api/fuel-transactions/${id}`, getConfig());

            // Remove the deleted transaction from state
            const updatedTransactions = transactions.filter(t => t.id !== id);
            setTransactions(updatedTransactions);

            // Update filtered transactions
            const updatedFilteredTransactions = filteredTransactions.filter(t => t.id !== id);
            setFilteredTransactions(updatedFilteredTransactions);

            alert('Transaction deleted successfully');
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Error deleting transaction. Please try again.');
        }
    };

    // Paginate transactions
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset all filters
    const resetFilters = () => {
        setVehicleNumber('');
        setStation('');
        setDate('');
        setFilteredTransactions(transactions);
        setTotalPages(Math.ceil(transactions.length / itemsPerPage));
        setCurrentPage(1);
        setShowFilterModal(false);
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-xl-10">
                    <Card className="p-3 mb-4">
                        <h2 className="mb-3">Vehicle Refueling Validation</h2>
                        <div className="d-flex flex-column flex-md-row gap-3 align-items-center">
                            <div className="flex-grow-1 w-100">
                                <div className="position-relative">
                                    <Form.Control
                                        type="text"
                                        value={vehicleNumber}
                                        onChange={(e) => handleVehicleSearch(e.target.value)}
                                        placeholder="Search by Vehicle Number"
                                        className="pl-4"
                                    />
                                    {/* <Search className="position-absolute top-50 translate-middle-y text-muted" style={{left: '90%'}} /> */}
                                </div>
                            </div>
                            <div className="d-none d-md-block">
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setShowFilterModal(true)}
                                >
                                    <Filter className="me-2" /> Filters
                                </Button>
                            </div>
                            <div className="d-md-none w-100">
                                <Button
                                    variant="outline-secondary"
                                    className="w-100"
                                    onClick={() => setShowFilterModal(true)}
                                >
                                    <Filter className="me-2" /> Filters
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-3">
                        <h3 className="mb-3">Fuel Transactions</h3>

                        {/* Mobile Responsive Table */}
                        <div className="table-responsive">
                            <table className="table table-bordered table-hover">
                                <thead className="thead-light">
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Vehicle</th>
                                        <th>Driver</th>
                                        <th>Station</th>
                                        <th>Fuel Type</th>
                                        <th>Quantity (L)</th>
                                        <th>Total Amount</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center text-muted py-4">
                                                No transactions found
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTransactions.map((transaction) => (
                                            <tr key={transaction.id}>
                                                <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                                                <td>{transaction.Vehicle.plateNumber}</td>
                                                <td>{transaction.Driver.name}</td>
                                                <td>{transaction.Station.name}</td>
                                                <td className={`text-${transaction.fuel_type === 'petrol' || 'diesel'? 'success' : 'info'}`}>
                                                    {transaction.fuel_type}
                                                </td>
                                                <td>{transaction.total_litres}</td>
                                                <td>{transaction.totalPrice} RWF</td>
                                                <td className="text-success">Completed</td>
                                                <td>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDeleteTransaction(transaction.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                            <span className="mb-2 mb-md-0">
                                Page {currentPage} of {totalPages}
                                {filteredTransactions.length > 0 && ` (${filteredTransactions.length} transactions)`}
                            </span>
                            <div>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="me-2"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Filter Modal for Mobile */}
                    <Modal
                        show={showFilterModal}
                        onHide={() => setShowFilterModal(false)}
                        centered
                    >
                        <Modal.Header closeButton>
                            <Modal.Title>Filter Transactions</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Station</Form.Label>
                                <Form.Control
                                    placeholder="Filter by Station"
                                    value={station}
                                    onChange={(e) => handleStationFilter(e.target.value)}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={date}
                                    onChange={(e) => handleDateFilter(e.target.value)}
                                />
                            </Form.Group>
                            <div className="d-flex justify-content-between">
                                <Button
                                    variant="secondary"
                                    onClick={resetFilters}
                                >
                                    Reset Filters
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => setShowFilterModal(false)}
                                >
                                    Apply
                                </Button>
                            </div>
                        </Modal.Body>
                    </Modal>
                </div>
            </div>
        </div>
    );
};

export default VehicleRefuelingValidation;