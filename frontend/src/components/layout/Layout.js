import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-4 px-4 sm:px-6 lg:px-8 pt-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;