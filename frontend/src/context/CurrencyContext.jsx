import React, { createContext, useContext, useState } from 'react';

const CurrencyContext = createContext();


const currencyOptions = [
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
  { code: 'NGN', symbol: '₦', label: 'Naira (₦)' },
  { code: 'CAD', symbol: '$', label: 'Canadian Dollar ($)' },
  { code: 'AUD', symbol: '$', label: 'Australian Dollar ($)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan (¥)' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
  { code: 'ZAR', symbol: 'R', label: 'South African Rand (R)' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real (R$)' },
  { code: 'MXN', symbol: '$', label: 'Mexican Peso ($)' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc (CHF)' },
  { code: 'SEK', symbol: 'kr', label: 'Swedish Krona (kr)' },
  { code: 'NOK', symbol: 'kr', label: 'Norwegian Krone (kr)' },
  { code: 'DKK', symbol: 'kr', label: 'Danish Krone (kr)' },
  { code: 'RUB', symbol: '₽', label: 'Russian Ruble (₽)' },
  { code: 'KRW', symbol: '₩', label: 'South Korean Won (₩)' },
  { code: 'SGD', symbol: '$', label: 'Singapore Dollar ($)' },
  { code: 'HKD', symbol: '$', label: 'Hong Kong Dollar ($)' },
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
