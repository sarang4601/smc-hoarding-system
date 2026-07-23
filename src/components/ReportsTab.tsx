import React, { useState, useMemo } from "react";
import { Agency, Hoarding, QuarterlyPayment, StabilityCertificate, TPScheme } from "../types";
import { Search, Printer, Download, FileSpreadsheet, AlertTriangle, ShieldCheck, FileCheck, Coins } from "lucide-react";
import { exportToCSV, daysUntil, isExpiringSoon, getHoardingStatusInFY, getHoardingExpectedFeesInFY, getQuarterOptionsForFY, getFinancialYearFromDate, getFYStartYear, formatDateToDDMMYYYY, formatDateToYYYYMMDD } from "../utils/export";
import { FINANCIAL_YEARS } from "./HoardingTab";

interface ReportsTabProps {
  agencies: Agency[];
  hoardings: Hoarding[];
  quarterlyPayments: QuarterlyPayment[];
  stabilityCertificates: StabilityCertificate[];
  tpSchemes: TPScheme[];
}

type ReportType =
  | "agency"
  | "location"
  | "quarter"
  | "annual"
  | "pending"
  | "paid"
  | "expired_stability"
  | "expiring_45_stability"
  | "gst"
  | "audit";

export default function ReportsTab({
  agencies,
  hoardings,
  quarterlyPayments,
  stabilityCertificates,
  tpSchemes
}: ReportsTabProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>("agency");
  const [searchTerm, setSearchTerm] = useState("");

  // Report Specific Filter States
  const [selectedFY, setSelectedFY] = useState("2025-26");
  const [filterAgency, setFilterAgency] = useState("");
  const [filterQuarter, setFilterQuarter] = useState("");

  // Government Audit Report Specific Filters
  const [auditAgency, setAuditAgency] = useState("");
  const [auditTPNumber, setAuditTPNumber] = useState("");
  const [auditPlotNo, setAuditPlotNo] = useState("");
  const [auditHoardingType, setAuditHoardingType] = useState("");
  const [auditSchemeId, setAuditSchemeId] = useState<number | "">("");
  const [auditStatus, setAuditStatus] = useState(""); // "" means All, or "Active", "Cancelled"
  const [auditCancellationDate, setAuditCancellationDate] = useState("");

  const quarterOptions = useMemo(() => {
    return getQuarterOptionsForFY(selectedFY);
  }, [selectedFY]);

  // Reports Computations

  // 1. Agency Wise Report: list of hoardings and payments for a specific agency
  const agencyReportData = useMemo(() => {
    const agencyName = filterAgency || (agencies[0]?.agency_name || "");
    const agencyHoardings = hoardings.filter((h) => h.agency_name === agencyName && getHoardingStatusInFY(h, selectedFY) !== "Hidden");
    const agencyPayments = quarterlyPayments.filter((p) => p.agency_name === agencyName && p.financial_year === selectedFY);
    return {
      agencyName,
      hoardings: agencyHoardings,
      payments: agencyPayments,
      totalAnnualFee: agencyHoardings.reduce((sum, h) => sum + getHoardingExpectedFeesInFY(h, selectedFY).annual, 0),
      totalPaidFee: agencyPayments.reduce((sum, p) => sum + p.license_fee, 0),
      totalGrandPaid: agencyPayments.reduce((sum, p) => sum + p.grand_total, 0)
    };
  }, [filterAgency, agencies, hoardings, quarterlyPayments, selectedFY]);

  // 2. Location Wise Report: hoardings grouped or filtered by location
  const locationReportData = useMemo(() => {
    return hoardings.filter((h) => {
      const matchesSearch = h.hoarding_location.toLowerCase().includes(searchTerm.toLowerCase());
      const visible = getHoardingStatusInFY(h, selectedFY) !== "Hidden";
      return matchesSearch && visible;
    });
  }, [hoardings, searchTerm, selectedFY]);

  // 3. Quarter Wise Report: payments filtered by quarter and financial year
  const quarterReportData = useMemo(() => {
    const targetQuarter = filterQuarter || quarterOptions[0]; // Default to Q1 of selected FY
    const paymentsInQuarter = quarterlyPayments.filter((p) => p.quarter === targetQuarter && p.financial_year === selectedFY);
    return {
      quarter: targetQuarter,
      payments: paymentsInQuarter,
      totalFees: paymentsInQuarter.reduce((sum, p) => sum + p.license_fee, 0),
      totalInterest: paymentsInQuarter.reduce((sum, p) => sum + p.interest, 0),
      totalSGST: paymentsInQuarter.reduce((sum, p) => sum + p.sgst, 0),
      totalCGST: paymentsInQuarter.reduce((sum, p) => sum + p.cgst, 0),
      totalGrand: paymentsInQuarter.reduce((sum, p) => sum + p.grand_total, 0)
    };
  }, [filterQuarter, quarterOptions, quarterlyPayments, selectedFY]);

  // 4. Pending License Fee Report: list of agencies with outstanding payments
  const pendingReportData = useMemo(() => {
    return agencies.map((a) => {
      const agencyVisibleHoardings = hoardings.filter((h) => h.agency_name === a.agency_name && getHoardingStatusInFY(h, selectedFY) !== "Hidden");
      if (agencyVisibleHoardings.length === 0) return null;

      const expectedAnnual = agencyVisibleHoardings.reduce((sum, h) => sum + getHoardingExpectedFeesInFY(h, selectedFY).annual, 0);

      const agencyPayments = quarterlyPayments.filter((p) => p.agency_name === a.agency_name && p.financial_year === selectedFY);
      const totalPaidLicenseFee = agencyPayments.reduce((sum, p) => sum + p.license_fee, 0);

      const pending = Math.max(expectedAnnual - totalPaidLicenseFee, 0);

      return {
        agency_name: a.agency_name,
        gst_number: a.gst_number,
        hoarding_count: agencyVisibleHoardings.filter(h => getHoardingStatusInFY(h, selectedFY) === "Active").length,
        expected: expectedAnnual,
        paid: totalPaidLicenseFee,
        pending: pending
      };
    }).filter((row): row is NonNullable<typeof row> => row !== null && row.pending > 0);
  }, [agencies, hoardings, quarterlyPayments, selectedFY]);

  // 5. Expired Stability Certificate Report
  const expiredCertificates = useMemo(() => {
    return stabilityCertificates.filter((c) => {
      const days = daysUntil(c.valid_till_date);
      if (days >= 0) return false;

      // Ensure the hoarding is visible in selectedFY
      const hoarding = hoardings.find((h) => h.agency_name === c.agency_name && h.hoarding_location === c.hoarding_location);
      if (!hoarding) return true;
      return getHoardingStatusInFY(hoarding, selectedFY) !== "Hidden";
    });
  }, [stabilityCertificates, hoardings, selectedFY]);

  // 6. Stability Certificate Expiring within 45 days
  const expiringCertificates45 = useMemo(() => {
    return stabilityCertificates.filter((c) => {
      const days = daysUntil(c.valid_till_date);
      const isExpiring = days >= 0 && days <= 45;
      if (!isExpiring) return false;

      // Ensure the hoarding is visible in selectedFY
      const hoarding = hoardings.find((h) => h.agency_name === c.agency_name && h.hoarding_location === c.hoarding_location);
      if (!hoarding) return true;
      return getHoardingStatusInFY(hoarding, selectedFY) !== "Hidden";
    });
  }, [stabilityCertificates, hoardings, selectedFY]);

  // 7. GST Report: quarterly payments details
  const gstReportData = useMemo(() => {
    return quarterlyPayments.filter((p) => {
      if (p.financial_year !== selectedFY) return false;
      const s = searchTerm.toLowerCase();
      return p.agency_name.toLowerCase().includes(s) || p.quarter.toLowerCase().includes(s);
    });
  }, [quarterlyPayments, searchTerm, selectedFY]);

  // 8. Government Audit Report: list of both active & cancelled hoardings with extensive filters
  const auditReportData = useMemo(() => {
    return hoardings
      .map((h) => {
        const regFY = h.financial_year || (h.permission_date ? getFinancialYearFromDate(h.permission_date) : "");
        const regStart = getFYStartYear(regFY);
        const targetStart = getFYStartYear(selectedFY);

        let statusInFY: "Active" | "Cancelled" | "Hidden" = "Active";

        if (targetStart < regStart) {
          statusInFY = "Hidden";
        } else if (h.status === "Cancelled" && h.cancellation_date) {
          const cancelFY = h.cancellation_financial_year || getFinancialYearFromDate(h.cancellation_date);
          const cancelStart = getFYStartYear(cancelFY);
          if (targetStart === cancelStart) {
            statusInFY = "Cancelled";
          } else if (targetStart > cancelStart) {
            statusInFY = "Cancelled"; // Keep visible for historical audit
          }
        }

        return {
          ...h,
          statusInFY
        };
      })
      .filter((h) => {
        if (h.statusInFY === "Hidden") return false;

        if (auditAgency && h.agency_name !== auditAgency) return false;
        if (auditSchemeId && h.tp_scheme_id !== Number(auditSchemeId)) return false;
        if (auditTPNumber && !h.tp_number.toLowerCase().includes(auditTPNumber.toLowerCase())) return false;
        if (auditPlotNo && !h.final_plot_no.toLowerCase().includes(auditPlotNo.toLowerCase())) return false;
        if (auditHoardingType && h.hoarding_type !== auditHoardingType) return false;
        if (auditStatus && h.statusInFY !== auditStatus) return false;
        if (auditCancellationDate) {
          if (!h.cancellation_date) return false;
          const formattedFilterDate = formatDateToDDMMYYYY(auditCancellationDate);
          if (h.cancellation_date !== formattedFilterDate && h.cancellation_date !== auditCancellationDate) {
            return false;
          }
        }

        return true;
      });
  }, [hoardings, selectedFY, auditAgency, auditTPNumber, auditPlotNo, auditHoardingType, auditStatus, auditCancellationDate]);

  // EXPORTERS
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    switch (selectedReport) {
      case "agency":
        exportToCSV(
          agencyReportData.hoardings,
          ["TP Number", "Final Plot / RS No", "Hoarding Type", "Financial Year", "Location", "Annual License Fee (₹)", "Quarterly Fee (₹)"],
          ["tp_number", "final_plot_no", "hoarding_type", "financial_year", "hoarding_location", "annual_license_fee", "quarterly_license_fee"],
          `SMC_NZ_Agency_Wise_Hoardings_${agencyReportData.agencyName}`
        );
        break;
      case "location":
        exportToCSV(
          locationReportData,
          ["Agency Name", "TP Number", "Final Plot / RS No", "Hoarding Type", "Financial Year", "Location", "Area (sq.m)", "Annual Fee (₹)"],
          ["agency_name", "tp_number", "final_plot_no", "hoarding_type", "financial_year", "hoarding_location", "area", "annual_license_fee"],
          "SMC_NZ_Location_Wise_Report"
        );
        break;
      case "quarter":
        exportToCSV(
          quarterReportData.payments,
          ["Receipt Number", "Agency Name", "Receipt Date", "License Fee (₹)", "Interest (₹)", "Grand Total (₹)"],
          ["receipt_number", "agency_name", "receipt_date", "license_fee", "interest", "grand_total"],
          `SMC_NZ_Quarter_Wise_${quarterReportData.quarter}`
        );
        break;
      case "pending":
        exportToCSV(
          pendingReportData,
          ["Agency Name", "GST Number", "Active Hoardings", "Expected Fee (₹)", "Total Paid (₹)", "Total Pending (₹)"],
          ["agency_name", "gst_number", "hoarding_count", "expected", "paid", "pending"],
          "SMC_NZ_Pending_Dues_Report"
        );
        break;
      case "expired_stability":
        exportToCSV(
          expiredCertificates,
          ["Certificate No", "Agency Name", "Location", "Valid Till", "Engineer Name", "Mobile Number"],
          ["certificate_number", "agency_name", "hoarding_location", "valid_till_date", "engineer_name", "engineer_mobile_number"],
          "SMC_NZ_Expired_Stability_Certificates"
        );
        break;
      case "expiring_45_stability":
        exportToCSV(
          expiringCertificates45,
          ["Certificate No", "Agency Name", "Location", "Valid Till", "Engineer Name", "Mobile Number"],
          ["certificate_number", "agency_name", "hoarding_location", "valid_till_date", "engineer_name", "engineer_mobile_number"],
          "SMC_NZ_Certificates_Expiring_Within_45_Days"
        );
        break;
      case "gst":
        exportToCSV(
          gstReportData,
          ["Receipt Number", "Agency Name", "Quarter", "License Fee (₹)", "Interest (₹)", "SGST 9% (₹)", "CGST 9% (₹)", "Grand Total (₹)"],
          ["receipt_number", "agency_name", "quarter", "license_fee", "interest", "sgst", "cgst", "grand_total"],
          "SMC_NZ_GST_Register_Report"
        );
        break;
      case "audit":
        exportToCSV(
          auditReportData,
          ["Agency Name", "TP Number", "Final Plot / RS No", "Hoarding Type", "Location", "Area (sq.m)", "Status", "Cancellation Date", "Cancellation Financial Year", "Cancellation Reason", "Annual License Fee (₹)", "Quarterly Fee (₹)"],
          ["agency_name", "tp_number", "final_plot_no", "hoarding_type", "hoarding_location", "area", "statusInFY", "cancellation_date", "cancellation_financial_year", "cancellation_reason", "annual_license_fee", "quarterly_license_fee"],
          `SMC_Government_Audit_Report_${selectedFY}`
        );
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Report Switcher Panel - No Print Area */}
      <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs no-print-area">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1">
          <FileSpreadsheet className="h-4.5 w-4.5 text-orange-600" /> સરકારી ઓડિટ અહેવાલ ફિલ્ટર / Select Government Report
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {[
            { id: "audit", label: "સરકારી ઓડિટ અહેવાલ / Government Audit" },
            { id: "agency", label: "એજન્સી વાઈઝ અહેવાલ / Agency Wise" },
            { id: "location", label: "લોકેશન વાઈઝ અહેવાલ / Location Wise" },
            { id: "quarter", label: "ત્રિમાસિક અહેવાલ / Quarter Wise" },
            { id: "pending", label: "બાકી રકમ અહેવાલ / Pending Fees" },
            { id: "expired_stability", label: "Expired સર્ટિફિકેટ / Expired Stability" },
            { id: "expiring_45_stability", label: "૪૫ દિવસ સ્ટેબિલિટી / Expiring 45 Days" },
            { id: "gst", label: "GST ટેક્સ અહેવાલ / GST Report" }
          ].map((report) => (
            <button
              key={report.id}
              onClick={() => {
                setSelectedReport(report.id as ReportType);
                setSearchTerm("");
              }}
              className={`p-2 rounded text-left text-xs font-semibold border transition-all cursor-pointer ${
                selectedReport === report.id
                  ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {report.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Filter Controls Panel based on chosen report - No Print */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-4 no-print-area">
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">નાણાકીય વર્ષ (FY):</span>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="bg-orange-50 text-orange-950 font-bold border border-orange-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
            >
              {FINANCIAL_YEARS.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </div>
          
          {selectedReport === "agency" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">એજન્સી:</span>
              <select
                value={filterAgency}
                onChange={(e) => setFilterAgency(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
              >
                {agencies.map((a) => (
                  <option key={a.id} value={a.agency_name}>
                    {a.agency_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedReport === "quarter" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">ક્વાર્ટર:</span>
              <select
                value={filterQuarter}
                onChange={(e) => setFilterQuarter(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
              >
                {quarterOptions.map((q, idx) => (
                  <option key={idx} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          )}

          {["location", "gst"].includes(selectedReport) && (
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="અહેવાલ ફિલ્ટર શોધો (Search inside report)..."
                className="bg-white border border-slate-300 rounded px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 w-60"
              />
            </div>
          )}

          {selectedReport === "audit" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-2 w-full border-t border-slate-200 pt-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">એજન્સી / Agency Name</label>
                <select
                  value={auditAgency}
                  onChange={(e) => setAuditAgency(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                >
                  <option value="">બધી એજન્સી (All)</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.agency_name}>
                      {a.agency_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">TP Number</label>
                <input
                  type="text"
                  value={auditTPNumber}
                  onChange={(e) => setAuditTPNumber(e.target.value)}
                  placeholder="TP Number થી ફિલ્ટર"
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">TP Scheme</label>
                <select
                  value={auditSchemeId}
                  onChange={(e) => setAuditSchemeId(e.target.value ? Number(e.target.value) : "")}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">બધી યોજના (All Schemes)</option>
                  {tpSchemes.map((scheme) => (
                    <option key={scheme.id} value={scheme.id}>
                      {scheme.tp_scheme_code} - {scheme.tp_scheme_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Final Plot / RS No</label>
                <input
                  type="text"
                  value={auditPlotNo}
                  onChange={(e) => setAuditPlotNo(e.target.value)}
                  placeholder="FP/RS No થી ફિલ્ટર"
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">હોર્ડિંગ પ્રકાર / Hoarding Type</label>
                <select
                  value={auditHoardingType}
                  onChange={(e) => setAuditHoardingType(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold"
                >
                  <option value="">બધા પ્રકાર (All)</option>
                  <option value="Single Sided">Single Sided</option>
                  <option value="Double Sided">Double Sided</option>
                  <option value="Kiosk">Kiosk</option>
                  <option value="LED Display">LED Display</option>
                  <option value="Unipole">Unipole</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">સ્થિતિ / Status</label>
                <select
                  value={auditStatus}
                  onChange={(e) => setAuditStatus(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold"
                >
                  <option value="">બધા (All Status)</option>
                  <option value="Active">Active (સક્રિય)</option>
                  <option value="Cancelled">Cancelled (રદ થયેલ)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">રદ તારીખ / Cancellation Date</label>
                <input
                  type="date"
                  value={auditCancellationDate}
                  onChange={(e) => setAuditCancellationDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>
            </div>
          )}

        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Download className="h-4 w-4" /> Excel ડાઉનલોડ
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Printer className="h-4 w-4" /> પ્રિન્ટ અહેવાલ (Print Report)
          </button>
        </div>
      </div>

      {/* Main Reports Display Container */}
      <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-xs print-area">
        
        {/* Government Letterhead style Header */}
        <div className="text-center border-b-2 border-slate-800 pb-5 mb-6">
          <h1 className="text-2xl font-black uppercase text-slate-900 tracking-wide">સુરત મહાનગરપાલિકા - Surat Municipal Corporation</h1>
          <h2 className="text-sm font-extrabold text-slate-700 mt-1">નવા પૂર્વ (સરથાણા) ઝોન કચેરી - New East (Sarthana) Zone Office</h2>
          <p className="text-[11px] font-bold text-orange-600 mt-1 uppercase tracking-widest font-mono">હોર્ડિંગ લાયસન્સિંગ અને રેવન્યુ ઓડિટ શાખા / HOARDING LICENSING AUDIT BRANCH</p>
          <p className="text-xs text-slate-500 mt-2">રિપોર્ટ: <strong className="text-slate-800 underline uppercase">{selectedReport.replace("_", " ")} REPORT</strong> | તારીખ: {new Date().toLocaleDateString("gu-IN")} | સમય: {new Date().toLocaleTimeString("gu-IN")}</p>
        </div>

        {/* 0. GOVERNMENT AUDIT REPORT LAYOUT */}
        {selectedReport === "audit" && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-500">નાણાકીય વર્ષ / Financial Year</span>
                <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{selectedFY}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-500">કુલ ફિલ્ટર હોર્ડિંગ્સ / Total Structures</span>
                <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{auditReportData.length}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-500">સક્રિય હોર્ડિંગ્સ / Active Structures</span>
                <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block font-mono">{auditReportData.filter(h => h.statusInFY === "Active").length}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-500">રદ કરેલ હોર્ડિંગ્સ / Cancelled Structures</span>
                <span className="text-sm font-extrabold text-rose-700 mt-0.5 block font-mono">{auditReportData.filter(h => h.statusInFY === "Cancelled").length}</span>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase text-slate-700 border-b pb-1">ઓડિટ લિસ્ટ / Complete Structure Audit Records</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                    <th className="p-2 w-10 text-center border-r border-slate-200">Sr</th>
                    <th className="p-2 border-r border-slate-200">એજન્સી / Agency Name</th>
                    <th className="p-2 border-r border-slate-200">ટી.પી. નં / TP No</th>
                    <th className="p-2 border-r border-slate-200">પ્લોટ નં / FP No</th>
                    <th className="p-2 border-r border-slate-200">પ્રકાર / Type</th>
                    <th className="p-2 border-r border-slate-200">લોકેશન / Location</th>
                    <th className="p-2 border-r border-slate-200 text-center">સ્થિતિ / Status</th>
                    <th className="p-2 border-r border-slate-200">રદ તારીખ / Cancel Date</th>
                    <th className="p-2 border-r border-slate-200">રદ વર્ષ / Cancel FY</th>
                    <th className="p-2 border-r border-slate-200">કારણ / Reason</th>
                    <th className="p-2 text-right">વાર્ષિક ફી / Annual Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {auditReportData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-4 text-center text-slate-400 font-semibold">
                        પસંદ કરેલ ફિલ્ટર્સ મુજબ કોઈ ડેટા મળ્યો નથી (No matching records found)
                      </td>
                    </tr>
                  ) : (
                    auditReportData.map((h, idx) => (
                      <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-2 text-center text-slate-400 font-semibold border-r border-slate-200 font-mono">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-800 border-r border-slate-200">{h.agency_name}</td>
                        <td className="p-2 font-mono text-slate-600 border-r border-slate-200">{h.tp_number}</td>
                        <td className="p-2 font-mono text-slate-600 border-r border-slate-200">{h.final_plot_no}</td>
                        <td className="p-2 text-slate-600 border-r border-slate-200">{h.hoarding_type}</td>
                        <td className="p-2 text-slate-600 max-w-[150px] truncate border-r border-slate-200" title={h.hoarding_location}>{h.hoarding_location}</td>
                        <td className="p-2 text-center border-r border-slate-200">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            h.statusInFY === "Active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {h.statusInFY}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-rose-600 border-r border-slate-200 text-center">{h.cancellation_date || "-"}</td>
                        <td className="p-2 font-mono text-rose-600 border-r border-slate-200 text-center">{h.cancellation_financial_year || "-"}</td>
                        <td className="p-2 text-rose-700 border-r border-slate-200 truncate max-w-[120px]" title={h.cancellation_reason}>{h.cancellation_reason || "-"}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-700">₹ {(h.annual_license_fee || 0).toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 1. AGENCY WISE REPORT LAYOUT */}
        {selectedReport === "agency" && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-500">પરિક્ષણ એજન્સી / Agency Name</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{agencyReportData.agencyName}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-500">કુલ હોર્ડિંગ્સ / Active Structures</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{agencyReportData.hoardings.length}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-500">વાર્ષિક અપેક્ષિત રેવન્યુ / Expected Annual Fee</span>
                <span className="text-sm font-bold text-amber-700 mt-0.5 block font-mono">₹ {agencyReportData.totalAnnualFee.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase text-slate-700 border-b pb-1">૧. નોંધાયેલ હોર્ડિંગ ક્ષેત્રો / Licensed Structures</h3>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                  <th className="p-2 w-12 text-center">Sr</th>
                  <th className="p-2">ટી.પી. નંબર / TP No</th>
                  <th className="p-2">ફાઇનલ પ્લોટ નં / RS No</th>
                  <th className="p-2">પ્રકાર / Type</th>
                  <th className="p-2">નાણાકીય વર્ષ / FY</th>
                  <th className="p-2">નક્કી લોકેશન / Location</th>
                  <th className="p-2 text-center">ક્ષેત્રફળ / Area</th>
                  <th className="p-2 text-right">વાર્ષિક ફી / Annual Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {agencyReportData.hoardings.length > 0 ? (
                  agencyReportData.hoardings.map((h, i) => (
                    <tr key={h.id}>
                      <td className="p-2 text-center font-mono">{i + 1}</td>
                      <td className="p-2 font-mono text-slate-700">{h.tp_number || "-"}</td>
                      <td className="p-2 font-mono text-slate-700">{h.final_plot_no || "-"}</td>
                      <td className="p-2 text-slate-600">{h.hoarding_type || "-"}</td>
                      <td className="p-2 font-mono text-slate-600">{h.financial_year || "-"}</td>
                      <td className="p-2 text-slate-600">{h.hoarding_location}</td>
                      <td className="p-2 text-center font-mono">{h.area} Sq.m</td>
                      <td className="p-2 text-right font-mono">₹{h.annual_license_fee}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">આ એજન્સી હેઠળ કોઈ હોર્ડિંગ નોંધાયેલ નથી.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <h3 className="text-xs font-bold uppercase text-slate-700 border-b pb-1">૨. જમા થયેલ ફી વિગતો / Payment Transactions</h3>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                  <th className="p-2 w-12 text-center">Sr</th>
                  <th className="p-2">તારીખ / Date</th>
                  <th className="p-2">રસીદ નંબર / Receipt</th>
                  <th className="p-2">ક્વાર્ટર / Quarter</th>
                  <th className="p-2 text-right">લાયસન્સ ફી / License Fee</th>
                  <th className="p-2 text-right">વ્યાજ / Interest</th>
                  <th className="p-2 text-right font-bold text-emerald-800">કુલ ભરેલ / Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {agencyReportData.payments.length > 0 ? (
                  agencyReportData.payments.map((p, i) => (
                    <tr key={p.id}>
                      <td className="p-2 text-center font-mono">{i + 1}</td>
                      <td className="p-2 font-mono">{p.receipt_date}</td>
                      <td className="p-2 font-bold font-mono text-slate-700">{p.receipt_number}</td>
                      <td className="p-2 font-semibold text-slate-700">{p.quarter}</td>
                      <td className="p-2 text-right font-mono">₹{p.license_fee}</td>
                      <td className="p-2 text-right font-mono text-red-600">₹{p.interest}</td>
                      <td className="p-2 text-right font-bold font-mono text-emerald-700">₹{p.grand_total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400">કોઈ જમા ટ્રાન્ઝેક્શન મળ્યા નથી.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. LOCATION WISE REPORT LAYOUT */}
        {selectedReport === "location" && (
          <div className="space-y-4">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                  <th className="p-2 w-12 text-center">Sr</th>
                  <th className="p-2">એજન્સી નામ / Agency</th>
                  <th className="p-2">ટી.પી. નંબર / TP No</th>
                  <th className="p-2">ફાઇનલ પ્લોટ નં / RS No</th>
                  <th className="p-2">પ્રકાર / Type</th>
                  <th className="p-2">નાણાકીય વર્ષ / FY</th>
                  <th className="p-2">સરનામું / Location</th>
                  <th className="p-2 text-center">ક્ષેત્રફળ / Area</th>
                  <th className="p-2 text-right">વાર્ષિક ફી / Annual Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {locationReportData.length > 0 ? (
                  locationReportData.map((h, i) => (
                    <tr key={h.id}>
                      <td className="p-2 text-center font-mono">{i + 1}</td>
                      <td className="p-2 font-semibold text-slate-800">{h.agency_name}</td>
                      <td className="p-2 font-mono text-slate-700">{h.tp_number || "-"}</td>
                      <td className="p-2 font-mono text-slate-700">{h.final_plot_no || "-"}</td>
                      <td className="p-2 text-slate-600">{h.hoarding_type || "-"}</td>
                      <td className="p-2 font-mono text-slate-600">{h.financial_year || "-"}</td>
                      <td className="p-2 text-slate-600">{h.hoarding_location}</td>
                      <td className="p-2 text-center font-mono">{h.area} Sq.m</td>
                      <td className="p-2 text-right font-mono">₹{h.annual_license_fee}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400">કોઈ લોકેશન વિગત મેચ થતી નથી.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. QUARTER WISE REPORT LAYOUT */}
        {selectedReport === "quarter" && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded border border-slate-200 flex justify-between items-center">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-500">તપાસેલ ત્રિમાસિક ગાળો / Target Quarter</span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5">{quarterReportData.quarter}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] uppercase font-bold text-slate-500">કુલ જમા રકમ / Total Quarter Collections</span>
                <span className="text-lg font-bold text-emerald-700 font-mono">₹ {quarterReportData.totalGrand.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                  <th className="p-2 w-12 text-center">Sr</th>
                  <th className="p-2">તારીખ / Date</th>
                  <th className="p-2">રસીદ નંબર / Receipt No</th>
                  <th className="p-2">એજન્સી નામ / Agency</th>
                  <th className="p-2 text-right">લાયસન્સ ફી / Fee</th>
                  <th className="p-2 text-right">વ્યાજ / Interest</th>
                  <th className="p-2 text-right">SGST</th>
                  <th className="p-2 text-right">CGST</th>
                  <th className="p-2 text-right font-bold text-emerald-800">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {quarterReportData.payments.length > 0 ? (
                  quarterReportData.payments.map((p, i) => (
                    <tr key={p.id}>
                      <td className="p-2 text-center font-mono">{i + 1}</td>
                      <td className="p-2 font-mono">{p.receipt_date}</td>
                      <td className="p-2 font-bold font-mono">{p.receipt_number}</td>
                      <td className="p-2 font-semibold text-slate-800">{p.agency_name}</td>
                      <td className="p-2 text-right font-mono">₹{p.license_fee}</td>
                      <td className="p-2 text-right font-mono">₹{p.interest}</td>
                      <td className="p-2 text-right font-mono">₹{p.sgst}</td>
                      <td className="p-2 text-right font-mono">₹{p.cgst}</td>
                      <td className="p-2 text-right font-bold font-mono text-emerald-700">₹{p.grand_total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-slate-400">આ ત્રિમાસિક ગાળામાં કોઈ ફી જમા થયેલ નથી.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. PENDING LICENSE FEE REPORT */}
        {selectedReport === "pending" && (
          <div className="space-y-4">
            <div className="p-3.5 bg-red-50 border-l-4 border-red-500 rounded text-xs text-red-900 mb-2">
              <strong>નોંધ:</strong> નીચે દર્શાવેલ એજન્સીઓની પરમિશન ફી વાર્ષિક અપેક્ષિત ફી કરતા ઓછી જમા થયેલ છે. તાત્કાલિક રીમાઇન્ડર અથવા ડીમાન્ડ નોટિસ જારી કરવી.
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-red-50/50 font-bold text-red-950 border-b">
                  <th className="p-2.5 w-12 text-center">Sr</th>
                  <th className="p-2.5">એજન્સી નામ / Agency Name</th>
                  <th className="p-2.5">GST નંબર / GSTIN</th>
                  <th className="p-2.5 text-center">સક્રિય હોર્ડિંગ્સ / Hoardings</th>
                  <th className="p-2.5 text-right">વાર્ષિક અપેક્ષિત ફી / Expected Fee</th>
                  <th className="p-2.5 text-right">કુલ ભરેલ ફી / Paid Fee</th>
                  <th className="p-2.5 text-right font-black text-red-700">બાકી રકમ / Outstanding Dues</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium">
                {pendingReportData.length > 0 ? (
                  pendingReportData.map((row, i) => (
                    <tr key={row.agency_name} className="hover:bg-red-50/10">
                      <td className="p-2.5 text-center font-mono text-slate-500">{i + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">{row.agency_name}</td>
                      <td className="p-2.5 font-mono text-slate-600 uppercase">{row.gst_number}</td>
                      <td className="p-2.5 text-center font-mono">{row.hoarding_count}</td>
                      <td className="p-2.5 text-right font-mono">₹{row.expected.toLocaleString("en-IN")}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-700">₹{row.paid.toLocaleString("en-IN")}</td>
                      <td className="p-2.5 text-right font-black font-mono text-red-600 bg-red-50/20">
                        ₹{row.pending.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-green-700 font-bold">🎉 તમામ એજન્સીઓની કોઈ બાકી રકમ નથી! (Outstanding Cleared)</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. EXPIRED STABILITY CERTIFICATE REPORT */}
        {selectedReport === "expired_stability" && (
          <div className="space-y-4">
            <div className="p-3 bg-red-100 border-l-4 border-red-600 rounded text-xs text-red-900 font-semibold">
              ⚠️ ત્વરિત કાર્યવાહી: નીચે દર્શાવેલા હોર્ડિંગ પ્રમાણપત્રોની મુદત વીતી ગઈ છે. અકસ્માત નિયંત્રણ માટે તેમને તાકીદે નોટિસ મોકલી સ્ટ્રક્ચર હટાવો અથવા રીન્યુ કરાવો.
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                  <th className="p-2 w-12 text-center">Sr</th>
                  <th className="p-2">પ્રમાણપત્ર નંબર / Certificate No</th>
                  <th className="p-2">એજન્સી નામ / Agency</th>
                  <th className="p-2">લોકેશન / Location</th>
                  <th className="p-2 text-center">મુદત તારીખ / Expired Date</th>
                  <th className="p-2">એન્જીનીયર વિગત / Certified Engineer</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium text-red-900 bg-red-50/20">
                {expiredCertificates.length > 0 ? (
                  expiredCertificates.map((c, i) => (
                    <tr key={c.id} className="hover:bg-red-50">
                      <td className="p-2 text-center font-mono text-red-700">{i + 1}</td>
                      <td className="p-2 font-bold font-mono text-red-700">{c.certificate_number}</td>
                      <td className="p-2 font-bold">{c.agency_name}</td>
                      <td className="p-2 text-slate-700">{c.hoarding_location}</td>
                      <td className="p-2 text-center font-black font-mono text-red-600 underline">{c.valid_till_date}</td>
                      <td className="p-2 text-slate-600">
                        {c.engineer_name} {c.engineer_mobile_number && <span className="block text-[10px] font-mono">📞 {c.engineer_mobile_number}</span>}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-emerald-700 font-bold">કોઈ પણ પ્રમાણપત્ર એક્સપાયર થયેલ નથી.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. STABILITY CERTIFICATES EXPIRING WITHIN 45 DAYS */}
        {selectedReport === "expiring_45_stability" && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-xs text-amber-900">
              મજબૂતીકરણ ચકાસણી: આગામી ૪૫ દિવસમાં સમાપ્ત થતા સર્ટિફિકેટ્સ. એજન્સીઓને રિન્યુઅલ માટે જાણ કરો.
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                  <th className="p-2 w-12 text-center">Sr</th>
                  <th className="p-2">પ્રમાણપત્ર નંબર / Certificate No</th>
                  <th className="p-2">એજન્સી નામ / Agency</th>
                  <th className="p-2">લોકેશન / Location</th>
                  <th className="p-2 text-center">આખરી તારીખ / Expire Date</th>
                  <th className="p-2 text-center">બાકી દિવસો / Days Left</th>
                  <th className="p-2">એન્જીનીયર વિગત / Certified Engineer</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium text-amber-950 bg-amber-50/20">
                {expiringCertificates45.length > 0 ? (
                  expiringCertificates45.map((c, i) => {
                    const days = daysUntil(c.valid_till_date);
                    return (
                      <tr key={c.id} className="hover:bg-amber-100/30">
                        <td className="p-2 text-center font-mono text-amber-700">{i + 1}</td>
                        <td className="p-2 font-bold font-mono text-amber-800">{c.certificate_number}</td>
                        <td className="p-2 font-bold">{c.agency_name}</td>
                        <td className="p-2 text-slate-700">{c.hoarding_location}</td>
                        <td className="p-2 text-center font-bold font-mono text-amber-900">{c.valid_till_date}</td>
                        <td className="p-2 text-center font-black font-mono text-red-600">{days} દિવસ</td>
                        <td className="p-2 text-slate-600">
                          {c.engineer_name} {c.engineer_mobile_number && <span className="block text-[10px] font-mono">📞 {c.engineer_mobile_number}</span>}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">આગામી ૪૫ દિવસમાં સમાપ્ત થતા કોઈ પ્રમાણપત્રો નથી.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. GST REPORT LAYOUT */}
        {selectedReport === "gst" && (
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50 border-l-4 border-emerald-500 rounded text-xs text-emerald-900 mb-2 flex items-center gap-2">
              <Coins className="h-4.5 w-4.5 text-emerald-600" />
              <span>
                <strong>જી.એસ.ટી. લેઝર અહેવાલ:</strong> તમામ લાયસન્સ ફી અને વ્યાજની રકમ પર વસૂલાયેલ <strong>૯% SGST</strong> અને <strong>૯% CGST</strong> નું સંયુક્ત રજીસ્ટર.
              </span>
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                  <th className="p-2 w-12 text-center">Sr</th>
                  <th className="p-2">તારીખ / Date</th>
                  <th className="p-2">રસીદ નંબર / Receipt No</th>
                  <th className="p-2">એજન્સી નામ / Agency Name</th>
                  <th className="p-2 text-right">કરપાત્ર લાયસન્સ ફી (A)</th>
                  <th className="p-2 text-right">વ્યાજ રકમ (B)</th>
                  <th className="p-2 text-right font-semibold text-emerald-700">SGST (9%) on (A+B)</th>
                  <th className="p-2 text-right font-semibold text-emerald-700">CGST (9%) on (A+B)</th>
                  <th className="p-2 text-right">પરચુરણ / Misc</th>
                  <th className="p-2 text-right font-bold text-emerald-800">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {gstReportData.length > 0 ? (
                  gstReportData.map((p, i) => (
                    <tr key={p.id}>
                      <td className="p-2 text-center font-mono text-slate-500">{i + 1}</td>
                      <td className="p-2 font-mono">{p.receipt_date}</td>
                      <td className="p-2 font-bold font-mono text-slate-700">{p.receipt_number}</td>
                      <td className="p-2 font-semibold text-slate-900">{p.agency_name}</td>
                      <td className="p-2 text-right font-mono">₹{p.license_fee}</td>
                      <td className="p-2 text-right font-mono text-amber-700">₹{p.interest}</td>
                      <td className="p-2 text-right font-bold font-mono text-emerald-700 bg-emerald-50/10">₹{p.sgst}</td>
                      <td className="p-2 text-right font-bold font-mono text-emerald-700 bg-emerald-50/10">₹{p.cgst}</td>
                      <td className="p-2 text-right font-mono">₹{p.miscellaneous_charges}</td>
                      <td className="p-2 text-right font-black font-mono text-emerald-800 bg-slate-50/30">₹{p.grand_total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-slate-400">GST મેળવણી માટે કોઈ ડેટા ઉપલબ્ધ નથી.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Signature Line for Government Printing */}
        <div className="hidden print:block mt-16 pt-8 border-t border-dashed flex justify-between text-xs font-bold text-slate-800">
          <div>
            <p>તૈયાર કરનાર / Clerical Staff</p>
            <p className="mt-8">સુરત મહાનગરપાલિકા</p>
          </div>
          <div className="text-right">
            <p>ઝોનલ હેડ - નવા પૂર્વ (સરથાણા) ઝોન</p>
            <p className="mt-8">મંજૂરી સહી / APPROVED SIGNATURE</p>
          </div>
        </div>

      </div>
    </div>
  );
}
