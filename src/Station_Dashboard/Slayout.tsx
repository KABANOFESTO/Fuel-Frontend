import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';

const Layout: React.FC = () => {
 


  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">

        {/* Main content */}
        <main className="p-4">
          {/* Pass the search query to the current page via Outlet context */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;