import React, { useEffect, useState } from "react";
import { Card, Spinner, Container, Row, Col, Form, Pagination } from "react-bootstrap";
import { FaGasPump, FaSearch } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

interface Vehicle {
  plateNumber: string;
}

interface Transaction {
  id: string;
  total_litres: number;
  fuel_type: string;
  createdAt: string;
  vehicleId: string;
  Vehicle?: Vehicle;
}

const DashboardMain: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRefuels, setTotalRefuels] = useState<number>(0);
  const [totalDieselLiters, setTotalDieselLiters] = useState<number>(0);
  const [totalPetrolLiters, setTotalPetrolLiters] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [transactionsPerPage] = useState<number>(5);

  useEffect(() => {
    const fetchTransactionsAndVehicles = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          console.error("No access token found");
          return;
        }

        const decodedToken: { id: string } = jwtDecode(accessToken);
        const userId = decodedToken.id;

        const response = await fetch(`/api/fuel-transactions/${userId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const data: Transaction[] = await response.json();
        
        // Fetch vehicle details for each transaction
        const transactionsWithVehicles = await Promise.all(
          data.map(async (transaction) => {
            try {
              const vehicleResponse = await axios.get(
                `/api/vehicles/${transaction.vehicleId}`,
                {
                  headers: { Authorization: `Bearer ${accessToken}` }
                }
              );
              return {
                ...transaction,
                Vehicle: vehicleResponse.data
              };
            } catch (error) {
              console.error(`Error fetching vehicle for transaction ${transaction.id}:`, error);
              return {
                ...transaction,
                Vehicle: { plateNumber: "Unknown" }
              };
            }
          })
        );

        setTransactions(transactionsWithVehicles);

        // Calculate totals
        const totalRefuels = transactionsWithVehicles.length;
        const totalDiesel = transactionsWithVehicles
          .filter((transaction) => transaction.fuel_type.toLowerCase() === "diesel")
          .reduce((sum, transaction) => sum + (transaction.total_litres || 0), 0);
        const totalPetrol = transactionsWithVehicles
          .filter((transaction) => transaction.fuel_type.toLowerCase() === "petrol")
          .reduce((sum, transaction) => sum + (transaction.total_litres || 0), 0);

        setTotalRefuels(totalRefuels);
        setTotalDieselLiters(totalDiesel);
        setTotalPetrolLiters(totalPetrol);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionsAndVehicles();
  }, []);

  // Pagination logic
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="g-4 mb-4">
        {/* Top Stats Section */}
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0 text-center p-3">
            <FaGasPump size={24} className="text-danger mx-auto mb-2" />
            <h6 className="text-secondary">Today Refuels</h6>
            <h3 className="fw-bold">{totalRefuels}</h3>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0 text-center p-3">
            <FaGasPump size={24} className="text-info mx-auto mb-2" />
            <h6 className="text-secondary">Total Liters (Diesel)</h6>
            <h3 className="fw-bold">{Number(totalDieselLiters).toFixed(2)} L</h3>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0 text-center p-3">
            <FaGasPump size={24} className="text-info mx-auto mb-2" />
            <h6 className="text-secondary">Total Liters (Petrol)</h6>
            <h3 className="fw-bold">{Number(totalPetrolLiters).toFixed(2)} L</h3>
          </Card>
        </Col>
      </Row>

      {/* Vehicle Search */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <h6 className="fw-semibold mb-3">Vehicle Search</h6>
          <Form>
            <Form.Group className="input-group">
              <Form.Control type="text" placeholder="Enter Vehicle Plate" />
              <span className="input-group-text">
                <FaSearch />
              </span>
            </Form.Group>
          </Form>
        </Card.Body>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-sm border-0">
        <Card.Body>
          <h6 className="fw-semibold mb-3">Recent Activity</h6>
          <div className="list-group list-group-flush">
            {currentTransactions.map((transaction) => (
              <div key={transaction.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                <div>
                  <h6 className="mb-0">{transaction.Vehicle?.plateNumber || 'Unknown'}</h6>
                  <small className="text-muted">{transaction.total_litres} Liters - {transaction.fuel_type}</small>
                </div>
                <small className="text-muted">{new Date(transaction.createdAt).toLocaleTimeString()}</small>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-center mt-3">
            <Pagination>
              <Pagination.Prev
                onClick={() => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev))}
                disabled={currentPage === 1}
              />
              {Array.from({ length: Math.ceil(transactions.length / transactionsPerPage) }, (_, index) => (
                <Pagination.Item
                  key={index + 1}
                  active={index + 1 === currentPage}
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                onClick={() =>
                  setCurrentPage((prev) =>
                    prev < Math.ceil(transactions.length / transactionsPerPage) ? prev + 1 : prev
                  )
                }
                disabled={currentPage === Math.ceil(transactions.length / transactionsPerPage)}
              />
            </Pagination>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DashboardMain;