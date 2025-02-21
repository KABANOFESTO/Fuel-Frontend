import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  vehicleId: number;
  email?: string;
  phone?: string;
  status?: string;
}

interface Vehicle {
  id: number;
  plateNumber: string;
  // Add other vehicle properties as needed
}

const DriverManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [formData, setFormData] = useState<Driver & { plateNumber?: string }>({
    id: 0,
    name: "",
    licenseNumber: "",
    vehicleId: 0,
    email: "",
    phone: "",
    status: "Active",
    plateNumber: "",
  });
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const getConfig = () => {
    const token = localStorage.getItem("accessToken");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(
        "/api/vehicles/all",
        getConfig()
      );
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(
        "/api/drivers/all",
        getConfig()
      );
      setDrivers(response.data);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Existing validations
      if (formData.name.trim().length < 2) {
        alert("Name must be at least 2 characters long");
        return;
      }

      const licenseNumberRegex = /^\d{16}$/;
      if (!licenseNumberRegex.test(formData.licenseNumber)) {
        alert("License number must be exactly 16 digits");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        alert("Please enter a valid email address");
        return;
      }

      const phoneRegex = /^\d{10}$/;
      if (formData.phone && !phoneRegex.test(formData.phone)) {
        alert("Phone number must be 10 digits");
        return;
      }

      // Find vehicle ID based on plate number
      const selectedVehicle = vehicles.find(
        (v) => v.plateNumber === formData.plateNumber
      );
      if (!selectedVehicle) {
        alert("Please select a valid vehicle");
        return;
      }

      const payload = {
        name: formData.name.trim(),
        licenseNumber: formData.licenseNumber,
        vehicleId: selectedVehicle.id,
        email: formData.email?.trim(),
        phoneNumber: formData.phone?.trim(), // Ensure phone is included in the payload
        status: formData.status,
      };

      if (editingDriver) {
        await axios.put(
          `/api/drivers/update/${editingDriver.licenseNumber}`,
          payload,
          getConfig()
        );
        alert("Driver updated successfully!");
      } else {
        await axios.post(
          "/api/drivers/register",
          payload,
          getConfig()
        );
        alert("Driver registered successfully!");
      }
      fetchDrivers();
      toggleModal();
    } catch (error: any) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      if (error.response?.status === 400) {
        const errorMessage =
          error.response.data.message ||
          "Invalid driver data. Please check your inputs.";
        alert(errorMessage);
      } else if (error.response?.status === 409) {
        alert("Driver with this license number already exists.");
      } else {
        alert("Error saving driver. Please try again.");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this driver?")) {
      try {
        await axios.delete(
          `/api/drivers/delete/${id}`,
          getConfig()
        );
        fetchDrivers();
        alert("Driver deleted successfully!");
      } catch (error) {
        console.error("Error deleting driver:", error);
        alert("Error deleting driver. Please try again.");
      }
    }
  };

  const handleEdit = (driver: Driver) => {
    const driverVehicle = vehicles.find((v) => v.id === driver.vehicleId);
    setEditingDriver(driver);
    setFormData({
      ...driver,
      plateNumber: driverVehicle?.plateNumber || "",
    });
    setIsModalOpen(true);
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setEditingDriver(null);
      setFormData({
        id: 0,
        name: "",
        licenseNumber: "",
        vehicleId: 0,
        email: "",
        phone: "",
        status: "Active",
        plateNumber: "",
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch = driver.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All Status" || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container py-4">
      <header className="d-flex justify-content-between align-items-center mb-4">
        <input
          type="text"
          className="form-control w-50"
          placeholder="Search Driver Name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="form-select w-25"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <button className="btn btn-primary" onClick={toggleModal}>
          + Add Driver
        </button>
      </header>

      <div className="card">
        <div className="card-body">
          <ul className="list-group">
            {filteredDrivers.map((driver) => {
              const assignedVehicle = vehicles.find(
                (v) => v.id === driver.vehicleId
              );
              return (
                <li
                  key={driver.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    <h5 className="mb-1">{driver.name}</h5>
                    <p className="mb-0">Email: {driver.email}</p>
                    <p className="mb-0">Phone: {driver.phone}</p>
                    <p className="mb-0">License: {driver.licenseNumber}</p>
                    <p className="mb-0">
                      Vehicle: {assignedVehicle?.plateNumber || "Not assigned"}
                    </p>
                  </div>
                  <div>
                    <button
                      className="btn btn-link p-0 me-2"
                      onClick={() => handleEdit(driver)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-link text-danger p-0"
                      onClick={() => handleDelete(driver.id)}
                    >
                      Delete
                    </button>
                    <span
                      className={`badge ${
                        driver.status === "Active" ? "bg-success" : "bg-danger"
                      }`}
                    >
                      ●
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingDriver ? "Edit Driver" : "Add New Driver"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={toggleModal}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    placeholder="Enter driver name"
                    className="form-control mb-3"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Enter email"
                    className="form-control mb-3"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Enter phone number (10 digits)"
                    className="form-control mb-3"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    pattern="\d{10}"
                  />
                  <input
                    type="text"
                    placeholder="Enter license number (16 digits)"
                    className="form-control mb-3"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    required
                    pattern="\d{16}"
                  />
                  <select
                    className="form-select mb-3"
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.plateNumber}>
                        {vehicle.plateNumber}
                      </option>
                    ))}
                  </select>
                  <select
                    className="form-select mb-3"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={toggleModal}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingDriver ? "Update" : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;