import React, { useState } from 'react';
import DashboardView from './components/DashboardView';
import AgencyTab from './components/AgencyTab';
import HoardingTab from './components/HoardingTab';
import QuarterlyTab from './components/QuarterlyTab';
import StabilityTab from './components/StabilityTab';
import TPSchemeMasterTab from './components/TPSchemeMasterTab';
import PendingTab from './components/PendingTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<number>(0);

  // સ્ટેટ રેકોર્ડ્સ
  const [agencies, setAgencies] = useState<any[]>([]);
  const [hoardings, setHoardings] = useState<any[]>([]);
  const [quarterlyPayments, setQuarterlyPayments] = useState<any[]>([]);
  const [stabilityCertificates, setStabilityCertificates] = useState<any[]>([]);
  // ✅ નવો કોડ (TP સ્કીમ્સના લિસ્ટ સાથે):
const [tpSchemes, setTpSchemes] = useState<any[]>([
  { id: 1, tpNo: "27", name: "ઉત્રાણ-કોસાડ" },
  { id: 2, tpNo: "33", name: "ઉત્રાણ" },
  { id: 3, tpNo: "24", name: "મોટા વરાછા-ઉત્રાણ" },
  { id: 4, tpNo: "18", name: "મોટા વરાછા" },
  { id: 5, tpNo: "25", name: "મોટા વરાછા" },
  { id: 6, tpNo: "22", name: "સરથાણા-વાલોદ" },
  { id: 7, tpNo: "58", name: "વાલોદ" },
  { id: 8, tpNo: "47", name: "ખોલવડ-ભાડા નો પાર્ટ" },
  { id: 9, tpNo: "20", name: "નાના વરાછા-કાપોદ્રા" },
  { id: 10, tpNo: "38", name: "નાના વરાછા" },
  { id: 11, tpNo: "68", name: "પુણા-સીમાડા" },
  { id: 12, tpNo: "21", name: "સરથાણા-સીમાડા" },
  { id: 13, tpNo: "92", name: "સીમાડા-કોસમાડા" },
  { id: 14, tpNo: "85", name: "સરથાણા-પાસોદરા" },
  { id: 15, tpNo: "51", name: "કોસમાડા-ખડસદ-પીલોદરા-સીમાડા નો પાર્ટ" },
  { id: 16, tpNo: "84", name: "કોસાડ-ભરથાણા" },
  { id: 17, tpNo: "94", name: "મોટા વરાછા" },
  { id: 18, tpNo: "89", name: "કોસાડ" }
]);

  // 1. Hoarding Handlers
  const handleAddHoarding = async (data: any): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const handleEditHoarding = async (data: any): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const handleDeleteHoarding = async (id: number): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // 2. Agency Handlers
  const handleAddAgency = async (data: any): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleEditAgency = async (data: any): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleDeleteAgency = async (id: number): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      return false;
    }
  };

  // 3. Quarterly Payment Handlers
  const handleAddPayment = async (data: any): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleEditPayment = async (data: any): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleDeletePayment = async (id: number): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      return false;
    }
  };

  // 4. Stability Certificate Handlers
  const handleAddStabilityCert = async (data: any): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleEditStabilityCert = async (data: any): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleDeleteStabilityCert = async (id: number): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      return false;
    }
  };

  // 5. TP Scheme Handlers
  const handleAddTPScheme = async (data: any): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleEditTPScheme = async (data: any): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleDeleteTPScheme = async (id: number): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleRestoreTPScheme = async (id: number): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 🟢 નવી નેવિગેશન બાર જે ઉમેરવામાં આવી છે 🟢 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-slate-800">
              SMC Hoarding Management System
            </h1>
          </div>
          
          {/* Tabs Navigation Buttons */}
          <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveTab(0)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 0
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ડેશબોર્ડ
            </button>

            <button
              onClick={() => setActiveTab(1)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 1
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              એજન્સી માસ્ટર
            </button>

            <button
              onClick={() => setActiveTab(2)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 2
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              હોર્ડિંગ માસ્ટર
            </button>

            <button
              onClick={() => setActiveTab(3)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 3
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ત્રિમાસિક ચૂકવણી
            </button>

            <button
              onClick={() => setActiveTab(4)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 4
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              બાકી ફી (Pending Fees)
            </button>

            <button
              onClick={() => setActiveTab(5)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 5
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              સ્ટેબિલિટી સર્ટિફિકેટ
            </button>

            <button
              onClick={() => setActiveTab(6)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 6
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              TP સ્કીમ માસ્ટર
            </button>
          </nav>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Tab 0: Dashboard */}
        {activeTab === 0 && (
          <DashboardView
            agencies={agencies}
            hoardings={hoardings}
            quarterlyPayments={quarterlyPayments}
            stabilityCertificates={stabilityCertificates}
            tpSchemes={tpSchemes}
            onNavigateToTab={(tabIndex) => setActiveTab(tabIndex)}
          />
        )}

        {/* Tab 1: Agencies */}
        {activeTab === 1 && (
          <AgencyTab
            agencies={agencies}
            onAdd={handleAddAgency}
            onEdit={handleEditAgency}
            onDelete={handleDeleteAgency}
          />
        )}

        {/* Tab 2: Hoardings */}
        {activeTab === 2 && (
          <HoardingTab
            hoardings={hoardings}
            agencies={agencies}
            tpSchemes={tpSchemes}
            onAdd={handleAddHoarding}
            onEdit={handleEditHoarding}
            onDelete={handleDeleteHoarding}
          />
        )}

        {/* Tab 3: Quarterly Payments */}
        {activeTab === 3 && (
          <QuarterlyTab
            quarterlyPayments={quarterlyPayments}
            agencies={agencies}
            hoardings={hoardings}
            onAdd={handleAddPayment}
            onEdit={handleEditPayment}
            onDelete={handleDeletePayment}
          />
        )}

        {/* Tab 4: Pending Fees */}
        {activeTab === 4 && (
          <PendingTab
            hoardings={hoardings}
            quarterlyPayments={quarterlyPayments}
          />
        )}

        {/* Tab 5: Stability Certificates */}
        {activeTab === 5 && (
          <StabilityTab
            stabilityCertificates={stabilityCertificates}
            agencies={agencies}
            hoardings={hoardings}
            onAdd={handleAddStabilityCert}
            onEdit={handleEditStabilityCert}
            onDelete={handleDeleteStabilityCert}
          />
        )}

        {/* Tab 6: TP Scheme Master */}
        {activeTab === 6 && (
          <TPSchemeMasterTab
            tpSchemes={tpSchemes}
            onAdd={handleAddTPScheme}
            onEdit={handleEditTPScheme}
            onDelete={handleDeleteTPScheme}
            onRestore={handleRestoreTPScheme}
          />
        )}
      </main>
    </div>
  );
}