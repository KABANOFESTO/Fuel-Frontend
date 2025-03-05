import { useState, useEffect } from 'react';
import { Fuel, Calendar, Download } from 'lucide-react';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { Button, Card, Form, Table, Container, Row, Col, Spinner } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ReportMain = () => {
    interface Transaction {
        id: string;
        createdAt: string;
        stationId: number;
        vehicleId: number;
        driverId: number;
        fuel_type: string;
        total_litres: number;
        totalPrice: number;
        Station?: { name: string };
        Vehicle?: { plateNumber: string };
        Driver?: { name: string };
    }

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [fuelType, setFuelType] = useState('all');
    const [userId, setUserId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded = jwtDecode<{ id: string }>(token);
                setUserId(decoded.id);
            } catch (error) {
                setError('Error decoding token');
            }
        }
    }, []);

    useEffect(() => {
        if (userId) {
            fetchTransactions();
        }
    }, [userId]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            if (!token) throw new Error('No access token found');

            // Fetch transactions
            const response = await axios.get(`/api/fuel-transactions/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Fetch additional details for each transaction
            const transactionsWithDetails = await Promise.all(
                response.data.map(async (t: Transaction) => {
                    const [stationResponse, vehicleResponse, driverResponse] = await Promise.all([
                        axios.get(`/api/stations/${t.stationId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        }),
                        axios.get(`/api/vehicles/${t.vehicleId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        }),
                        axios.get(`/api/drivers/${t.driverId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        }),
                    ]);

                    return {
                        ...t,
                        Station: stationResponse.data,
                        Vehicle: vehicleResponse.data,
                        Driver: driverResponse.data,
                        total_litres: t.total_litres, // Already a number
                        totalPrice: t.totalPrice, // Already a number
                    };
                })
            );

            setTransactions(transactionsWithDetails);
            setFilteredTransactions(transactionsWithDetails);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.message || 'Error fetching transactions');
            } else {
                setError('Error fetching transactions');
            }
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        let filtered = [...transactions];
        if (startDate) {
            filtered = filtered.filter(t => new Date(t.createdAt) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(t => new Date(t.createdAt) <= new Date(endDate));
        }
        if (fuelType !== 'all') {
            filtered = filtered.filter(t => t.fuel_type.toLowerCase() === fuelType.toLowerCase());
        }
        setFilteredTransactions(filtered);
    };

    const exportToCSV = () => {
        const headers = ['Date/Time', 'Station', 'Plate No.', 'Driver', 'Fuel Type', 'Quantity (L)', 'Amount (RWF)'];
        const csvData = filteredTransactions.map(t => [
            new Date(t.createdAt).toLocaleString(),
            t.Station?.name || 'N/A',
            t.Vehicle?.plateNumber || 'N/A',
            t.Driver?.name || 'N/A',
            t.fuel_type,
            t.total_litres,
            t.totalPrice
        ]);
        const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fuel-transactions.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                <Card className="text-center p-4 shadow-sm border-0">
                    <h4 className="text-danger">Error</h4>
                    <p>{error}</p>
                </Card>
            </div>
        );
    }

    return (
        <Container fluid className="p-4">
            {/* Stats Cards */}
            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className="h-100 shadow-sm border-0">
                        <Card.Body className="d-flex align-items-center">
                            <Fuel className="me-3 text-primary" size={24} />
                            <div>
                                <h6 className="text-secondary mb-0">Total Transactions</h6>
                                <h4 className="fw-bold">{filteredTransactions.length}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="h-100 shadow-sm border-0">
                        <Card.Body className="d-flex align-items-center">
                            <Fuel className="me-3 text-success" size={24} />
                            <div>
                                <h6 className="text-secondary mb-0">Total Volume</h6>
                                <h4 className="fw-bold">{filteredTransactions.reduce((sum, t) => sum + t.total_litres, 0)} L</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="h-100 shadow-sm border-0">
                        <Card.Body className="d-flex align-items-center">
                            <Calendar className="me-3 text-info" size={24} />
                            <div>
                                <h6 className="text-secondary mb-0">Total Amount</h6>
                                <h4 className="fw-bold">{filteredTransactions.reduce((sum, t) => sum + t.totalPrice, 0)} RWF</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card className="shadow-sm border-0 mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={3}>
                            <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </Col>
                        <Col md={3}>
                            <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </Col>
                        <Col md={3}>
                            <Form.Select value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                                <option value="all">All</option>
                                <option value="diesel">Diesel</option>
                                <option value="petrol">Petrol</option>
                            </Form.Select>
                        </Col>
                        <Col md={3} className="d-flex gap-2">
                            <Button variant="primary" onClick={applyFilter}>Apply Filter</Button>
                            <Button variant="success" onClick={exportToCSV}>
                                <Download size={16} className="me-2" /> Export
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Transactions Table */}
            <Card className="shadow-sm border-0 mb-4">
                <Card.Body>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Date/Time</th>
                                <th>Station</th>
                                <th>Plate No.</th>
                                <th>Driver</th>
                                <th>Fuel Type</th>
                                <th>Quantity (L)</th>
                                <th>Amount (RWF)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(t => (
                                <tr key={t.id}>
                                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                                    <td>{t.Station?.name || 'N/A'}</td>
                                    <td>{t.Vehicle?.plateNumber || 'N/A'}</td>
                                    <td>{t.Driver?.name || 'N/A'}</td>
                                    <td>{t.fuel_type}</td>
                                    <td>{t.total_litres}</td>
                                    <td>{t.totalPrice}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Chart */}
            <Card className="shadow-sm border-0">
                <Card.Body>
                    <h6 className="fw-semibold mb-3">Transaction Trends</h6>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={filteredTransactions}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="createdAt" tickFormatter={(tick) => new Date(tick).toLocaleDateString()} />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="totalPrice" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ReportMain;