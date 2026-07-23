import React, { useState } from 'react';

// ઓરિજિનલ કમ્પોનન્ટ્સ Import કરો
import LoginForm from './components/LoginForm';
import DashboardView from './components/DashboardView';
import HoardingTab from './components/HoardingTab';
import AgencyTab from './components/AgencyTab';
import QuarterlyTab from './components/QuarterlyTab';
import AnnualTab from './components/AnnualTab';
import StabilityTab from './components/StabilityTab';
import TPSchemeMasterTab from './components/TPSchemeMasterTab';
import ReportsTab from './components/ReportsTab';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // 📦 મુખ્ય સ્ટેટ્સ (Data States)
  const [agencies, setAgencies] = useState<any[]>([]);
  const [hoardings, setHoardings] = useState<any[]>([]);
  const [quarterlyPayments, setQuarterlyPayments] = useState<any[]>([]);
  const [stabilityCertificates, setStabilityCertificates] = useState<any[]>([]);
  const [tpSchemes, setTpSchemes] = useState<any[]>([]);

  // 🔄 એજન્સી હેન્ડલર્સ
  const handleAddAgency = (data: any) => setAgencies((prev) => [...prev, { ...data, id: Date.now() }]);
  const handleEditAgency = (data: any) => setAgencies((prev) => prev.map((item) => (item.id === data.id ? data : item)));
  const handleDeleteAgency = (id: any) => setAgencies((prev) => prev.filter((item) => item.id !== id));

  // 🔄 હોર્ડિંગ હેન્ડલર્સ
  const handleAddHoarding = (data: any) => setHoardings((prev) => [...prev, { ...data, id: Date.now() }]);
  const handleEditHoarding = (data: any) => setHoardings((prev) => prev.map((item) => (item.id === data.id ? data : item)));
  const handleDeleteHoarding = (id: any) => setHoardings((prev) => prev.filter((item) => item.id !== id));

  // 🔄 ત્રિમાસિક પેમેન્ટ હેન્ડલર્સ
  const handleAddQuarterly = (data: any) => setQuarterlyPayments((prev) => [...prev, { ...data, id: Date.now() }]);
  const handleEditQuarterly = (data: any) => setQuarterlyPayments((prev) => prev.map((item) => (item.id === data.id ? data : item)));
  const handleDeleteQuarterly = (id: any) => setQuarterlyPayments((prev) => prev.filter((item) => item.id !== id));

  // 🔄 સ્ટેબિલિટી સર્ટિફિકેટ હેન્ડલર્સ
  const handleAddStability = (data: any) => setStabilityCertificates((prev) => [...prev, { ...data, id: Date.now() }]);
  const handleEditStability = (data: any) => setStabilityCertificates((prev) => prev.map((item) => (item.id === data.id ? data : item)));
  const handleDeleteStability = (id: any) => setStabilityCertificates((prev) => prev.filter((item) => item.id !== id));

  // 🔄 ટી.પી. સ્કીમ હેન્ડલર્સ
  const handleAddTPScheme = (data: any) => setTpSchemes((prev) => [...prev, { ...data, id: Date.now() }]);
  const handleEditTPScheme = (data: any) => setTpSchemes((prev) => prev.map((item) => (item.id === data.id ? data : item)));
  const handleDeleteTPScheme = (id: any) => setTpSchemes((prev) => prev.filter((item) => item.id !== id));
  const handleRestoreTPScheme = (id: any) => console.log('Restore TP Scheme:', id);

  if (!isLoggedIn) {
    return <LoginForm onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* 🏛️ Top Header */}
      <header className="bg-blue-900 text-white shadow-md border-b-4 border-amber-500">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg text-blue-900 font-bold text-2xl shadow">🏛️</div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">સુરત મ્યુનિસિપલ કોર્પોરેશન (SMC)</h1>
              <p className="text-xs text-blue-200">Hoarding Management & Tax Collection System</p>
            </div>
          </div>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            લોગઆઉટ
          </button>
        </div>
      </header>

      {/* 📌 Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 flex space-x-1 overflow-x-auto">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
              activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-blue-600'
            }`}
          >
            📊 ડેશબોર્ડ
          </button>

          <button
            onClick={() => setActiveTab('hoardings')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
              activeTab === 'hoardings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-blue-600'
            }`}
          >
            📍 હોર્ડિંગ્સ રજિસ્ટર
          </button>

          <button
            onClick={() => setActiveTab('agencies')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
              activeTab === 'agencies' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-blue-600'
            }`}
          >
            🏢 એજન્સી માસ્ટર
          </button>

          <button
            onClick={() => setActiveTab('quarterly')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
              activeTab === 'quarterly' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-blue-600'
            }`}
          >
            💳 ત્રિમાસિક પેમેન્ટ્સ
          </button>

          <button
            onClick={() => setActiveTab('annual')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
              activeTab === 'annual' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-blue-600'
            }`}
          >
            📅 વાર્ષિક હિસાબ
          </button>

          <button
            onClick={() => setActiveTab('stability')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
              activeTab === 'stability' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-blue-600'
            }`}
          >
            🛡️ સ્ટેબિલિટી સર્ટિફિકેટ
          </button>

          <button
            onClick={() => setActiveTab('tpScheme')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
              activeTab === 'tpScheme' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-blue-600'
            }`}
          >
            📐 ટી.પી. સ્કીમ માસ્ટર
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
              activeTab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-blue-600'
            }`}
          >
            📑 રીપોર્ટસ
          </button>

        </div>
      </nav>

      {/* 📊 Main Content Area With All Required Props Passed */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView 
            agencies={agencies} 
            hoardings={hoardings} 
            quarterlyPayments={quarterlyPayments} 
            stabilityCertificates={stabilityCertificates} 
            tpSchemes={tpSchemes}
          />
        )}
        
        {activeTab === 'hoardings' && (
          <HoardingTab 
            hoardings={hoardings} 
            agencies={agencies} 
            tpSchemes={tpSchemes} 
            onAdd={handleAddHoarding} 
            onEdit={handleEditHoarding} 
            onDelete={handleDeleteHoarding}
          />
        )}

        {activeTab === 'agencies' && (
          <AgencyTab 
            agencies={agencies} 
            onAdd={handleAddAgency} 
            onEdit={handleEditAgency} 
            onDelete={handleDeleteAgency}
          />
        )}

        {activeTab === 'quarterly' && (
          <QuarterlyTab 
            quarterlyPayments={quarterlyPayments} 
            agencies={agencies} 
            hoardings={hoardings} 
            onAdd={handleAddQuarterly} 
            onEdit={handleEditQuarterly} 
            onDelete={handleDeleteQuarterly}
          />
        )}

        {activeTab === 'annual' && (
          <AnnualTab 
            agencies={agencies} 
            hoardings={hoardings} 
            quarterlyPayments={quarterlyPayments}
          />
        )}

        {activeTab === 'stability' && (
          <StabilityTab 
            stabilityCertificates={stabilityCertificates} 
            agencies={agencies} 
            hoardings={hoardings} 
            onAdd={handleAddStability} 
            onEdit={handleEditStability} 
            onDelete={handleDeleteStability}
          />
        )}

        {activeTab === 'tpScheme' && (
          <TPSchemeMasterTab 
            tpSchemes={tpSchemes} 
            onAdd={handleAddTPScheme} 
            onEdit={handleEditTPScheme} 
            onDelete={handleDeleteTPScheme} 
            onRestore={handleRestoreTPScheme}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab 
            agencies={agencies} 
            hoardings={hoardings} 
            quarterlyPayments={quarterlyPayments} 
            stabilityCertificates={stabilityCertificates} 
            tpSchemes={tpSchemes}
          />
        )}
      </main>

    </div>
  );
}