import  { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button, Card, Table, Pagination } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

interface FuelTransaction {
    id: number;
    stationId: number;
    vehicleId: number;
    operatorId: number;
    driverId: number;
    fuel_type: string;
    total_litres: string;
    totalPrice: string;
    createdAt: string;
    updatedAt: string;
    Vehicle: {
        id: number;
        plateNumber: string;
        model: string;
        fuelType: string;
        createdAt: string;
        updatedAt: string;
    };
    User: {
        id: number;
        name: string;
        email: string;
        password: string;
        forcePasswordChange: boolean;
        role: string;
        stationId: number | null;
        picture: string | null;
        phoneNumber: string | null;
        resetToken: string | null;
        resetTokenExpires: string | null;
        createdAt: string;
        updatedAt: string;
    };
    Driver: {
        id: number;
        name: string;
        licenseNumber: string;
        vehicleId: number;
        createdAt: string;
        updatedAt: string;
    };
    Station: {
        id: number;
        name: string;
        location: string;
        createdAt: string;
        updatedAt: string;
    };
}

const Breport = () => {
    const [activeTab, setActiveTab] = useState('Fuel Usage');
    const [, setFuelTransactions] = useState<FuelTransaction[]>([]);
    const [totalLiters, setTotalLiters] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [, setTotalStations] = useState(0);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [dailyConsumption, setDailyConsumption] = useState<{ day: string; petrol: number; diesel: number }[]>([]);

    useEffect(() => {
        const fetchFuelTransactions = async () => {
            try {
                const accessToken = localStorage.getItem('accessToken');
                const response = await axios.get('/api/fuel-transactions', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });

                const transactions = response.data;

                // Calculate metrics
                const litersSum = transactions.reduce((sum: number, transaction: FuelTransaction) => sum + parseFloat(transaction.total_litres), 0);
                const amountSum = transactions.reduce((sum: number, transaction: FuelTransaction) => sum + parseFloat(transaction.totalPrice), 0);
                const uniqueStations = new Set(transactions.map((transaction: FuelTransaction) => transaction.stationId)).size;

                // Calculate daily fuel consumption
                const dailyData = calculateDailyConsumption(transactions);

                setFuelTransactions(transactions);
                setTotalLiters(litersSum);
                setTotalAmount(amountSum);
                setTotalStations(uniqueStations);
                setTotalTransactions(transactions.length);
                setDailyConsumption(dailyData);
            } catch (error) {
                console.error('Error fetching fuel transactions:', error);
            }
        };

        fetchFuelTransactions();
    }, []);

    // Function to calculate daily fuel consumption
    const calculateDailyConsumption = (transactions: FuelTransaction[]) => {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dailyData = daysOfWeek.map(day => ({ day, petrol: 0, diesel: 0 }));

        transactions.forEach(transaction => {
            const date = new Date(transaction.createdAt);
            const dayOfWeek = daysOfWeek[date.getDay()];
            const index = dailyData.findIndex(data => data.day === dayOfWeek);

            if (index !== -1) {
                if (transaction.fuel_type.toLowerCase() === 'petrol') {
                    dailyData[index].petrol += parseFloat(transaction.total_litres);
                } else if (transaction.fuel_type.toLowerCase() === 'diesel') {
                    dailyData[index].diesel += parseFloat(transaction.total_litres);
                }
            }
        });

        return dailyData;
    };

    // Function to export daily consumption data as CSV
    const exportDailyConsumption = () => {
        const csvContent = "data:text/csv;charset=utf-8," +
            "Day,Petrol (L),Diesel (L)\n" +
            dailyConsumption.map(data => `${data.day},${data.petrol},${data.diesel}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "daily_fuel_consumption.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const stationData = [
        { name: 'Kabeza Station', value: 35, color: '#228B22' },
        { name: 'Remera Station', value: 35, color: '#FFD700' },
        { name: 'Kicukiro Station', value: 20, color: '#1E90FF' },
    ];

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-center gap-3 mb-4">
                <Button variant={activeTab === 'Fuel Usage' ? 'primary' : 'outline-primary'} onClick={() => setActiveTab('Fuel Usage')}>Fuel Usage</Button>
                <Button variant={activeTab === 'Station Analysis' ? 'primary' : 'outline-primary'} onClick={() => setActiveTab('Station Analysis')}>Station Analysis</Button>
            </div>
            {activeTab === 'Fuel Usage' ? (
                <>
                    <div className="row row-cols-1 row-cols-md-4 g-3 mb-4">
                        <div className="col"><Card className="p-3"><h5>Total Consumption</h5><p className="fs-4 fw-bold">{totalLiters.toFixed(2)} L</p><span className="text-success">+12.5% from last period</span></Card></div>
                        <div className="col"><Card className="p-3"><h5>Total Cost</h5><p className="fs-4 fw-bold">{totalAmount.toFixed(2)} RWF</p><span className="text-success">+12.5% from last period</span></Card></div>
                        <div className="col"><Card className="p-3"><h5>Avg. Price/Liter</h5><p className="fs-4 fw-bold">{(totalAmount / totalLiters).toFixed(2)} RWF</p><span className="text-danger">-2.1% from last period</span></Card></div>
                        <div className="col"><Card className="p-3"><h5>Transactions</h5><p className="fs-4 fw-bold">{totalTransactions}</p><span className="text-success">+5.2% from last period</span></Card></div>
                    </div>
                    <h2 className="text-center mb-4">Daily Fuel Consumption</h2>
                    <Button variant="primary" onClick={exportDailyConsumption} className="mb-3">Export Daily Consumption</Button>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={dailyConsumption} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="petrol" stroke="#32CD32" name="Petrol (L)" />
                            <Line type="monotone" dataKey="diesel" stroke="#6A0DAD" name="Diesel (L)" />
                        </LineChart>
                    </ResponsiveContainer>
                </>
            ) : (
                <>
                    <h2 className="text-center mb-4">Station Usage Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={stationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {stationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <Table striped bordered hover className="mt-4">
                        <thead>
                            <tr>
                                <th>Station</th>
                                <th>Transactions</th>
                                <th>Total Volume</th>
                                <th>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Kabeza Station</td>
                                <td>98</td>
                                <td>712.5 L</td>
                                <td>1,400,000 RWF</td>
                            </tr>
                        </tbody>
                    </Table>
                    <Pagination className="d-flex justify-content-center mt-3">
                        <Pagination.Prev />
                        <Pagination.Item active>{1}</Pagination.Item>
                        <Pagination.Item>{2}</Pagination.Item>
                        <Pagination.Item>{3}</Pagination.Item>
                        <Pagination.Item>{4}</Pagination.Item>
                        <Pagination.Ellipsis />
                        <Pagination.Item>{40}</Pagination.Item>
                        <Pagination.Next />
                    </Pagination>
                </>
            )}
        </div>
    );
};

export default Breport;