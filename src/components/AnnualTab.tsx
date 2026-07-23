import React, { useState, useMemo } from "react";
import { Agency, Hoarding, QuarterlyPayment } from "../types";
import { Search, Printer, Download, Landmark, TrendingUp, DollarSign } from "lucide-react";
import { exportToCSV, getHoardingStatusInFY, getHoardingExpectedFeesInFY } from "../utils/export";
import { FINANCIAL_YEARS } from "./HoardingTab";

interface AnnualTabProps {
  agencies: Agency[];
  hoardings: Hoarding[];
  quarterlyPayments: QuarterlyPayment[];
}

interface AnnualSummaryRow {
  id: number;
  agency_name: string;
  total_hoardings: number;
  annual_license_fee: number;
  total_license_fee_paid: number;
  total_interest: number;
  total_misc: number;
  total_sgst: number;
  total_cgst: number;
  grand_total_paid: number;
  remarks: string;
}

export default function AnnualTab({ agencies, hoardings, quarterlyPayments }: AnnualTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFY, setSelectedFY] = useState("2025-26");
  const [sortField, setSortField] = useState<keyof AnnualSummaryRow>("agency_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Dynamically prepare yearly summary records by aggregating Quarterly and Hoarding entries
  const summaryData = useMemo(() => {
    return agencies.map((agency, index) => {
      // Filter hoardings that are visible (not hidden) in selected Financial Year
      const agencyVisibleHoardings = hoardings.filter(
        (h) => h.agency_name === agency.agency_name && getHoardingStatusInFY(h, selectedFY) !== "Hidden"
      );

      // If this agency has no hoardings created yet for or in this FY, hide the agency entirely for this year
      if (agencyVisibleHoardings.length === 0) {
        return null;
      }

      // 1. Filter hoardings for active totals in selected Financial Year
      const activeHoardings = agencyVisibleHoardings.filter((h) => getHoardingStatusInFY(h, selectedFY) === "Active");
      const totalHoardings = activeHoardings.length;
      const annualLicenseFee = agencyVisibleHoardings.reduce((acc, h) => acc + getHoardingExpectedFeesInFY(h, selectedFY).annual, 0);

      // 2. Filter payments for financial performance totals in selected Financial Year
      const agencyPayments = quarterlyPayments.filter((p) => p.agency_name === agency.agency_name && (p.financial_year === selectedFY));
      const totalPaidFee = agencyPayments.reduce((acc, p) => acc + p.license_fee, 0);
      const totalInterest = agencyPayments.reduce((acc, p) => acc + p.interest, 0);
      const totalMisc = agencyPayments.reduce((acc, p) => acc + p.miscellaneous_charges, 0);
      const totalSGST = agencyPayments.reduce((acc, p) => acc + p.sgst, 0);
      const totalCGST = agencyPayments.reduce((acc, p) => acc + p.cgst, 0);
      const grandTotalPaid = agencyPayments.reduce((acc, p) => acc + p.grand_total, 0);

      // 3. Formulate smart remarks
      let remarks = "સંતોષકારક (Satisfactory)";
      const percentPaid = annualLicenseFee > 0 ? (totalPaidFee / annualLicenseFee) * 100 : 0;
      if (annualLicenseFee === 0) {
        remarks = "કોઈ સક્રિય હોર્ડિંગ્સ નથી (No active structures)";
      } else if (percentPaid < 25) {
        remarks = "⚠️ બાકી રકમ નોટિસ મોકલો (Severe Pending - Send Notice)";
      } else if (percentPaid < 75) {
        remarks = "આંશિક ચુકવેલ (Partially Paid)";
      } else if (percentPaid >= 100) {
        remarks = "✅ પૂર્ણ ચુકવેલ (Fully Paid / Clear)";
      }

      return {
        id: agency.id,
        agency_name: agency.agency_name,
        total_hoardings: totalHoardings,
        annual_license_fee: annualLicenseFee,
        total_license_fee_paid: totalPaidFee,
        total_interest: totalInterest,
        total_misc: totalMisc,
        total_sgst: totalSGST,
        total_cgst: totalCGST,
        grand_total_paid: grandTotalPaid,
        remarks: remarks
      } as AnnualSummaryRow;
    }).filter((r): r is AnnualSummaryRow => r !== null);
  }, [agencies, hoardings, quarterlyPayments, selectedFY]);

  // Overall stats for visual headers
  const overallSums = useMemo(() => {
    return summaryData.reduce(
      (acc, r) => {
        acc.expected += r.annual_license_fee;
        acc.paid += r.grand_total_paid;
        acc.hoardings += r.total_hoardings;
        return acc;
      },
      { expected: 0, paid: 0, hoardings: 0 }
    );
  }, [summaryData]);

  // Filter & Sort
  const filteredSummary = useMemo(() => {
    return summaryData
      .filter((r) => {
        const s = searchTerm.toLowerCase();
        return (
          r.agency_name.toLowerCase().includes(s) ||
          r.remarks.toLowerCase().includes(s)
        );
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }
        return 0;
      });
  }, [summaryData, searchTerm, sortField, sortOrder]);

  const toggleSort = (field: keyof AnnualSummaryRow) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleExportExcel = () => {
    exportToCSV(
      filteredSummary,
      [
        "Agency Name",
        "Total Hoardings",
        "Expected Annual Fee (₹)",
        "License Fee Paid (₹)",
        "Interest (₹)",
        "Misc Charges (₹)",
        "SGST (₹)",
        "CGST (₹)",
        "Grand Total Paid (₹)",
        "Status / Remarks"
      ],
      [
        "agency_name",
        "total_hoardings",
        "annual_license_fee",
        "total_license_fee_paid",
        "total_interest",
        "total_misc",
        "total_sgst",
        "total_cgst",
        "grand_total_paid",
        "remarks"
      ],
      "SMC_Sarthana_Annual_Summaries_Report"
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Summary Cards Row - No Print Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print-area">
        <div className="bg-slate-800 text-white rounded-lg p-4 shadow-sm border border-slate-700 flex items-center justify-between">
          <div>
            <span className="block text-[11px] uppercase font-bold tracking-wider text-slate-300">કુલ અપેક્ષિત વાર્ષિક રકમ / Expected Annual</span>
            <span className="text-xl font-black font-mono mt-1 block">₹ {overallSums.expected.toLocaleString("en-IN")}</span>
          </div>
          <Landmark className="h-10 w-10 text-orange-400 opacity-80" />
        </div>

        <div className="bg-emerald-800 text-white rounded-lg p-4 shadow-sm border border-emerald-700 flex items-center justify-between">
          <div>
            <span className="block text-[11px] uppercase font-bold tracking-wider text-emerald-100">કુલ વસૂલાયેલ વાર્ષિક રકમ / Total Received</span>
            <span className="text-xl font-black font-mono mt-1 block">₹ {overallSums.paid.toLocaleString("en-IN")}</span>
          </div>
          <TrendingUp className="h-10 w-10 text-emerald-300 opacity-80" />
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="block text-[11px] uppercase font-bold tracking-wider text-slate-500">કુલ બાકી વાર્ષિક રકમ / Total Outstanding</span>
            <span className={`text-xl font-black font-mono mt-1 block ${overallSums.expected - overallSums.paid > 0 ? "text-red-600" : "text-slate-700"}`}>
              ₹ {Math.max(overallSums.expected - overallSums.paid, 0).toLocaleString("en-IN")}
            </span>
          </div>
          <DollarSign className="h-10 w-10 text-slate-400 opacity-80" />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print-area">
          <div>
            <h2 className="text-lg font-bold text-slate-800">વાર્ષિક લાયસન્સ ફી સારાંશ / Annual License Fee Information</h2>
            <p className="text-xs text-slate-500">દરેક એજન્સીના કુલ લાયસન્સ, અપેક્ષિત ફી અને વાસ્તવિક ચૂકવણીનો સ્વચાલિત વાર્ષિક અહેવાલ</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Download className="h-4 w-4" /> Excel નિકાસ
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Printer className="h-4 w-4" /> પ્રિન્ટ / PDF
            </button>
          </div>
        </div>

        {/* Search & Financial Year Filter */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print-area">
          <div className="flex items-center gap-2 w-full max-w-md">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="એજન્સી નામ અથવા રીમાર્ક્સથી ફિલ્ટર કરો... (Instant Search)"
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer flex-shrink-0"
              >
                સાફ કરો
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">નાણાકીય વર્ષ (Financial Year):</span>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="text-xs bg-orange-50 text-orange-950 font-bold border border-orange-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
            >
              {FINANCIAL_YEARS.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Printable View */}
        <div className="print-area">
          
          <div className="hidden print:block mb-6 text-center border-b pb-4">
            <h1 className="text-xl font-bold">સુરત મહાનગરપાલિકા - નવા પૂર્વ (સરથાણા) ઝોન</h1>
            <h2 className="text-sm font-semibold text-slate-600 mt-1">વાર્ષિક લાયસન્સ ફી અને વસૂલાત સારાંશ અહેવાલ / Annual Summary Report</h2>
            <p className="text-xs text-slate-500 mt-1">તારીખ: {new Date().toLocaleDateString("gu-IN")} | સમય: {new Date().toLocaleTimeString("gu-IN")}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="p-2.5 w-12 text-center">Sr</th>
                  <th
                    onClick={() => toggleSort("agency_name")}
                    className="p-2.5 cursor-pointer select-none hover:bg-slate-200/60"
                  >
                    એજન્સીનું નામ / Agency Name {sortField === "agency_name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th
                    onClick={() => toggleSort("total_hoardings")}
                    className="p-2.5 text-center cursor-pointer select-none hover:bg-slate-200/60"
                  >
                    કુલ હોર્ડિંગ્સ / Hoardings {sortField === "total_hoardings" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th
                    onClick={() => toggleSort("annual_license_fee")}
                    className="p-2.5 text-right cursor-pointer select-none hover:bg-slate-200/60"
                  >
                    અપેક્ષિત ફી / Expected {sortField === "annual_license_fee" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th className="p-2.5 text-right">ભરેલ ફી / Fee Paid</th>
                  <th className="p-2.5 text-right">વ્યાજ / Interest</th>
                  <th className="p-2.5 text-right">SGST (9%)</th>
                  <th className="p-2.5 text-right">CGST (9%)</th>
                  <th className="p-2.5 text-right">વિવિધ ચાર્જ / Misc</th>
                  <th className="p-2.5 text-right font-bold text-emerald-800">કુલ ભરેલ / Grand Total</th>
                  <th className="p-2.5 text-center">રીમાર્ક્સ અને સ્ટેટસ / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSummary.length > 0 ? (
                  filteredSummary.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-800">{row.agency_name}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-700">{row.total_hoardings}</td>
                      <td className="p-2.5 text-right font-mono font-semibold text-amber-700">₹{row.annual_license_fee.toLocaleString("en-IN")}</td>
                      <td className="p-2.5 text-right font-mono text-slate-700">₹{row.total_license_fee_paid.toLocaleString("en-IN")}</td>
                      <td className="p-2.5 text-right font-mono text-slate-600">₹{row.total_interest.toLocaleString("en-IN")}</td>
                      <td className="p-2.5 text-right font-mono text-slate-500">₹{row.total_sgst.toLocaleString("en-IN")}</td>
                      <td className="p-2.5 text-right font-mono text-slate-500">₹{row.total_cgst.toLocaleString("en-IN")}</td>
                      <td className="p-2.5 text-right font-mono text-slate-600">₹{row.total_misc.toLocaleString("en-IN")}</td>
                      <td className="p-2.5 text-right font-bold font-mono text-emerald-700 bg-emerald-50/30">
                        ₹{row.grand_total_paid.toLocaleString("en-IN")}
                      </td>
                      <td className="p-2.5 text-center text-[11px]">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          row.remarks.includes("Notice") 
                            ? "bg-red-100 text-red-800" 
                            : row.remarks.includes("Fully Paid") 
                              ? "bg-green-100 text-green-800" 
                              : row.remarks.includes("Partially")
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                        }`}>
                          {row.remarks}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      કોઈ ડેટા ઉપલબ્ધ નથી.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
