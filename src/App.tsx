import React, { useEffect, useState } from 'react';
import DashboardView from './components/DashboardView';
import AgencyTab from './components/AgencyTab';
import HoardingTab from './components/HoardingTab';
import QuarterlyTab from './components/QuarterlyTab';
import StabilityTab from './components/StabilityTab';
import TPSchemeMasterTab from './components/TPSchemeMasterTab';
import PendingTab from './components/PendingTab';
import AnnualTab from './components/AnnualTab';
import { buildHoardingRecord } from './persistence';

const apiUrl = (path: string) => `${import.meta.env.VITE_API_BASE_URL || ''}${path}`;

export default function App() {
  const [activeTab, setActiveTab] = useState<number>(0);

  // સ્ટેટ રેકોર્ડ્સ
  const [agencies, setAgencies] = useState<any[]>([]);
  const [hoardings, setHoardings] = useState<any[]>([]);
  const [quarterlyPayments, setQuarterlyPayments] = useState<any[]>([]);
  const [stabilityCertificates, setStabilityCertificates] = useState<any[]>([]);
  
  // ✅ TP સ્કીમ્સનું ડિફોલ્ટ લિસ્ટ (બધા જ પોસિબલ Key-Names સાથે)
  const [tpSchemes, setTpSchemes] = useState<any[]>([
    { id: 1, tpCode: "TP-27", code: "TP-27", tp_scheme_code: "TP-27", zoneName: "ઉત્રાણ-કોસાડ", zone: "ઉત્રાણ-કોસાડ", zone_name: "ઉત્રાણ-કોસાડ", tpName: "ટી.પી. સ્કીમ નં. ૨૭ (ઉત્રાણ-કોસાડ)", name: "ટી.પી. સ્કીમ નં. ૨૭ (ઉત્રાણ-કોસાડ)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૨૭ (ઉત્રાણ-કોસાડ)", status: "Active", displayOrder: 1, display_order: 1 },
    { id: 2, tpCode: "TP-33", code: "TP-33", tp_scheme_code: "TP-33", zoneName: "ઉત્રાણ", zone: "ઉત્રાણ", zone_name: "ઉત્રાણ", tpName: "ટી.પી. સ્કીમ નં. ૩૩ (ઉત્રાણ)", name: "ટી.પી. સ્કીમ નં. ૩૩ (ઉત્રાણ)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૩૩ (ઉત્રાણ)", status: "Active", displayOrder: 2, display_order: 2 },
    { id: 3, tpCode: "TP-24", code: "TP-24", tp_scheme_code: "TP-24", zoneName: "મોટા વરાછા-ઉત્રાણ", zone: "મોટા વરાછા-ઉત્રાણ", zone_name: "મોટા વરાછા-ઉત્રાણ", tpName: "ટી.પી. સ્કીમ નં. ૨૪ (મોટા વરાછા-ઉત્રાણ)", name: "ટી.પી. સ્કીમ નં. ૨૪ (મોટા વરાછા-ઉત્રાણ)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૨૪ (મોટા વરાછા-ઉત્રાણ)", status: "Active", displayOrder: 3, display_order: 3 },
    { id: 4, tpCode: "TP-18", code: "TP-18", tp_scheme_code: "TP-18", zoneName: "મોટા વરાછા", zone: "મોટા વરાછા", zone_name: "મોટા વરાછા", tpName: "ટી.પી. સ્કીમ નં. ૧૮ (મોટા વરાછા)", name: "ટી.પી. સ્કીમ નં. ૧૮ (મોટા વરાછા)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૧૮ (મોટા વરાછા)", status: "Active", displayOrder: 4, display_order: 4 },
    { id: 5, tpCode: "TP-25", code: "TP-25", tp_scheme_code: "TP-25", zoneName: "મોટા વરાછા", zone: "મોટા વરાછા", zone_name: "મોટા વરાછા", tpName: "ટી.પી. સ્કીમ નં. ૨૫ (મોટા વરાછા)", name: "ટી.પી. સ્કીમ નં. ૨૫ (મોટા વરાછા)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૨૫ (મોટા વરાછા)", status: "Active", displayOrder: 5, display_order: 5 },
    { id: 6, tpCode: "TP-22", code: "TP-22", tp_scheme_code: "TP-22", zoneName: "સરથાણા-વાલોદ", zone: "સરથાણા-વાલોદ", zone_name: "સરથાણા-વાલોદ", tpName: "ટી.પી. સ્કીમ નં. ૨૨ (સરથાણા-વાલોદ)", name: "ટી.પી. સ્કીમ નં. ૨૨ (સરથાણા-વાલોદ)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૨૨ (સરથાણા-વાલોદ)", status: "Active", displayOrder: 6, display_order: 6 },
    { id: 7, tpCode: "TP-58", code: "TP-58", tp_scheme_code: "TP-58", zoneName: "વાલોદ", zone: "વાલોદ", zone_name: "વાલોદ", tpName: "ટી.પી. સ્કીમ નં. ૫૮ (વાલોદ)", name: "ટી.પી. સ્કીમ નં. ૫૮ (વાલોદ)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૫૮ (વાલોદ)", status: "Active", displayOrder: 7, display_order: 7 },
    { id: 8, tpCode: "TP-47", code: "TP-47", tp_scheme_code: "TP-47", zoneName: "ખોલવડ-ભાડા", zone: "ખોલવડ-ભાડા", zone_name: "ખોલવડ-ભાડા", tpName: "ટી.પી. સ્કીમ નં. ૪૭ (ખોલવડ-ભાડા નો પાર્ટ)", name: "ટી.પી. સ્કીમ નં. ૪૭ (ખોલવડ-ભાડા નો પાર્ટ)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૪૭ (ખોલવડ-ભાડા નો પાર્ટ)", status: "Active", displayOrder: 8, display_order: 8 },
    { id: 9, tpCode: "TP-20", code: "TP-20", tp_scheme_code: "TP-20", zoneName: "નાના વરાછા-કાપોદ્રા", zone: "નાના વરાછા-કાપોદ્રા", zone_name: "નાના વરાછા-કાપોદ્રા", tpName: "ટી.પી. સ્કીમ નં. ૨૦ (નાના વરાછા-કાપોદ્રા)", name: "ટી.પી. સ્કીમ નં. ૨૦ (નાના વરાછા-કાપોદ્રા)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૨૦ (નાના વરાછા-કાપોદ્રા)", status: "Active", displayOrder: 9, display_order: 9 },
    { id: 10, tpCode: "TP-38", code: "TP-38", tp_scheme_code: "TP-38", zoneName: "નાના વરાછા", zone: "નાના વરાછા", zone_name: "નાના વરાછા", tpName: "ટી.પી. સ્કીમ નં. ૩૮ (નાના વરાછા)", name: "ટી.પી. સ્કીમ નં. ૩૮ (નાના વરાછા)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૩૮ (નાના વરાછા)", status: "Active", displayOrder: 10, display_order: 10 },
    { id: 11, tpCode: "TP-68", code: "TP-68", tp_scheme_code: "TP-68", zoneName: "પુણા-સીમાડા", zone: "પુણા-સીમાડા", zone_name: "પુણા-સીમાડા", tpName: "ટી.પી. સ્કીમ નં. ૬૮ (પુણા-સીમાડા)", name: "ટી.પી. સ્કીમ નં. ૬૮ (પુણા-સીમાડા)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૬૮ (પુણા-સીમાડા)", status: "Active", displayOrder: 11, display_order: 11 },
    { id: 12, tpCode: "TP-21", code: "TP-21", tp_scheme_code: "TP-21", zoneName: "સરથાણા-સીમાડા", zone: "સરથાણા-સીમાડા", zone_name: "સરથાણા-સીમાડા", tpName: "ટી.પી. સ્કીમ નં. ૨૧ (સરથાણા-સીમાડા)", name: "ટી.પી. સ્કીમ નં. ૨૧ (સરથાણા-સીમાડા)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૨૧ (સરથાણા-સીમાડા)", status: "Active", displayOrder: 12, display_order: 12 },
    { id: 13, tpCode: "TP-92", code: "TP-92", tp_scheme_code: "TP-92", zoneName: "સીમાડા-કોસમાડા", zone: "સીમાડા-કોસમાડા", zone_name: "સીમાડા-કોસમાડા", tpName: "ટી.પી. સ્કીમ નં. ૯૨ (સીમાડા-કોસમાડા)", name: "ટી.પી. સ્કીમ નં. ૯૨ (સીમાડા-કોસમાડા)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૯૨ (સીમાડા-કોસમાડા)", status: "Active", displayOrder: 13, display_order: 13 },
    { id: 14, tpCode: "TP-85", code: "TP-85", tp_scheme_code: "TP-85", zoneName: "સરથાણા-પાસોદરા", zone: "સરથાણા-પાસોદરા", zone_name: "સરથાણા-પાસોદરા", tpName: "ટી.પી. સ્કીમ નં. ૮૫ (સરથાણા-પાસોદરા)", name: "ટી.પી. સ્કીમ નં. ૮૫ (સરથાણા-પાસોદરા)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૮૫ (સરથાણા-પાસોદરા)", status: "Active", displayOrder: 14, display_order: 14 },
    { id: 15, tpCode: "TP-51", code: "TP-51", tp_scheme_code: "TP-51", zoneName: "કોસમાડા-સીમાડા", zone: "કોસમાડા-સીમાડા", zone_name: "કોસમાડા-સીમાડા", tpName: "ટી.પી. નં. ૫૧ (કોસમાડા-ખડસદ-પીલોદરા-સીમાડા) નો પાર્ટ", name: "ટી.પી. નં. ૫૧ (કોસમાડા-ખડસદ-પીલોદરા-સીમાડા) નો પાર્ટ", tp_scheme_name: "ટી.પી. નં. ૫૧ (કોસમાડા-ખડસદ-પીલોદરા-સીમાડા) નો પાર્ટ", status: "Active", displayOrder: 15, display_order: 15 },
    { id: 16, tpCode: "TP-84", code: "TP-84", tp_scheme_code: "TP-84", zoneName: "કોસાડ-ભરથાણા", zone: "કોસાડ-ભરથાણા", zone_name: "કોસાડ-ભરથાણા", tpName: "ટી.પી. સ્કીમ નં. ૮૪ (કોસાડ-ભરથાણા)", name: "ટી.પી. સ્કીમ નં. ૮૪ (કોસાડ-ભરથાણા)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૮૪ (કોસાડ-ભરથાણા)", status: "Active", displayOrder: 16, display_order: 16 },
    { id: 17, tpCode: "TP-94", code: "TP-94", tp_scheme_code: "TP-94", zoneName: "મોટા વરાછા", zone: "મોટા વરાછા", zone_name: "મોટા વરાછા", tpName: "ટી.પી. ૯૪ (મોટા વરાછા)", name: "ટી.પી. ૯૪ (મોટા વરાછા)", tp_scheme_name: "ટી.પી. ૯૪ (મોટા વરાછા)", status: "Active", displayOrder: 17, display_order: 17 },
    { id: 18, tpCode: "TP-89", code: "TP-89", tp_scheme_code: "TP-89", zoneName: "કોસાડ", zone: "કોસાડ", zone_name: "કોસાડ", tpName: "ટી.પી. સ્કીમ નં. ૮૯ (કોસાડ)", name: "ટી.પી. સ્કીમ નં. ૮૯ (કોસાડ)", tp_scheme_name: "ટી.પી. સ્કીમ નં. ૮૯ (કોસાડ)", status: "Active", displayOrder: 18, display_order: 18 }
  ]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(apiUrl('/api/hoardings'));
        if (response.ok) {
          const result = await response.json();
          const items = Array.isArray(result) ? result : result.data || [];
          setHoardings(items.map((item: any) => buildHoardingRecord(item)));
        }
      } catch (error) {
        console.error('Failed to load hoardings', error);
      }
    };

    loadData();
  }, []);

  // 1. Hoarding Handlers
  const handleAddHoarding = async (data: any): Promise<boolean> => {
    try {
      const response = await fetch(apiUrl('/api/hoardings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildHoardingRecord(data))
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      const created = buildHoardingRecord({ ...data, id: result.hoarding_id || Date.now() });
      setHoardings((prev) => [...prev, created]);
      return true;
    } catch (error) { return false; }
  };
  const handleEditHoarding = async (data: any): Promise<boolean> => {
    try {
      const response = await fetch(apiUrl(`/api/hoardings/${data.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildHoardingRecord(data))
      });

      if (!response.ok) {
        return false;
      }

      setHoardings((prev) => prev.map((item) => (item.id === data.id ? buildHoardingRecord(data) : item)));
      return true;
    } catch (error) { return false; }
  };
  const handleDeleteHoarding = async (id: number): Promise<boolean> => {
    try {
      setHoardings((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error) { return false; }
  };

  // 2. Agency Handlers (✅ હવે નવિ એજન્સી તુરંત ઉમેરાશે)
  const handleAddAgency = async (data: any): Promise<boolean> => {
    try {
      setAgencies((prev) => [...prev, { ...data, id: Date.now() }]);
      return true;
    } catch (error) { return false; }
  };
  const handleEditAgency = async (data: any): Promise<boolean> => {
    try {
      setAgencies((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      return true;
    } catch (error) { return false; }
  };
  const handleDeleteAgency = async (id: number): Promise<boolean> => {
    try {
      setAgencies((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error) { return false; }
  };

  // 3. Quarterly Payment Handlers
  const handleAddPayment = async (data: any): Promise<boolean> => {
    try {
      setQuarterlyPayments((prev) => [...prev, { ...data, id: Date.now() }]);
      return true;
    } catch (error) { return false; }
  };
  const handleEditPayment = async (data: any): Promise<boolean> => {
    try {
      setQuarterlyPayments((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      return true;
    } catch (error) { return false; }
  };
  const handleDeletePayment = async (id: number): Promise<boolean> => {
    try {
      setQuarterlyPayments((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error) { return false; }
  };

  // 4. Stability Certificate Handlers
  const handleAddStabilityCert = async (data: any): Promise<boolean> => {
    try {
      setStabilityCertificates((prev) => [...prev, { ...data, id: Date.now() }]);
      return true;
    } catch (error) { return false; }
  };
  const handleEditStabilityCert = async (data: any): Promise<boolean> => {
    try {
      setStabilityCertificates((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      return true;
    } catch (error) { return false; }
  };
  const handleDeleteStabilityCert = async (id: number): Promise<boolean> => {
    try {
      setStabilityCertificates((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error) { return false; }
  };

  // 5. TP Scheme Handlers (State Updates)
  const handleAddTPScheme = async (data: any): Promise<boolean> => {
    try {
      setTpSchemes((prev) => [...prev, { ...data, id: Date.now() }]);
      return true;
    } catch (error) { return false; }
  };

  const handleEditTPScheme = async (data: any): Promise<boolean> => {
    try {
      setTpSchemes((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      return true;
    } catch (error) { return false; }
  };

  const handleDeleteTPScheme = async (id: number): Promise<boolean> => {
    try {
      setTpSchemes((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error) { return false; }
  };

  const handleRestoreTPScheme = async (id: number): Promise<boolean> => {
    try { return true; } catch (error) { return false; }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-slate-800">
              SMC Hoarding Management System
            </h1>
          </div>
          
          {/* Nav Tabs */}
          <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveTab(0)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 0 ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ડેશબોર્ડ
            </button>

            <button
              onClick={() => setActiveTab(1)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 1 ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              એજન્સી માસ્ટર
            </button>

            <button
              onClick={() => setActiveTab(2)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 2 ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              હોર્ડિંગ માસ્ટર
            </button>

            <button
              onClick={() => setActiveTab(3)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 3 ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ત્રિમાસિક ચૂકવણી
            </button>

            <button
              onClick={() => setActiveTab(4)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 4 ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              બાકી ફી (Pending Fees)
            </button>

            <button
              onClick={() => setActiveTab(5)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 5 ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              સ્ટેબિલિટી સર્ટિફિકેટ
            </button>

            <button
              onClick={() => setActiveTab(6)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 6 ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              TP સ્કીમ માસ્ટર
            </button>

            <button
              onClick={() => setActiveTab(7)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 7 ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              વાર્ષિક માહિતી
            </button>
          </nav>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
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

        {activeTab === 1 && (
          <AgencyTab
            agencies={agencies}
            onAdd={handleAddAgency}
            onEdit={handleEditAgency}
            onDelete={handleDeleteAgency}
          />
        )}

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

        {activeTab === 4 && (
          <PendingTab
            hoardings={hoardings}
            quarterlyPayments={quarterlyPayments}
          />
        )}

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

        {activeTab === 6 && (
          <TPSchemeMasterTab
            tpSchemes={tpSchemes}
            onAdd={handleAddTPScheme}
            onEdit={handleEditTPScheme}
            onDelete={handleDeleteTPScheme}
            onRestore={handleRestoreTPScheme}
          />
        )}

        {activeTab === 7 && (
          <AnnualTab
            agencies={agencies}
            hoardings={hoardings}
            quarterlyPayments={quarterlyPayments}
          />
        )}
      </main>
    </div>
  );
}