import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

interface CurrencyContextType {
  currency: CurrencyOption;
  setCurrency: (currency: CurrencyOption) => void;
  currencyOptions: CurrencyOption[];
}

const currencyOptions: CurrencyOption[] = [
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

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyOption>(currencyOptions[0]);
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencyOptions }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
