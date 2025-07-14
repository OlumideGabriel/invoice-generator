import React, { createContext, useContext, useState } from 'react';

const CurrencyContext = createContext();

const currencyOptions = [
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
  { code: 'NGN', symbol: '₦', label: 'Naira (₦)' },
];

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(currencyOptions[0]);
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencyOptions }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
