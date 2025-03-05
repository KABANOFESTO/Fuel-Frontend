import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import Header from './Header';

const Layout: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState(''); // State for search query

  // Function to handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header with search functionality */}
        <Header onSearch={handleSearch} />

        {/* Main content */}
        <main className="p-4">
          {/* Pass the search query to the current page via Outlet context */}
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  );
};

export default Layout;