import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Target,
  PiggyBank,
  Globe,
  Download,
  Share2,
  Calculator,
  Calendar,
  Percent,
  Wallet,
  Flame,
  Award
} from 'lucide-react';

// --- Types ---

interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

interface YearlyData {
  year: number;
  totalCapital: number;
  invested: number;
  earned: number;
  yearlyDividends: number;
  yearlyContribution: number;
  isFreedom: boolean;
}

// --- Constants ---

const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'RUB', symbol: '₽', name: 'Российский рубль', flag: '🇷🇺' },
  { code: 'UZS', symbol: 'сўм', name: 'Узбекский сум', flag: '🇺🇿' },
  { code: 'KZT', symbol: '₸', name: 'Казахстанский тенге', flag: '🇰🇿' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'BYN', symbol: 'Br', name: 'Белорусский рубль', flag: '🇧🇾' },
];

export default function CompoundInterestCalculator() {
  // --- State ---
  const [years, setYears] = useState<number>(10);
  const [annualRate, setAnnualRate] = useState<number>(10);
  const [inputMode, setInputMode] = useState<'manual' | 'auto'>('manual');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(CURRENCIES[1]); 
  
  // "Initial Contribution" in auto mode logic acts as "First Year Contribution".
  // "Start Amount" is the capital you HAVE RIGHT NOW (Year 0).
  const [startAmount, setStartAmount] = useState<number>(0); 
  const [initialContribution, setInitialContribution] = useState<number>(1000); // For Auto Mode base
  const [growthRate, setGrowthRate] = useState<number>(10); // % growth of contribution
  
  const [manualContributions, setManualContributions] = useState<number[]>(
    Array.from({ length: 50 }, (_, i) => 
      i === 0 ? 1000 : i === 1 ? 2000 : i === 2 ? 5000 : 10000
    )
  );

  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // --- Effects ---

  useEffect(() => {
    setManualContributions((prev) => {
      if (prev.length < years) {
        const lastValue = prev.length > 0 ? prev[prev.length - 1] : 10000;
        return [...prev, ...Array(years - prev.length).fill(lastValue)];
      } 
      return prev;
    });
  }, [years]);

  // SEO: Dynamic Title Update
  // Updates the browser tab title to show specific results, increasing user engagement and click-through
  useEffect(() => {
    // Calculate final format for title
    const monthlyRate = annualRate / 100 / 12;
    let totalCapital = startAmount;
    // Quick approx calc for title only
    for (let year = 1; year <= years; year++) {
      let contribution = inputMode === 'manual' ? (manualContributions[year - 1] || 0) : initialContribution * Math.pow(1 + growthRate / 100, year - 1);
      totalCapital = (totalCapital * Math.pow(1 + monthlyRate, 12)) + (contribution * Math.pow(1 + monthlyRate, 12));
    }
    const finalFormatted = new Intl.NumberFormat('ru-RU', { notation: "compact", maximumFractionDigits: 1 }).format(totalCapital);
    
    document.title = `Калькулятор: Рост до ${finalFormatted} ${selectedCurrency.symbol} за ${years} лет | Сложный процент`;
  }, [selectedCurrency, years, annualRate, startAmount, inputMode, initialContribution, growthRate, manualContributions]);

  // --- Handlers ---

  const updateContribution = (index: number, value: string) => {
    const newContributions = [...manualContributions];
    // Remove non-digits/dots. If empty, it becomes 0.
    const cleanValue = value === '' ? 0 : (parseFloat(value.replace(/[^0-9.]/g, '')) || 0);
    newContributions[index] = cleanValue;
    setManualContributions(newContributions);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(Math.round(num));
  };

  const handleDownloadPDF = () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    
    // Check if html2pdf is loaded
    if (typeof (window as any).html2pdf === 'undefined') {
      alert('Библиотека PDF еще не загружена. Пожалуйста, подождите секунду и попробуйте снова.');
      setIsGeneratingPdf(false);
      return;
    }

    const element = reportRef.current;
    const opt = {
      margin:       [10, 10, 10, 10], // top, left, bottom, right
      filename:     `investment_plan_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    (window as any).html2pdf().set(opt).from(element).save().then(() => {
      setIsGeneratingPdf(false);
    });
  };

  const handleShare = async () => {
    const title = 'Мой инвестиционный план';
    const text = `Я планирую накопить ${formatNumber(calculatedData.finalTotal)} ${selectedCurrency.symbol} за ${years} лет!`;
    const url = window.location.href;
    const shareData = { title, text, url };
    const clipboardText = `${title}\n${text}\n${url}`;

    const performCopy = async () => {
      // 1. Попытка использовать современный Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(clipboardText);
          alert('Скопировано!');
          return; // Успешно, выходим
        } catch (err) {
          console.warn('Clipboard API failed, trying fallback...', err);
          // Если не получилось, идем к варианту ниже (fallback)
        }
      }

      // 2. Fallback через document.execCommand('copy')
      try {
        const textArea = document.createElement("textarea");
        textArea.value = clipboardText;
        
        // Стили, чтобы элемент не был виден пользователю, но был в DOM
        textArea.style.position = "fixed";
        textArea.style.left = "0";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          alert('Скопировано!');
        } else {
          alert('Не удалось скопировать автоматически.');
        }
      } catch (err) {
        console.error('Fallback copy failed', err);
        alert('Ошибка при копировании.');
      }
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Если пользователь отменил (AbortError), ничего не делаем.
        // Если другая ошибка, пробуем копировать.
        if (err instanceof Error && err.name !== 'AbortError') {
          await performCopy();
        }
      }
    } else {
      await performCopy();
    }
  };

  // --- Calculations ---

  const calculatedData = useMemo(() => {
    const monthlyRate = annualRate / 100 / 12;
    const data: YearlyData[] = [];
    
    // Start with the initial capital (money you have right now)
    let totalCapital = startAmount;
    let totalInvested = startAmount;
    let freedomYear: number | null = null;

    for (let year = 1; year <= years; year++) {
      let yearlyContribution = 0;

      if (inputMode === 'manual') {
        yearlyContribution = manualContributions[year - 1] || 0;
      } else {
        // Auto: Year 1 = initialContribution, Year 2 = Year 1 * (1+growth)...
        yearlyContribution = initialContribution * Math.pow(1 + growthRate / 100, year - 1);
      }
      
      const previousCapital = totalCapital;
      
      // Capital grows by interest
      const compoundedExisting = previousCapital * Math.pow(1 + monthlyRate, 12);
      
      // Contribution grows (assuming added monthly or simply compounded annually for this model)
      const compoundedContribution = yearlyContribution * Math.pow(1 + monthlyRate, 12);
      
      totalCapital = compoundedExisting + compoundedContribution;
      totalInvested += yearlyContribution;

      const earned = totalCapital - totalInvested;
      
      // Dividends for the NEXT year based on current capital
      const yearlyDividends = totalCapital * (annualRate / 100);

      if (!freedomYear && yearlyDividends >= yearlyContribution && yearlyContribution > 0) {
        freedomYear = year;
      }

      data.push({
        year,
        totalCapital: Math.round(totalCapital),
        invested: Math.round(totalInvested),
        earned: Math.round(earned),
        yearlyDividends: Math.round(yearlyDividends),
        yearlyContribution: Math.round(yearlyContribution),
        isFreedom: year === freedomYear
      });
    }

    return { 
      data, 
      freedomYear, 
      finalInvested: totalInvested, 
      finalEarned: totalCapital - totalInvested, 
      finalTotal: totalCapital 
    };
  }, [years, annualRate, inputMode, initialContribution, growthRate, manualContributions, startAmount]);

  // --- Analysis Helpers ---
  const analysisData = useMemo(() => {
    const targetData = calculatedData.freedomYear 
      ? calculatedData.data.find(d => d.year === calculatedData.freedomYear) 
      : calculatedData.data[calculatedData.data.length - 1];
    
    // Fallback if data array is empty
    if (!targetData) return { year: 0, annualDivs: 0, monthlyDivs: 0 };

    const monthlyDivs = targetData.yearlyDividends / 12;
    
    return {
      year: targetData.year,
      annualDivs: targetData.yearlyDividends,
      monthlyDivs: Math.round(monthlyDivs)
    };
  }, [calculatedData]);

  // --- Custom Components ---

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-xl rounded-xl min-w-[200px]">
          <p className="text-gray-500 text-xs font-semibold mb-3 uppercase tracking-wider">{label} год</p>
          <div className="space-y-3">
            {/* Invested Section */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
                <span className="text-sm font-medium text-gray-600">Вложено</span>
              </div>
              <span className="text-sm font-bold text-gray-900 tabular-nums">
                {formatNumber(payload[0].value)} {selectedCurrency.symbol}
              </span>
            </div>
            
            {/* Earned Section */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                <span className="text-sm font-medium text-gray-600">Накоплено %</span>
              </div>
              <span className="text-sm font-bold text-green-600 tabular-nums">
                +{formatNumber(payload[1].value)} {selectedCurrency.symbol}
              </span>
            </div>

            <div className="h-px bg-gray-100 my-1"></div>
            
            {/* Total Section */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <span className="text-sm font-bold text-gray-800">Всего</span>
              <span className="text-base font-bold text-gray-900 tabular-nums">
                {formatNumber(payload[0].value + payload[1].value)} {selectedCurrency.symbol}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 md:p-8">
      
      {/* Container for PDF Generation */}
      <main id="report-content" ref={reportRef} className="max-w-6xl mx-auto bg-gray-50">
        
        {/* Header Section */}
        <header className="mb-8 text-center sm:text-left sm:flex sm:items-end sm:justify-between border-b border-gray-200 pb-6">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Calculator className="text-white w-6 h-6" aria-hidden="true" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Калькулятор Инвестиций
              </h1>
            </div>
            <p className="text-gray-500 max-w-lg mx-auto sm:mx-0">
              Планируйте своё финансовое будущее с учётом сложного процента. 
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex gap-2 justify-center" data-html2canvas-ignore="true">
             <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              aria-label="Скачать расчет в PDF"
              className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 outline-none"
            >
              <Download size={16} aria-hidden="true" />
              {isGeneratingPdf ? 'Создание...' : 'PDF'}
            </button>
            <button 
              onClick={handleShare}
              aria-label="Поделиться расчетом"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 outline-none"
            >
              <Share2 size={16} aria-hidden="true" />
              Поделиться
            </button>
          </div>
        </header>

        {/* Currency Tabs */}
        <nav className="mb-8" aria-label="Выбор валюты">
          <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Валюта расчета</span>
          <div className="flex flex-wrap gap-2">
            {CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => setSelectedCurrency(currency)}
                aria-label={`Выбрать валюту ${currency.name}`}
                aria-pressed={selectedCurrency.code === currency.code}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 outline-none ${
                  selectedCurrency.code === currency.code
                    ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                <span role="img" aria-label={`Флаг ${currency.name}`}>{currency.flag}</span>
                <span>{currency.code}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Grid: Controls & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
          {/* Left Column: Settings */}
          <div className="lg:col-span-4 space-y-6">
            <section aria-labelledby="params-heading" className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100">
              <h2 id="params-heading" className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" aria-hidden="true" />
                Параметры
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label htmlFor="years-range" className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    Срок инвестирования
                    <span className="text-blue-600 font-bold">{years} лет</span>
                  </label>
                  <input
                    id="years-range"
                    type="range"
                    min="1"
                    max="50"
                    value={years}
                    onChange={(e) => setYears(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-valuemin={1}
                    aria-valuemax={50}
                    aria-valuenow={years}
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>1 год</span>
                    <span>50 лет</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="annual-rate" className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-gray-500" aria-hidden="true" />
                      Ожидаемая доходность (%)
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      id="annual-rate"
                      type="number"
                      placeholder="0"
                      value={annualRate || ''}
                      onChange={(e) => setAnnualRate(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-semibold text-gray-900"
                    />
                    <div className="absolute right-4 top-3.5 text-gray-600 pointer-events-none" aria-hidden="true">%</div>
                  </div>
                </div>

                <div>
                  <label htmlFor="start-amount" className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-gray-500" aria-hidden="true" />
                      Стартовый капитал ({selectedCurrency.symbol})
                    </div>
                  </label>
                  <input
                    id="start-amount"
                    type="text"
                    placeholder="0"
                    value={startAmount ? formatNumber(startAmount) : ''}
                    onChange={(e) => setStartAmount(e.target.value === '' ? 0 : (parseFloat(e.target.value.replace(/\s/g, '')) || 0))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-semibold text-gray-900"
                  />
                </div>
              </div>
            </section>

            <section aria-labelledby="contributions-heading" className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100">
               <div className="flex items-center justify-between mb-5">
                 <h2 id="contributions-heading" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <PiggyBank className="w-5 h-5 text-gray-500" aria-hidden="true" />
                    Пополнения
                 </h2>
                 <div className="flex bg-gray-100 rounded-lg p-1" role="group" aria-label="Режим ввода пополнений">
                    <button
                      onClick={() => setInputMode('manual')}
                      aria-pressed={inputMode === 'manual'}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all focus:ring-2 focus:ring-blue-500 outline-none ${inputMode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Ручной
                    </button>
                    <button
                      onClick={() => setInputMode('auto')}
                      aria-pressed={inputMode === 'auto'}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all focus:ring-2 focus:ring-blue-500 outline-none ${inputMode === 'auto' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Авто
                    </button>
                 </div>
               </div>

               {inputMode === 'auto' ? (
                 <div className="space-y-4">
                    <div>
                      <label htmlFor="auto-contribution" className="block text-sm font-medium text-gray-700 mb-2">
                        Сумма в первый год ({selectedCurrency.symbol})
                      </label>
                      <input
                        id="auto-contribution"
                        type="text"
                        placeholder="0"
                        value={initialContribution ? formatNumber(initialContribution) : ''}
                        onChange={(e) => setInitialContribution(e.target.value === '' ? 0 : (parseFloat(e.target.value.replace(/\s/g, '')) || 0))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-semibold text-gray-900"
                      />
                    </div>
                    <div>
                      <label htmlFor="growth-rate" className="block text-sm font-medium text-gray-700 mb-2">
                         Индексация взносов (%)
                      </label>
                      <input
                        id="growth-rate"
                        type="number"
                        placeholder="0"
                        value={growthRate || ''}
                        onChange={(e) => setGrowthRate(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-semibold text-gray-900"
                      />
                      <p className="text-xs text-gray-600 mt-2">Каждый год сумма пополнения увеличивается на этот процент.</p>
                    </div>
                 </div>
               ) : (
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-3" id="manual-years-label">
                     План по годам ({selectedCurrency.symbol})
                   </label>
                   <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2" role="list" aria-labelledby="manual-years-label">
                     {manualContributions.slice(0, years).map((contribution, index) => (
                       <div key={index} className="flex items-center gap-3" role="listitem">
                         <span className="text-xs font-mono text-gray-600 w-8" aria-hidden="true">{index + 1} год</span>
                         <input
                           type="text"
                           placeholder="0"
                           aria-label={`Взнос за ${index + 1} год`}
                           value={contribution ? formatNumber(contribution) : ''}
                           onChange={(e) => updateContribution(index, e.target.value)}
                           className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                         />
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </section>
          </div>

          {/* Right Column: Results & Charts */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Stats Cards */}
            <section aria-label="Итоговые показатели" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <article className="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" aria-hidden="true"></div>
                  <h3 className="text-sm font-semibold text-gray-700 relative z-10">Всего вложено</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1 relative z-10">{formatNumber(calculatedData.finalInvested)} {selectedCurrency.symbol}</p>
               </article>
               
               <article className="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" aria-hidden="true"></div>
                  <h3 className="text-sm font-semibold text-gray-700 relative z-10">Доход (проценты)</h3>
                  <p className="text-2xl font-bold text-green-600 mt-1 relative z-10">+{formatNumber(calculatedData.finalEarned)} {selectedCurrency.symbol}</p>
               </article>

               <article className="bg-gray-900 p-5 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.1)] border border-gray-800 text-white relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-gray-800 rounded-bl-full -mr-8 -mt-8 opacity-50" aria-hidden="true"></div>
                  <h3 className="text-sm font-medium text-gray-300 relative z-10">Итоговый капитал</h3>
                  <p className="text-3xl font-bold mt-1 relative z-10">{formatNumber(calculatedData.finalTotal)} {selectedCurrency.symbol}</p>
               </article>
            </section>

            {/* Charts */}
            <section className="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100" aria-labelledby="chart-growth-heading">
               <div className="flex items-center justify-between mb-6">
                 <h3 id="chart-growth-heading" className="text-lg font-bold text-gray-900">Рост капитала</h3>
                 {calculatedData.freedomYear && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold" role="status">
                       <Target size={14} aria-hidden="true" />
                       Свобода: {calculatedData.freedomYear} год
                    </span>
                 )}
               </div>
               
               <div className="h-[350px] w-full" role="img" aria-label="График роста капитала по годам">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={calculatedData.data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                     <XAxis 
                        dataKey="year" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }} 
                        dy={10}
                     />
                     <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }} 
                        tickFormatter={(value) => `${value / 1000}k`} 
                     />
                     <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [formatNumber(value), '']}
                     />
                     <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                     <Line type="monotone" dataKey="totalCapital" stroke="#111827" strokeWidth={3} name="Капитал" dot={false} activeDot={{ r: 6 }} />
                     <Line type="monotone" dataKey="yearlyContribution" stroke="#6b7280" strokeWidth={2} strokeDasharray="4 4" name="Взносы" dot={false} />
                     <Line type="monotone" dataKey="yearlyDividends" stroke="#10b981" strokeWidth={2} name="Дивиденды" dot={false} />
                     
                     {calculatedData.freedomYear && (
                        <ReferenceDot
                          x={calculatedData.freedomYear}
                          y={calculatedData.data[calculatedData.freedomYear - 1].totalCapital}
                          r={6}
                          fill="#f59e0b"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      )}
                   </LineChart>
                 </ResponsiveContainer>
               </div>
            </section>

             <section className="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100" aria-labelledby="chart-portfolio-heading">
                <h3 id="chart-portfolio-heading" className="text-lg font-bold text-gray-900 mb-6">Состав портфеля</h3>
                <div className="h-[300px] w-full" role="img" aria-label="Диаграмма состава портфеля: личные вложения против накопленных процентов">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={calculatedData.data} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                         <XAxis 
                            dataKey="year" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }} 
                            dy={10} 
                         />
                         <YAxis hide />
                         <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(59, 130, 246, 0.05)'}} />
                         <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                         <Bar dataKey="invested" stackId="a" fill="#3b82f6" name="Личные вложения" radius={[0, 0, 4, 4]} />
                         <Bar dataKey="earned" stackId="a" fill="#10b981" name="Накопленные %" radius={[4, 4, 0, 0]} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </section>

             {/* SEO Information & Analytics Section about Financial Freedom */}
             <section className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 sm:p-8 rounded-2xl border border-amber-100" aria-labelledby="freedom-info-heading">
               <div className="flex items-start gap-4 sm:gap-6">
                 <div className="bg-white p-3 sm:p-4 rounded-full shadow-sm text-amber-500 hidden sm:flex shrink-0">
                   <Flame size={28} aria-label="Иконка огня финансовой свободы" />
                 </div>
                 <div className="w-full">
                   <h2 id="freedom-info-heading" className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                     Анализ: <span className="text-amber-600">Точка Финансовой Свободы</span>
                   </h2>
                   
                   {/* Dynamic Calculations Box */}
                   <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-5 rounded-xl border border-amber-200 mb-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="text-amber-500 w-5 h-5" />
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">
                          Ваш прогноз {calculatedData.freedomYear ? `(Цель достигнута: ${calculatedData.freedomYear} год)` : `(Прогноз на ${years} год)`}
                        </h3>
                      </div>
                      <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                         На {analysisData.year}-м году ваши <strong>годовые дивиденды</strong> составят {formatNumber(analysisData.annualDivs)} {selectedCurrency.symbol}.
                         <br/>
                         Это обеспечит вам <strong>пассивный доход</strong> в размере:
                      </p>
                      <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
                        {formatNumber(analysisData.monthlyDivs)} {selectedCurrency.symbol} <span className="text-base sm:text-lg font-medium text-gray-500">/ месяц</span>
                      </div>
                   </div>

                   {/* SEO Educational Text */}
                   <div className="space-y-4 text-gray-700 text-sm sm:text-base leading-relaxed">
                     <p>
                       <strong>Точка финансовой свободы</strong> — это ключевой этап в инвестициях, когда ваши <em>дивиденды</em> и проценты полностью покрывают сумму ежегодных взносов, а в перспективе — и все жизненные расходы (стратегия FIRE).
                     </p>
                     
                     <h3 className="text-lg font-bold text-gray-800 mt-4 mb-2">Почему важен этот показатель?</h3>
                     <ul className="list-disc pl-5 space-y-2 marker:text-amber-500">
                       <li>
                         <strong>Будущая пенсия:</strong> Рассчитанная выше сумма ежемесячных выплат показывает, на какой уровень жизни вы сможете рассчитывать, прекратив активную работу.
                       </li>
                       <li>
                         <strong>Замена зарплаты:</strong> Когда пассивный доход от инвестиций превышает вашу текущую зарплату, вы обретаете полную независимость.
                       </li>
                       <li>
                         <strong>Эффект снежного кома:</strong> После прохождения точки свободы, <em>калькулятор сложного процента</em> показывает экспоненциальный рост капитала уже без ваших усилий.
                       </li>
                     </ul>
                     <p className="text-sm text-gray-500 italic mt-4">
                       Используйте этот калькулятор инвестиций, чтобы найти оптимальный баланс между стартовым капиталом и ежемесячными вложениями для скорейшего достижения свободы.
                     </p>
                   </div>
                 </div>
               </div>
             </section>

          </div>
        </div>
      </main>
    </div>
  );
}