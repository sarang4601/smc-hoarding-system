import React, { useMemo, useState } from "react";
import { Agency, Hoarding, QuarterlyPayment, StabilityCertificate, TPScheme } from "../types";
import {
  Users,
  Maximize,
  Coins,
  Receipt,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Building,
  AlertOctagon,
  FileText,
  X
} from "lucide-react";
import { daysUntil, getHoardingExpectedFeesInFY, getHoardingStatusInFY, getFinancialYearFromDate, getFYStartYear } from "../utils/export";
import { FINANCIAL_YEARS } from "./HoardingTab";

interface DashboardViewProps {
  agencies?: Agency[];
  hoardings?: Hoarding[];
  quarterlyPayments?: QuarterlyPayment[];
  stabilityCertificates?: StabilityCertificate[];
  tpSchemes?: TPScheme[];
  onNavigateToTab: (tabIndex: number) => void;
}

export default function DashboardView({
  agencies = [],
  hoardings = [],
  quarterlyPayments = [],
  stabilityCertificates = [],
  tpSchemes = [],
  onNavigateToTab
}: DashboardViewProps) {
  
  const [selectedFY, setSelectedFY] = useState("2025-26");

  // Filter hoardings that are visible during selectedFY (not Hidden)
  const activeHoardingsInFY = useMemo(() => {
    return (hoardings || []).filter((h) => getHoardingStatusInFY(h, selectedFY) !== "Hidden");
  }, [hoardings, selectedFY]);

  // Filter stability certificates where the hoarding is active in this FY
  const activeCertificatesInFY = useMemo(() => {
    return (stabilityCertificates || []).filter((c) => {
      const hoarding = (hoardings || []).find((h) => h.agency_name === c.agency_name && h.hoarding_location === c.hoarding_location);
      if (!hoarding) return true; // Show if hoarding matching not found
      return getHoardingStatusInFY(hoarding, selectedFY) !== "Hidden";
    });
  }, [stabilityCertificates, hoardings, selectedFY]);

  // Calculate alert items expiring in selectedFY or already expired
  const alerts = useMemo(() => {
    return activeCertificatesInFY
      .filter((c) => {
        const days = daysUntil(c.valid_till_date);
        const expFY = getFinancialYearFromDate(c.valid_till_date);
        const expStart = getFYStartYear(expFY);
        const selStart = getFYStartYear(selectedFY);

        if (expStart < selStart) {
          // Already expired in a previous year
          return true;
        } else if (expStart === selStart) {
          // Expires in the selected year
          return days <= 45;
        }
        return false;
      })
      .map((c) => {
        const days = daysUntil(c.valid_till_date);
        const isExpired = days < 0;
        return {
          id: c.id,
          agency: c.agency_name,
          location: c.hoarding_location,
          certificate_number: c.certificate_number,
          daysLeft: days,
          isExpired
        };
      });
  }, [activeCertificatesInFY, selectedFY]);

  // Real-time calculation of statistics for selected Financial Year
  const stats = useMemo(() => {
    const totalAgencies = (agencies || []).length;
    
    // activeHoardingsInFY contains all visible hoardings in this FY (not Hidden)
    const activeHoardings = activeHoardingsInFY.filter((h) => getHoardingStatusInFY(h, selectedFY) === "Active");
    const cancelledHoardings = activeHoardingsInFY.filter((h) => getHoardingStatusInFY(h, selectedFY) === "Cancelled");
    
    const totalActiveHoardings = activeHoardings.length;
    const totalCancelledHoardings = cancelledHoardings.length;
    
    // Total Expected Annual & Quarterly License Fees in selectedFY
    const totalAnnualLicenseFee = activeHoardingsInFY.reduce((sum, h) => sum + getHoardingExpectedFeesInFY(h, selectedFY).annual, 0);
    const totalQuarterlyLicenseFee = activeHoardingsInFY.reduce((sum, h) => sum + getHoardingExpectedFeesInFY(h, selectedFY).quarterly, 0);
    
    // Total Paid Amount belonging to selectedFY (Grand totals of recorded receipts)
    const paymentsInFY = (quarterlyPayments || []).filter((p) => p.financial_year === selectedFY);
    const totalPaidAmount = paymentsInFY.reduce((sum, p) => sum + p.grand_total, 0);
    
    // Pending Amount (Expected Annual minus actual license fee paid in selectedFY)
    const totalLicenseFeePaid = paymentsInFY.reduce((sum, p) => sum + p.license_fee, 0);
    const pendingAmount = Math.max(totalAnnualLicenseFee - totalLicenseFeePaid, 0);
    
    // Expiring certificates count for selectedFY
    const expiringCertificatesCount = alerts.length;
    
    return {
      totalAgencies,
      totalActiveHoardings,
      totalCancelledHoardings,
      totalAnnualLicenseFee,
      totalQuarterlyLicenseFee,
      totalPaidAmount,
      pendingAmount,
      expiringCertificatesCount
    };
  }, [agencies, activeHoardingsInFY, quarterlyPayments, selectedFY, alerts]);

  const schemeStats = useMemo(() => {
    const activeSchemes = (tpSchemes || []).filter((scheme) => !scheme.deleted_at || scheme.deleted_at === "");
    const schemeTotals = activeSchemes.map((scheme) => {
      const schemeHoardings = activeHoardingsInFY.filter((h) => h.tp_scheme_id === scheme.id);
      return {
        scheme,
        hoardingCount: schemeHoardings.length
      };
    });

    return {
      totalTPSchemes: activeSchemes.length,
      topHoardingSchemes: schemeTotals
        .sort((a, b) => b.hoardingCount - a.hoardingCount)
        .slice(0, 3)
    };
  }, [tpSchemes, activeHoardingsInFY]);

  // Current formatted date and time for government readout
  const todayDateGu = new Date().toLocaleDateString("gu-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const todayDateEn = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-lg shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">નવા પૂર્વ (સરથાણા) ઝોન - ઓફિસ ડેશબોર્ડ</h1>
          <p className="text-slate-300 text-xs mt-1">સુરત મહાનગરપાલિકા હોર્ડિંગ પરમિશન, ફી અને સ્ટેબિલિટી સર્ટિફિકેટ મોનિટરિંગ કંટ્રોલ</p>
          <p className="text-[10px] font-mono text-orange-400 mt-0.5">SMC New East (Sarthana) Zone - Hoarding Control Room</p>
        </div>

        <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-orange-500" />
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-300">{todayDateGu}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{todayDateEn}</p>
          </div>
        </div>
      </div>

      {/* Financial Year Filter Bar */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs no-print-area">
        <div>
          <h2 className="text-sm font-extrabold text-orange-950 flex items-center gap-1.5">
            📊 નાણાકીય વર્ષ ફિલ્ટર / Financial Year Dashboard Filter
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            પસંદ કરેલ વર્ષના આધારે તમામ હોર્ડિંગ આંકડા, બાકી રકમ, અને સ્ટેબિલિટી એલર્ટ્સ દર્શાવવામાં આવે છે.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-orange-950 whitespace-nowrap">વર્ષ પસંદ કરો / Select FY:</span>
          <select
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-sm cursor-pointer"
          >
            {FINANCIAL_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stability Certificates Alerts Banners Section */}
      {alerts.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-red-700 bg-red-50 p-2.5 rounded border border-red-200">
            <AlertOctagon className="h-5 w-5 animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">
              સ્ટેબિલિટી પ્રમાણપત્ર ચેતવણીઓ / Stability Certificate Warnings ({alerts.length} Active Alerts)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border flex items-start gap-3 shadow-xs ${
                  alert.isExpired
                    ? "bg-red-100/60 border-red-300 text-red-950"
                    : "bg-amber-50 border-amber-300 text-amber-950"
                }`}
              >
                <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${alert.isExpired ? "text-red-700" : "text-amber-700"}`} />
                <div className="text-xs">
                  <p className="font-bold">
                    {alert.isExpired ? "🔴 પ્રમાણપત્ર મુદત પૂરી થઈ ગઈ છે!" : "⚠️ પ્રમાણપત્ર ટૂંક સમયમાં પૂરું થશે!"}
                  </p>
                  <p className="mt-1">
                    એજન્સી <strong>{alert.agency}</strong> નું સ્ટેબિલિટી સર્ટિફિકેટ (નં: <code>{alert.certificate_number}</code>){" "}
                    {alert.isExpired ? (
                      <span className="font-black underline text-red-700">મુદત બહાર (Expired)</span>
                    ) : (
                      <><strong>{alert.daysLeft} દિવસમાં</strong> પૂર્ણ થશે</>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-xs truncate">લોકેશન: {alert.location}</p>
                </div>
              </div>
            ))}
          </div>
          {alerts.length > 4 && (
            <button 
              onClick={() => onNavigateToTab(5)}
              className="text-xs font-bold text-red-700 hover:underline cursor-pointer"
            >
              તમામ {alerts.length} ચેતવણીઓ જુઓ...
            </button>
          )}
        </div>
      )}

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Agencies */}
        <div 
          onClick={() => onNavigateToTab(1)}
          className="bg-white p-4 rounded-lg shadow-xs border border-slate-200 flex items-center justify-between cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
        >
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">કુલ એજન્સી / Agencies</span>
            <span className="text-2xl font-black text-slate-800 font-mono mt-1 block group-hover:text-orange-600 transition-colors">
              {stats.totalAgencies}
            </span>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* TP Schemes */}
        <div 
          onClick={() => onNavigateToTab(1)}
          className="bg-white p-4 rounded-lg shadow-xs border border-slate-200 flex items-center justify-between cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
        >
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">કુલ TP યોજના / Total TP Schemes</span>
            <span className="text-2xl font-black text-slate-800 font-mono mt-1 block group-hover:text-orange-600 transition-colors">
              {schemeStats.totalTPSchemes}
            </span>
          </div>
          <div className="p-3 bg-sky-50 rounded-lg text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all">
            <Building className="h-6 w-6" />
          </div>
        </div>

        {/* Active Hoardings */}
        <div 
          onClick={() => onNavigateToTab(2)}
          className="bg-white p-4 rounded-lg shadow-xs border border-slate-200 flex items-center justify-between cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
        >
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">સક્રિય હોર્ડિંગ્સ / Active Hoardings ({selectedFY})</span>
            <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
              {stats.totalActiveHoardings}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <Maximize className="h-6 w-6" />
          </div>
        </div>

        {/* Cancelled Hoardings */}
        <div 
          onClick={() => onNavigateToTab(2)}
          className="bg-white p-4 rounded-lg shadow-xs border border-slate-200 flex items-center justify-between cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
        >
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">રદ કરેલ હોર્ડિંગ્સ / Cancelled Hoardings ({selectedFY})</span>
            <span className="text-2xl font-black text-rose-700 font-mono mt-1 block">
              {stats.totalCancelledHoardings}
            </span>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
            <X className="h-6 w-6" />
          </div>
        </div>

        {/* Expected Annual Fees */}
        <div 
          onClick={() => onNavigateToTab(4)}
          className="bg-white p-4 rounded-lg shadow-xs border border-slate-200 flex items-center justify-between cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
        >
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">વાર્ષિક અપેક્ષિત ફી / Expected Annual ({selectedFY})</span>
            <span className="text-lg font-black text-slate-800 font-mono mt-1 block text-amber-700">
              ₹ {stats.totalAnnualLicenseFee.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Coins className="h-6 w-6" />
          </div>
        </div>

        {/* Expected Quarterly Fees */}
        <div 
          onClick={() => onNavigateToTab(3)}
          className="bg-white p-4 rounded-lg shadow-xs border border-slate-200 flex items-center justify-between cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
        >
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">ત્રિમાસિક અપેક્ષિત / Expected Quarterly ({selectedFY})</span>
            <span className="text-lg font-black text-slate-800 font-mono mt-1 block text-emerald-700">
              ₹ {stats.totalQuarterlyLicenseFee.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <Receipt className="h-6 w-6" />
          </div>
        </div>

        {/* Total Paid / Received */}
        <div 
          onClick={() => onNavigateToTab(3)}
          className="bg-white p-4 rounded-lg shadow-xs border border-slate-200 flex items-center justify-between cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
        >
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">કુલ વસૂલાયેલ રકમ / Received Amount ({selectedFY})</span>
            <span className="text-lg font-black text-emerald-700 font-mono mt-1 block">
              ₹ {stats.totalPaidAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Pending Amount */}
        <div 
          onClick={() => onNavigateToTab(4)}
          className="bg-white p-4 rounded-lg shadow-xs border border-slate-200 flex items-center justify-between cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
        >
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">કુલ બાકી લાયસન્સ ફી / Outstanding ({selectedFY})</span>
            <span className={`text-lg font-black font-mono mt-1 block ${stats.pendingAmount > 0 ? "text-red-600 animate-pulse" : "text-slate-700"}`}>
              ₹ {stats.pendingAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Expiring Certs count */}
        <div 
          onClick={() => onNavigateToTab(5)}
          className="bg-white p-4 rounded-lg shadow-xs border border-slate-200 flex items-center justify-between cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
        >
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">સ્ટેબિલિટી એલર્ટ / Expiry Warning ({selectedFY})</span>
            <span className={`text-2xl font-black font-mono mt-1 block ${stats.expiringCertificatesCount > 0 ? "text-red-600" : "text-green-600"}`}>
              {stats.expiringCertificatesCount}
            </span>
          </div>
          <div className={`p-3 rounded-lg ${stats.expiringCertificatesCount > 0 ? "bg-red-100 text-red-700" : "bg-green-50 text-green-700"}`}>
            <AlertOctagon className="h-6 w-6" />
          </div>
        </div>

        {/* Current Date Card */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg shadow-xs border border-orange-200 flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-orange-950">ચાલુ ઝોન / Current Zone</span>
            <span className="text-sm font-bold text-orange-950 mt-1 block">
              નવા પૂર્વ (સરથાણા)
            </span>
            <span className="text-[10px] text-slate-500 font-medium font-mono mt-0.5">SMC New East Zone</span>
          </div>
          <div className="p-3 bg-orange-100 text-orange-700 rounded-lg">
            <Building className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Beautiful Information Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Help / Guideline instructions */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b pb-2">
            <FileText className="h-4.5 w-4.5 text-orange-600" /> મ્યુનિસિપલ હોર્ડિંગ્સ માર્ગદર્શિકા / Operating Guidelines
          </h2>
          
          <div className="space-y-3.5 text-xs text-slate-600">
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">૧. એજન્સી અને હોર્ડિંગ્સ લિંકિંગ:</p>
              <p>કોઈપણ હોર્ડિંગ ઉમેરતા પહેલા એજન્સી ટેબમાં જઈ એજન્સી રજીસ્ટર કરો. હોર્ડિંગ ફોર્મમાં રજીસ્ટર્ડ એજન્સીઓ જ ડ્રોપડાઉન વિકલ્પમાં જોવા મળશે.</p>
            </div>
            
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">૨. ઓટો ગણતરી સિદ્ધાંતો:</p>
              <p>હમેશા વાર્ષિક અને ત્રિમાસિક ફીની રકમ માટે <strong>ROUNDUP</strong> (નજીકનો મોટો પૂર્ણાંક) ગણતરી લાગુ પડશે. GST (SGST 9%, CGST 9%) માં પણ આ નિયમ ફરજિયાત છે.</p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-800">૩. સ્ટેબિલિટી પ્રમાણપત્ર અને સુરક્ષા:</p>
              <p>કોઈપણ અકસ્માત ટાળવા હોર્ડિંગ પ્રમાણપત્ર સમયસર રીન્યુ કરાવો. ૪૫ દિવસ કે તેથી ઓછો સમય હશે તો સર્ટિફિકેટ લાલ કલરમાં પ્રદર્શિત થશે.</p>
            </div>
          </div>
        </div>

        {/* Cancelled Hoardings (Financial Year-wise) */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b pb-2">
            <X className="h-4.5 w-4.5 text-red-600 font-bold" /> રદ થયેલ હોર્ડિંગ્સ (વર્ષ-વાઇઝ) / Cancelled Hoardings
          </h2>
          
          <div className="space-y-2 text-xs">
            {FINANCIAL_YEARS.slice(0, 8).map((fy) => {
              const count = (hoardings || []).filter(h => h.status === "Cancelled" && h.cancellation_financial_year === fy).length;
              return (
                <div key={fy} className="flex justify-between items-center pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                  <span className="text-slate-500 font-mono font-semibold">{fy}</span>
                  <span className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${count > 0 ? "bg-red-50 text-red-700 border border-red-100" : "bg-slate-50 text-slate-400"}`}>
                    {count} {count > 0 ? "રદ (Cancelled)" : "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Database Status Summary */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b pb-2">ડેટાબેઝ સ્ટેટસ / Database Integrity</h2>
          
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500">એજન્સી રેકોર્ડ્સ (Agencies)</span>
              <span className="font-bold font-mono text-slate-800">{(agencies || []).length}</span>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500">સક્રિય હોર્ડિંગ્સ (Active Hoardings)</span>
              <span className="font-bold font-mono text-emerald-700">
                {(hoardings || []).filter(h => getHoardingStatusInFY(h, selectedFY) === "Active").length}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500">રદ થયેલ હોર્ડિંગ્સ (Cancelled Hoardings)</span>
              <span className="font-bold font-mono text-rose-700">
                {(hoardings || []).filter(h => getHoardingStatusInFY(h, selectedFY) === "Cancelled").length}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500">ભરેલી પેમેન્ટ રસીદો (Receipts)</span>
              <span className="font-bold font-mono text-slate-800">{(quarterlyPayments || []).length}</span>
            </div>

            <div className="flex justify-between items-center pb-1">
              <span className="text-slate-500">નોંધાયેલ સર્ટિફિકેટ્સ (Certificates)</span>
              <span className="font-bold font-mono text-slate-800">{(stabilityCertificates || []).length}</span>
            </div>

            <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-200 mt-2">
              <p className="text-[10px] font-semibold text-orange-950 uppercase tracking-wider">ઝોનલ કચેરી માહિતી / Zone Office Info:</p>
              <p className="text-[11px] text-orange-950 font-bold mt-1">સુરત મહાનગરપાલિકા (New East Zone)</p>
              <p className="text-[10px] text-slate-600 font-mono mt-0.5">સુરત, ગુજરાત (SMC Surat)</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}