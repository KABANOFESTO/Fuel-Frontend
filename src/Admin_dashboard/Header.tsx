import React, { useState } from 'react';
import { Search,  } from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void; // Callback to pass search query to parent
}

const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query); // Pass the search query to the parent component
  };

  return (
    <header className="d-flex justify-content-between align-items-center p-3 bg-white shadow-sm" style={{ zIndex: 10, width: '80%', marginLeft: '15%' }}>
      {/* Search Bar */}
      <div className="d-flex align-items-center flex-grow-1">
        <input
          type="text"
          className="form-control rounded-pill px-4"
          placeholder="Search for Everything"
          style={{ maxWidth: '300px' }}
          value={searchQuery}
          onChange={handleSearch} // Trigger search on keyup
        />
        <Search size={20} className="ms-2 text-muted" />
      </div>

      {/* Right Section */}
      <div className="d-flex align-items-center">
        {/* Currency Selector */}
        <div className="d-flex align-items-center me-4">
          <img src="/Images/icon.png" alt="Fuel" className="me-2" style={{ width: 24, height: 24 }} />
          <span className="fw-bold">Fuel-Tracker</span>
        </div>
      </div>
    </header>
  );
};

export default Header;