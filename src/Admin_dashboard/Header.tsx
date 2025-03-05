import React, { useState } from 'react';
import { Search, } from 'lucide-react';

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
      <div className="position-relative flex-grow-1">
        <input
          type="text"
          className="form-control rounded-pill px-4 pe-5" // Extra padding on the right for the icon
          placeholder="Search for Everything"
          style={{
            maxWidth: '100%',
            minWidth: '150px',
            flex: '1',
            fontSize: 'clamp(12px, 2.5vw, 16px)',
            padding: '8px 12px',
          }}
          value={searchQuery}
          onChange={handleSearch}
        />
        <Search
          className="position-absolute text-muted"
          style={{
            right: '12px', // Adjust to place inside the input
            top: '50%',
            transform: 'translateY(-50%)',
            width: 'clamp(14px, 3vw, 20px)',
            height: 'clamp(14px, 3vw, 20px)',
            pointerEvents: 'none', // Prevents clicking on the icon
          }}
        />
      </div>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      {/* Right Section */}
      <div className="d-flex align-items-center flex-wrap">
        {/* Currency Selector */}
        <div
          className="d-flex align-items-center me-2"
          style={{
            fontSize: 'clamp(10px, 2.5vw, 14px)', // Smaller font on mobile
          }}
        >
          <img
            src="/Images/icon.png"
            alt="Fuel"
            className="me-1"
            style={{
              width: 'clamp(12px, 4vw, 20px)', // Smaller icon size on mobile
              height: 'clamp(12px, 4vw, 20px)',
            }}
          />
        </div>
      </div>


    </header>
  );
};

export default Header;