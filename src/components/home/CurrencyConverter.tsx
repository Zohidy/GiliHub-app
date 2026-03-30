import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, ArrowRightLeft, DollarSign, Euro, Coins, Loader2 } from 'lucide-react';
import { getExchangeRates } from '../../services/apiServices';

const CURRENCIES = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', icon: Coins },
  { code: 'USD', name: 'US Dollar', symbol: '$', icon: DollarSign },
  { code: 'EUR', name: 'Euro', symbol: '€', icon: Euro },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', icon: DollarSign },
  { code: 'GBP', name: 'British Pound', symbol: '£', icon: DollarSign },
];

export default function CurrencyConverter() {
  const [amount, setAmount] = useState<number>(100000);
  const [fromCurrency, setFromCurrency] = useState('IDR');
  const [toCurrency, setToCurrency] = useState('USD');
  const [rates, setRates] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRates = async () => {
    setIsLoading(true);
    const data = await getExchangeRates(fromCurrency);
    if (data && data.conversion_rates) {
      setRates(data.conversion_rates);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRates();
  }, [fromCurrency]);

  const convertedAmount = rates ? (amount * rates[toCurrency]).toFixed(2) : '0.00';

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="bg-emerald-500/10 p-2 rounded-xl">
          <ArrowRightLeft className="text-emerald-500" size={20} />
        </div>
        <div>
          <h3 className="text-xl font-display font-semibold text-slate-900 dark:text-white tracking-tight">Currency Converter</h3>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Live Exchange Rates</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass dark:glass-dark rounded-3xl p-8 shadow-lg border border-white/40 dark:border-white/10 relative overflow-hidden"
      >
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-[100px] rounded-full"></div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Amount</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full glass-input dark:glass-input-dark border-none rounded-2xl px-4 py-4 text-lg font-medium focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{fromCurrency}</span>
              </div>
            </div>

            <button 
              onClick={handleSwap}
              className="mt-6 p-3 bg-white dark:bg-slate-800 rounded-full shadow-md hover:scale-110 transition-transform text-emerald-500"
            >
              <ArrowRightLeft size={20} />
            </button>

            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">To</label>
              <div className="relative">
                <select 
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full glass-input dark:glass-input-dark border-none rounded-2xl px-4 py-4 text-lg font-medium focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white appearance-none"
                >
                  {CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>{curr.code} - {curr.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20 text-center">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Result</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-display font-semibold text-slate-900 dark:text-white tracking-tight">
                {isLoading ? '---' : convertedAmount}
              </span>
              <span className="text-xl font-medium text-slate-400">{toCurrency}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-2">
              1 {fromCurrency} = {rates ? rates[toCurrency].toFixed(6) : '...'} {toCurrency}
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CURRENCIES.filter(c => c.code !== fromCurrency).map(curr => (
              <button
                key={curr.code}
                onClick={() => setToCurrency(curr.code)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  toCurrency === curr.code 
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                    : 'glass dark:glass-dark text-slate-500 hover:bg-emerald-500/10'
                }`}
              >
                <curr.icon size={12} />
                {curr.code}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
