import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SideMenu from './components/SideMenu';
import { CurrencyProvider } from './context/CurrencyContext';
import InvoiceGenerator from './components/InvoiceGenerator';
import MainMenu from './components/MainMenu';
import Footer from './components/Footer';
import useInvoice from './hooks/useInvoice';

function Dashboard() {
  return <div className="p-6">Dashboard Page</div>;
}

function Clients() {
  return <div className="p-6">Clients Page</div>;
}

function Settings() {
  return <div className="p-6">Settings Page</div>;
}

function App() {
  const invoice = useInvoice();


return (
    <CurrencyProvider>
      <Router>
        <div className="min-h-screen w-full flex flex-col">
          <MainMenu />
          <div className="flex flex-row flex-1 main-content min-h-0">
            <SideMenu />
            <main className="flex-1 overflow-y-auto p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/invoices" element={<InvoiceGenerator {...invoice} />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
          <Footer />
        </div>
      </Router>
    </CurrencyProvider>
  );
}

export default App;