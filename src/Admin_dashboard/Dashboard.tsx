import React, { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description }) => (
  <Card className="p-3 shadow-sm border-0">
    <div className="d-flex align-items-start gap-3 mb-3">
      <div className={`p-2 rounded bg-opacity-25 ${title === 'Total Vehicles' ? 'bg-warning' :
        title === 'Total Drivers' ? 'bg-primary' :
          'bg-info'
        }`}>
        {icon}
      </div>
      <span className="text-secondary">{title}</span>
    </div>
    <div>
      <h3 className="fw-bold mb-1">{value}</h3>
      <span className="text-muted small">{description}</span>
    </div>
  </Card>
);

interface Transaction {
  Vehicle: { plateNumber: string };
  Driver: { name: string };
  Station: { name: string };
  total_litres: number;
  createdAt: string;
}

const RecentTransactionsTable: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  return (
    <Card className="p-3 shadow-sm border-0">
      <h5 className="fw-semibold mb-3">Recent Refueling Transactions</h5>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr className="text-secondary small">
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Station</th>
              <th>Amount (L)</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody className="small">
            {transactions.map((tx, idx) => (
              <tr key={idx} className="border-top">
                <td>{tx.Vehicle.plateNumber}</td>
                <td>{tx.Driver.name}</td>
                <td>{tx.Station.name}</td>
                <td>{tx.total_litres}</td>
                <td>{new Date(tx.createdAt).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const Dashboard = () => {
  const [, setData] = useState([]);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [todayRefuels, setTodayRefuels] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  interface ChartData {
    month: string;
    value: number;
  }

  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const accessToken = localStorage.getItem('accessToken');

      // Fetch fuel transactions
      const fuelTransactionsResponse = await fetch('/api/fuel-transactions', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const fuelTransactions = await fuelTransactionsResponse.json();
      setData(fuelTransactions);

      // Fetch total vehicles
      const vehiclesResponse = await fetch('/api/vehicles/all', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const vehiclesData = await vehiclesResponse.json();
      setTotalVehicles(vehiclesData.length);

      // Fetch total drivers
      const driversResponse = await fetch('/api/drivers/all', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const driversData = await driversResponse.json();
      setTotalDrivers(driversData.length);

      // Calculate Today's Refuels
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = fuelTransactions.filter((tx: Transaction) => tx.createdAt.split('T')[0] === today);
      setTodayRefuels(todayTransactions.length);

      // Set Recent Transactions
      setRecentTransactions(fuelTransactions.slice(0, 3));

      // Prepare Chart Data
      interface MonthlyData {
        [key: string]: number;
      }

      const monthlyData: MonthlyData = fuelTransactions.reduce((acc: MonthlyData, tx: Transaction) => {
        const month = new Date(tx.createdAt).toLocaleString('default', { month: 'short' });
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month] += parseFloat(tx.total_litres.toString());
        return acc;
      }, {});

      const chartData = Object.keys(monthlyData).map(month => ({
        month,
        value: monthlyData[month]
      }));
      setChartData(chartData);
    };

    fetchData();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen">
      <div style={{ width: '80%', marginLeft: '15%' }}>
        <div className="p-4">
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <StatCard title="Total Vehicles" value={totalVehicles} icon="🚗" description="Active in system" />
            </div>
            <div className="col-md-4">
              <StatCard title="Total Drivers" value={totalDrivers} icon="👤" description="Registered drivers" />
            </div>
            <div className="col-md-4">
              <StatCard title="Today's Refuels" value={todayRefuels} icon="⛽" description="Transactions today" />
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-12">
              <RecentTransactionsTable transactions={recentTransactions} />
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <Card className="p-3 shadow-sm border-0">
                <h5 className="fw-semibold mb-3">Fuel Usage Trend</h5>
                <div className="chart-container">
                  <LineChart
                    width={800}
                    height={300}
                    data={chartData}
                    style={{ maxWidth: '100%' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;