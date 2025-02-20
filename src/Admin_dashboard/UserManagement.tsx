import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit, Trash2, Plus, X, Save } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_URL = '/api/users';
const STATIONS_URL = '/api/stations/all';



const UserManagement: React.FC = () => {
    interface User {
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
        station: string;
    }

    interface Station {
        id: string;
        name: string;
    }

    const [users, setUsers] = useState<User[]>([]);
    const [stations, setStations] = useState<Station[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'viewer',
        password: 'Password1@',
        stationId: ''
    });

    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        fetchUsers();
        fetchStations();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_URL}/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchStations = async () => {
        try {
            const response = await axios.get(STATIONS_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStations(response.data);
        } catch (error) {
            console.error('Error fetching stations:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewUser({ ...newUser, [name]: value });
    };

    const handleSave = async () => {
        try {
            if (newUser.role === 'station_worker' && !newUser.stationId) {
                alert('Station is required for station workers');
                return;
            }
            if (isEditMode && selectedUserId) {
                await axios.put(`${API_URL}/update/${selectedUserId}`, newUser, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/auth/register', newUser, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            fetchUsers();
            setIsModalOpen(false);
            setIsEditMode(false);
            setNewUser({ name: '', email: '', role: 'viewer', password: 'Password1@', stationId: '' });
        } catch (error) {
            console.error('Error saving user:', error);
        }
    };

    const handleEdit = (user: User) => {
        setNewUser({
            name: user.name,
            email: user.email,
            role: user.role,
            password: 'Password1@',
            stationId: user.station || ''
        });
        setSelectedUserId(user.id);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string): Promise<void> => {
        try {
            await axios.delete(`${API_URL}/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="mb-4">User Management</h2>

            <button className="btn btn-dark mb-3" onClick={() => setIsModalOpen(true)}>
                <Plus className="me-2" size={16} /> Add New User
            </button>

            <div className="card">
                <div className="card-body">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Station</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>
                                    <td>{user.station || '-'}</td>
                                    <td>
                                        <button className="btn btn-link" onClick={() => handleEdit(user)}>
                                            <Edit size={16} />
                                        </button>
                                        <button className="btn btn-link text-danger" onClick={() => handleDelete(user.id)}>
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
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{isEditMode ? 'Edit User' : 'Add New User'}</h5>
                                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}>
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    className="form-control mb-3"
                                    placeholder="Name"
                                    name="name"
                                    value={newUser.name}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="email"
                                    className="form-control mb-3"
                                    placeholder="Email"
                                    name="email"
                                    value={newUser.email}
                                    onChange={handleInputChange}
                                />
                                <select
                                    className="form-select mb-3"
                                    name="role"
                                    value={newUser.role}
                                    onChange={handleInputChange}
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="station_worker">Station Worker</option>
                                </select>

                                {newUser.role === 'station_worker' && (
                                    <select
                                        className="form-select mb-3"
                                        name="stationId"
                                        value={newUser.stationId}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Station</option>
                                        {stations.map((station) => (
                                            <option key={station.id} value={station.id}>
                                                {station.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleSave}><Save className="me-2" size={16} /> Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
