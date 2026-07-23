import React, { useState, useMemo, useEffect } from "react";
import { Agency, Hoarding, QuarterlyPayment } from "../types";
import { Plus, Edit2, Trash2, Search, Printer, Download, X, Save, Calculator, AlertCircle } from "lucide-react";
import { exportToCSV, roundup, getFinancialYearFromDate, getQuarterOptionsForFY, getHoardingStatusInFY, getHoardingExpectedFeesInFY, formatDateToDDMMYYYY, formatDateToYYYYMMDD, parseDateString } from "../utils/export";
import { FINANCIAL_YEARS } from "./HoardingTab";

interface QuarterlyTabProps {
  quarterlyPayments: QuarterlyPayment[];
  agencies: Agency[];
  hoardings: Hoarding[];
  onAdd: (payment: Omit<QuarterlyPayment, "id" | "sgst" | "cgst" | "grand_total">) => Promise<boolean>;
  onEdit: (payment: QuarterlyPayment) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

export default function QuarterlyTab({
  quarterlyPayments,
  agencies,
  hoardings,
  onAdd,
  onEdit,
  onDelete
}: QuarterlyTabProps) {
  // UI State
  const [selectedFY, setSelectedFY] = useState("2025-26");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [selectedAgency, setSelectedAgency] = useState("");
  const [financialYear, setFinancialYear] = useState("2025-26");
  const [quarter, setQuarter] = useState("");
  const [licenseFee, setLicenseFee] = useState("");
  const [interest, setInterest] = useState("");
  const [miscCharges, setMiscCharges] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [receiptDate, setReceiptDate] = useState("");
  const [remarks, setRemarks] = useState("");

  // Keep form's financialYear state synchronized with the page-wide selectedFY
  useEffect(() => {
    setFinancialYear(selectedFY);
  }, [selectedFY]);

  // Sort and Pagination
  const [sortField, setSortField] = useState<keyof QuarterlyPayment>("receipt_date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Auto-calculate dynamic agency statistics from Hoardings list for selected FY
  const agencyHoardingStats = useMemo(() => {
    if (!selectedAgency) return { count: 0, annual: 0, quarterly: 0 };
    const filtered = hoardings.filter((h) => {
      if (h.agency_name !== selectedAgency) return false;
      return getHoardingStatusInFY(h, selectedFY) !== "Hidden";
    });
    const count = filtered.filter(h => getHoardingStatusInFY(h, selectedFY) === "Active").length;
    const annual = filtered.reduce((acc, h) => acc + getHoardingExpectedFeesInFY(h, selectedFY).annual, 0);
    const quarterly = filtered.reduce((acc, h) => acc + getHoardingExpectedFeesInFY(h, selectedFY).quarterly, 0);
    return { count, annual, quarterly };
  }, [selectedAgency, hoardings, selectedFY]);

  // Pre-fill license fee default value when agency changes
  useEffect(() => {
    if (isAdding && selectedAgency) {
      setLicenseFee(agencyHoardingStats.quarterly.toString());
    }
  }, [selectedAgency, isAdding]);

  // Real-time calculated fields for form display
  const calculatedSGST = useMemo(() => {
    const fee = parseFloat(licenseFee) || 0;
    const intr = parseFloat(interest) || 0;
    if (fee <= 0 && intr <= 0) return 0;
    return roundup((fee + intr) * 0.09);
  }, [licenseFee, interest]);

  const calculatedCGST = useMemo(() => {
    const fee = parseFloat(licenseFee) || 0;
    const intr = parseFloat(interest) || 0;
    if (fee <= 0 && intr <= 0) return 0;
    return roundup((fee + intr) * 0.09);
  }, [licenseFee, interest]);

  const calculatedGrandTotal = useMemo(() => {
    const fee = parseFloat(licenseFee) || 0;
    const intr = parseFloat(interest) || 0;
    const misc = parseFloat(miscCharges) || 0;
    return fee + intr + calculatedSGST + calculatedCGST + misc;
  }, [licenseFee, interest, calculatedSGST, calculatedCGST, miscCharges]);

  const resetForm = () => {
    setSelectedAgency("");
    setFinancialYear(selectedFY);
    setQuarter("");
    setLicenseFee("");
    setInterest("");
    setMiscCharges("");
    setReceiptNumber("");
    setReceiptDate("");
    setRemarks("");
    setFormError("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedAgency) {
      setFormError("એજન્સી પસંદ કરવી ફરજિયાત છે. (Agency is required)");
      return;
    }
    if (!financialYear) {
      setFormError("નાણાકીય વર્ષ પસંદ કરવું ફરજિયાત છે. (Financial Year is required)");
      return;
    }
    if (!quarter) {
      setFormError("ત્રિમાસિક ગાળો (Quarter) પસંદ કરવો ફરજિયાત છે. (Quarter is required)");
      return;
    }

    const fee = parseFloat(licenseFee);
    const intr = parseFloat(interest || "0");
    const misc = parseFloat(miscCharges || "0");

    if (isNaN(fee) || isNaN(intr) || isNaN(misc)) {
      setFormError("લાયસન્સ ફી, વ્યાજ અને પરચુરણ ખર્ચ માત્ર સંખ્યાત્મક મૂલ્યો હોવા જોઈએ. (Values must be numeric.)");
      return;
    }

    if (fee < 0 || intr < 0 || misc < 0) {
      setFormError("નકારાત્મક કિંમતો સ્વીકારવામાં આવતી નથી. (Negative values not allowed.)");
      return;
    }

    const targetDate = receiptDate || new Date().toISOString().split("T")[0];

    const dataPayload = {
      agency_name: selectedAgency,
      financial_year: financialYear,
      quarter,
      license_fee: fee,
      interest: intr,
      miscellaneous_charges: misc,
      receipt_number: receiptNumber.trim(),
      receipt_date: targetDate,
      remarks: remarks.trim()
    };

    if (isAdding) {
      const success = await onAdd(dataPayload);
      if (success) resetForm();
    } else if (editingId !== null) {
      const success = await onEdit({
        id: editingId,
        ...dataPayload,
        sgst: calculatedSGST,
        cgst: calculatedCGST,
        grand_total: calculatedGrandTotal
      });
      if (success) resetForm();
    }
  };

  const startEdit = (p: QuarterlyPayment) => {
    setEditingId(p.id);
    setSelectedAgency(p.agency_name);
    setFinancialYear(p.financial_year || "2025-26");
    setQuarter(p.quarter);
    setLicenseFee(p.license_fee.toString());
    setInterest(p.interest.toString());
    setMiscCharges(p.miscellaneous_charges.toString());
    setReceiptNumber(p.receipt_number);
    setReceiptDate(p.receipt_date);
    setRemarks(p.remarks);
    setIsAdding(false);
    setFormError("");
  };

  const handleDelete = async (id: number, receiptNum: string) => {
    const confirmDelete = window.confirm(
      `શું તમે ખરેખર રસીદ નં "${receiptNum || id}" નો પેમેન્ટ રેકોર્ડ ડીલીટ કરવા માંગો છો?\n(Are you sure you want to delete receipt "${receiptNum || id}"?)`
    );
    if (confirmDelete) {
      await onDelete(id);
    }
  };

  // Dynamically configured list of Sarthana Quarters for Selected FY
  const quarterOptions = useMemo(() => {
    return getQuarterOptionsForFY(selectedFY);
  }, [selectedFY]);

  // Filter & Sort payments
  const filteredPayments = useMemo(() => {
    return quarterlyPayments
      .filter((p) => {
        // Filter by globally selected Financial Year
        if (p.financial_year !== selectedFY) return false;

        const s = searchTerm.toLowerCase();
        return (
          p.agency_name.toLowerCase().includes(s) ||
          p.quarter.toLowerCase().includes(s) ||
          (p.receipt_number && p.receipt_number.toLowerCase().includes(s)) ||
          (p.remarks && p.remarks.toLowerCase().includes(s))
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
  }, [quarterlyPayments, selectedFY, searchTerm, sortField, sortOrder]);

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  const totals = useMemo(() => {
    return filteredPayments.reduce(
      (acc, p) => {
        acc.fee += p.license_fee;
        acc.interest += p.interest;
        acc.sgst += p.sgst;
        acc.cgst += p.cgst;
        acc.misc += p.miscellaneous_charges;
        acc.grand += p.grand_total;
        return acc;
      },
      { fee: 0, interest: 0, sgst: 0, cgst: 0, misc: 0, grand: 0 }
    );
  }, [filteredPayments]);

  const toggleSort = (field: keyof QuarterlyPayment) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleExportExcel = () => {
    exportToCSV(
      filteredPayments,
      [
        "Receipt Date",
        "Receipt Number",
        "Agency Name",
        "Financial Year",
        "Quarter",
        "License Fee (₹)",
        "Interest (₹)",
        "Misc Charges (₹)",
        "SGST 9% (₹)",
        "CGST 9% (₹)",
        "Grand Total (₹)",
        "Remarks"
      ],
      [
        "receipt_date",
        "receipt_number",
        "agency_name",
        "financial_year",
        "quarter",
        "license_fee",
        "interest",
        "miscellaneous_charges",
        "sgst",
        "cgst",
        "grand_total",
        "remarks"
      ],
      "SMC_Sarthana_Quarterly_Fee_Receipts"
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header segment with page-wide Financial Year selection */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print-area">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">ત્રિમાસિક લાયસન્સ ફી વિગતો / Quarterly License Fee Information</h2>
            <p className="text-xs text-slate-500">એજન્સી પાસેથી વસૂલાયેલ ત્રિમાસિક ફીની રસીદ અને GST ગણતરી રજીસ્ટર</p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded px-3 py-1 flex items-center gap-2">
            <span className="text-xs font-bold text-orange-950">નાણાકીય વર્ષ / Selected FY:</span>
            <select
              value={selectedFY}
              onChange={(e) => {
                setSelectedFY(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-2.5 py-0.5 text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {FINANCIAL_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setSelectedAgency(agencies[0]?.agency_name || "");
              setFinancialYear(selectedFY); // Force pre-fill to selectedFY
              setQuarter("");
              setLicenseFee("");
              setInterest("0");
              setMiscCharges("0");
              setReceiptNumber("");
              setReceiptDate(new Date().toISOString().split("T")[0]);
              setRemarks("");
              setFormError("");
            }}
            disabled={isAdding || editingId !== null}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" /> નવી રસીદ ઉમેરો (Add Receipt)
          </button>
          
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

      {/* Adding / Editing Form Panel */}
      {(isAdding || editingId !== null) && (
        <div className="p-5 bg-orange-50/40 border-b border-slate-200 no-print-area">
          <h3 className="text-sm font-bold text-orange-950 mb-4">
            {isAdding ? "નવી ફી રસીદ નોંધણી / Record New Fee Receipt" : "ફી રસીદ વિગતો સુધારો / Edit Fee Receipt"}
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Top Row: Agency, FY and Quarter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  એજન્સી / Agency Name <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedAgency}
                  onChange={(e) => setSelectedAgency(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">એજન્સી પસંદ કરો</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.agency_name}>
                      {a.agency_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  નાણાકીય વર્ષ / Financial Year <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  disabled
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 text-sm font-mono text-slate-500 cursor-not-allowed"
                >
                  {FINANCIAL_YEARS.map((fy) => (
                    <option key={fy} value={fy}>
                      {fy}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">પૃષ્ઠ પર સિલેક્ટ કરેલ વર્ષ મુજબ લૉક કરેલ છે</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ત્રિમાસિક ગાળો / Select Quarter <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={quarter}
                  onChange={(e) => setQuarter(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                >
                  <option value="">ક્વાર્ટર પસંદ કરો</option>
                  {quarterOptions.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>

              {/* Real-time Dynamic Agency Info */}
              {selectedAgency && (
                <div className="bg-white p-2 border border-orange-200 rounded flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <div className="text-[11px] text-slate-700">
                    <p className="font-semibold text-orange-950">ચાલુ એજન્સી માહિતી (Auto fetched):</p>
                    <p>હોર્ડિંગ્સ: <strong>{agencyHoardingStats.count}</strong> | વાર્ષિક રકમ: <strong>₹ {agencyHoardingStats.annual}</strong></p>
                    <p>અપેક્ષિત ત્રિમાસિક રકમ: <strong>₹ {agencyHoardingStats.quarterly}</strong></p>
                  </div>
                </div>
              )}
            </div>

            {/* Inputs & Calculation Section */}
            <div className="p-4 bg-white rounded border border-slate-200 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    લાયસન્સ ફી / License Fee (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={licenseFee}
                    onChange={(e) => setLicenseFee(e.target.value)}
                    placeholder="રકમ"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    વ્યાજ રકમ / Interest (₹)
                  </label>
                  <input
                    type="number"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    પરચુરણ ચાર્જ / Misc Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={miscCharges}
                    onChange={(e) => setMiscCharges(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    રસીદ નંબર / Receipt Number
                  </label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="SMC/NZ/Q/..."
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono uppercase focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Automatic SGST, CGST, Grand Total readout */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-emerald-50/50 rounded border border-emerald-100">
                <div className="text-center md:border-r border-slate-200">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">SGST (9% Roundup)</span>
                  <span className="text-sm font-bold text-slate-800 font-mono">₹ {calculatedSGST}</span>
                </div>
                <div className="text-center md:border-r border-slate-200">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">CGST (9% Roundup)</span>
                  <span className="text-sm font-bold text-slate-800 font-mono">₹ {calculatedCGST}</span>
                </div>
                <div className="text-center md:border-r border-slate-200 col-span-2 bg-emerald-600 text-white rounded p-1 shadow-xs">
                  <span className="block text-[10px] uppercase font-bold opacity-80">કુલ ભરેલ રકમ / Grand Total (ROUNDUP)</span>
                  <span className="text-base font-extrabold font-mono">₹ {calculatedGrandTotal}</span>
                </div>
              </div>
            </div>

            {/* Receipt Date & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  નાણાં મળ્યા તારીખ / Receipt Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formatDateToYYYYMMDD(receiptDate)}
                  onChange={(e) => setReceiptDate(formatDateToDDMMYYYY(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  શેરા / Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="પેમેન્ટ અંગે નોંધણી"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Save className="h-4 w-4" /> રસીદ સેવ કરો (Save Receipt)
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" /> રદ કરો (Cancel)
              </button>
            </div>

            {formError && (
              <p className="text-xs text-red-600 font-semibold">{formError}</p>
            )}
          </form>
        </div>
      )}

      {/* Filter and Search box */}
      <div className="p-3 border-b border-slate-200 bg-white flex items-center gap-2 no-print-area">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="એજન્સી, ક્વાર્ટર, રસીદ નંબર થી શોધો... (Instant Search)"
          className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 w-full max-w-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
          >
            સાફ કરો (Clear)
          </button>
        )}
      </div>

      {/* Main Table Segment */}
      <div className="print-area">
        
        {/* Only visible in print layout */}
        <div className="hidden print:block mb-6 text-center border-b pb-4">
          <h1 className="text-xl font-bold">સુરત મહાનગરપાલિકા - નવા પૂર્વ (સરથાણા) ઝોન</h1>
          <h2 className="text-sm font-semibold text-slate-600 mt-1">ત્રિમાસિક લાયસન્સ ફી રસીદ બુક / Quarterly Fee Book</h2>
          <p className="text-xs text-slate-500 mt-1">તારીખ: {new Date().toLocaleDateString("gu-IN")} | સમય: {new Date().toLocaleTimeString("gu-IN")}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
              <tr>
                <th className="p-2.5 w-12 text-center">Sr</th>
                <th
                  onClick={() => toggleSort("receipt_date")}
                  className="p-2.5 cursor-pointer select-none hover:bg-slate-200/60"
                >
                  ભર્યા તારીખ / Date {sortField === "receipt_date" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="p-2.5">રસીદ નં / Receipt No</th>
                <th
                  onClick={() => toggleSort("agency_name")}
                  className="p-2.5 cursor-pointer select-none hover:bg-slate-200/60"
                >
                  એજન્સીનું નામ / Agency {sortField === "agency_name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="p-2.5">નાણાકીય વર્ષ / FY</th>
                <th className="p-2.5">ત્રિમાસિક ગાળો / Quarter</th>
                <th className="p-2.5 text-right">લાયસન્સ ફી / Fee</th>
                <th className="p-2.5 text-right">વ્યાજ / Int</th>
                <th className="p-2.5 text-right">SGST (9%)</th>
                <th className="p-2.5 text-right">CGST (9%)</th>
                <th className="p-2.5 text-right">પરચુરણ / Misc</th>
                <th className="p-2.5 text-right font-bold text-emerald-800">કુલ ભરેલ / Grand Total</th>
                <th className="p-2.5 no-print text-center w-20">ક્રિયાઓ / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-2.5 text-center text-slate-500 font-mono">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="p-2.5 font-mono">{p.receipt_date}</td>
                    <td className="p-2.5 font-bold font-mono text-slate-800">{p.receipt_number || "-"}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{p.agency_name}</td>
                    <td className="p-2.5 font-mono text-slate-700">{p.financial_year || "2025-26"}</td>
                    <td className="p-2.5 text-slate-600 font-medium">{p.quarter}</td>
                    <td className="p-2.5 text-right font-mono text-slate-700">₹{p.license_fee}</td>
                    <td className="p-2.5 text-right font-mono text-slate-700">₹{p.interest}</td>
                    <td className="p-2.5 text-right font-mono text-slate-600">₹{p.sgst}</td>
                    <td className="p-2.5 text-right font-mono text-slate-600">₹{p.cgst}</td>
                    <td className="p-2.5 text-right font-mono text-slate-700">₹{p.miscellaneous_charges}</td>
                    <td className="p-2.5 text-right font-bold font-mono text-emerald-700 bg-emerald-50/40">
                      ₹{p.grand_total}
                    </td>
                    <td className="p-2.5 text-center no-print flex justify-center gap-0.5">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                        title="Edit Payment"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.receipt_number)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        title="Delete Payment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    કોઈ ચુકવણી રસીદ મળી નથી. (No payment receipts registered)
                  </td>
                </tr>
              )}
            </tbody>
            {filteredPayments.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-extrabold text-slate-900 font-mono">
                <tr>
                  <td colSpan={6} className="p-2.5 text-right font-sans text-xs">કુલ સરવાળો / FY {selectedFY} TOTALS:</td>
                  <td className="p-2.5 text-right text-slate-950">₹{totals.fee.toLocaleString("en-IN")}</td>
                  <td className="p-2.5 text-right text-slate-950">₹{totals.interest.toLocaleString("en-IN")}</td>
                  <td className="p-2.5 text-right text-slate-600">₹{totals.sgst.toLocaleString("en-IN")}</td>
                  <td className="p-2.5 text-right text-slate-600">₹{totals.cgst.toLocaleString("en-IN")}</td>
                  <td className="p-2.5 text-right text-slate-950">₹{totals.misc.toLocaleString("en-IN")}</td>
                  <td className="p-2.5 text-right text-emerald-950 bg-emerald-100">₹{totals.grand.toLocaleString("en-IN")}</td>
                  <td className="p-2.5 no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print-area text-xs">
            <span className="text-slate-500">
              કુલ <strong>{filteredPayments.length}</strong> માંથી એન્ટ્રી <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> થી <strong>{Math.min(currentPage * itemsPerPage, filteredPayments.length)}</strong>
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 disabled:opacity-40 cursor-pointer"
              >
                પહેલું
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                    currentPage === p
                      ? "bg-orange-600 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 disabled:opacity-40 cursor-pointer"
              >
                આગળ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
