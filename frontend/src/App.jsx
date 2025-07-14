import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SideMenu from './components/SideMenu';
import { CurrencyProvider } from './context/CurrencyContext';
import InvoiceGenerator from './components/InvoiceGenerator';
import MainMenu from './components/MainMenu';
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
        <div className="min-h-screen bg-neutral-900 text-white">
          <div className="flex h-screen">
            <SideMenu />
            <div className="flex-1 flex flex-col">
              <MainMenu />
              <main className="flex-1 bg-neutral-100 overflow-y-auto p-8 text-white">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/invoices" element={<InvoiceGenerator {...invoice} />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          </div>
        </div>
      </Router>
    </CurrencyProvider>
  );
}

export default App;
