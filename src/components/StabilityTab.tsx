import React, { useState, useMemo } from "react";
import { Agency, Hoarding, StabilityCertificate } from "../types";
import { Plus, Edit2, Trash2, Search, Printer, Download, X, Save, ShieldCheck, AlertTriangle } from "lucide-react";
import { exportToCSV, daysUntil, isExpiringSoon, formatDateToDDMMYYYY, formatDateToYYYYMMDD, parseDateString } from "../utils/export";
import { FINANCIAL_YEARS } from "./HoardingTab";

interface StabilityTabProps {
  stabilityCertificates: StabilityCertificate[];
  agencies: Agency[];
  hoardings: Hoarding[];
  onAdd: (cert: Omit<StabilityCertificate, "id">) => Promise<boolean>;
  onEdit: (cert: StabilityCertificate) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

export default function StabilityTab({
  stabilityCertificates,
  agencies,
  hoardings,
  onAdd,
  onEdit,
  onDelete
}: StabilityTabProps) {
  // Local UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [selectedAgency, setSelectedAgency] = useState("");
  const [financialYear, setFinancialYear] = useState("2025-26");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [validTillDate, setValidTillDate] = useState("");
  const [engineerName, setEngineerName] = useState("");
  const [engineerMobile, setEngineerMobile] = useState("");
  const [remarks, setRemarks] = useState("");

  // Sort and Pagination
  const [sortField, setSortField] = useState<keyof StabilityCertificate>("valid_till_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dynamically filter hoarding locations according to selected Agency
  const filteredLocationOptions = useMemo(() => {
    if (!selectedAgency) return [];
    const matchedHoardings = hoardings.filter((h) => h.agency_name === selectedAgency);
    // Return unique locations
    const locations = matchedHoardings.map((h) => h.hoarding_location);
    return Array.from(new Set(locations));
  }, [selectedAgency, hoardings]);

  // Handle agency change inside form
  const handleAgencyChange = (agencyName: string) => {
    setSelectedAgency(agencyName);
    setSelectedLocation(""); // Reset location dropdown
  };

  const resetForm = () => {
    setSelectedAgency("");
    setFinancialYear("2025-26");
    setSelectedLocation("");
    setCertNumber("");
    setIssueDate("");
    setValidTillDate("");
    setEngineerName("");
    setEngineerMobile("");
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
    if (!selectedLocation) {
      setFormError("હોર્ડિંગ લોકેશન પસંદ કરવું ફરજિયાત છે. (Hoarding location is required)");
      return;
    }
    if (!certNumber.trim()) {
      setFormError("સર્ટિફિકેટ નંબર જરૂરી છે. (Certificate number is required)");
      return;
    }
    if (!issueDate || !validTillDate) {
      setFormError("ઇશ્યુ અને વેલિડિટી તારીખો જરૂરી છે. (Dates are required)");
      return;
    }

    // Phone validation (optional but nice)
    const phoneTrimmed = engineerMobile.trim();
    if (phoneTrimmed && !/^[0-9]{10}$/.test(phoneTrimmed)) {
      setFormError("એન્જિનિયરનો મોબાઈલ નંબર ૧૦ આંકડાનો હોવો જોઈએ. (Mobile number must be a valid 10-digit number)");
      return;
    }

    const dataPayload = {
      agency_name: selectedAgency,
      financial_year: financialYear,
      hoarding_location: selectedLocation,
      certificate_number: certNumber.trim().toUpperCase(),
      issue_date: issueDate,
      valid_till_date: validTillDate,
      engineer_name: engineerName.trim(),
      engineer_mobile_number: phoneTrimmed,
      remarks: remarks.trim()
    };

    if (isAdding) {
      const success = await onAdd(dataPayload);
      if (success) resetForm();
    } else if (editingId !== null) {
      const success = await onEdit({
        id: editingId,
        ...dataPayload
      });
      if (success) resetForm();
    }
  };

  const startEdit = (c: StabilityCertificate) => {
    setEditingId(c.id);
    setSelectedAgency(c.agency_name);
    setFinancialYear(c.financial_year || "2025-26");
    // Pre-populate location options since changing agency would clear it
    setSelectedLocation(c.hoarding_location);
    setCertNumber(c.certificate_number);
    setIssueDate(c.issue_date);
    setValidTillDate(c.valid_till_date);
    setEngineerName(c.engineer_name);
    setEngineerMobile(c.engineer_mobile_number);
    setRemarks(c.remarks);
    setIsAdding(false);
    setFormError("");
  };

  const handleDelete = async (id: number, certNum: string) => {
    const confirmDelete = window.confirm(
      `શું તમે ખરેખર સર્ટિફિકેટ નં "${certNum || id}" નો રેકોર્ડ ડીલીટ કરવા માંગો છો?\n(Are you sure you want to delete stability certificate "${certNum || id}"?)`
    );
    if (confirmDelete) {
      await onDelete(id);
    }
  };

  // Filter & Sort
  const filteredCerts = useMemo(() => {
    return stabilityCertificates
      .filter((c) => {
        const s = searchTerm.toLowerCase();
        return (
          c.agency_name.toLowerCase().includes(s) ||
          c.hoarding_location.toLowerCase().includes(s) ||
          c.certificate_number.toLowerCase().includes(s) ||
          (c.financial_year && c.financial_year.toLowerCase().includes(s)) ||
          c.engineer_name.toLowerCase().includes(s)
        );
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
  }, [stabilityCertificates, searchTerm, sortField, sortOrder]);

  const paginatedCerts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCerts.slice(start, start + itemsPerPage);
  }, [filteredCerts, currentPage]);

  const totalPages = Math.ceil(filteredCerts.length / itemsPerPage);

  const toggleSort = (field: keyof StabilityCertificate) => {
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
      filteredCerts,
      [
        "Certificate Number",
        "Agency Name",
        "Financial Year",
        "Hoarding Location",
        "Issue Date",
        "Valid Till Date",
        "Days Remaining",
        "Engineer Name",
        "Engineer Mobile",
        "Remarks"
      ],
      [
        "certificate_number",
        "agency_name",
        "financial_year",
        "hoarding_location",
        "issue_date",
        "valid_till_date",
        "valid_till_date", // We will handle this custom inside or just export raw date
        "engineer_name",
        "engineer_mobile_number",
        "remarks"
      ],
      "SMC_Sarthana_Stability_Certificates_Status"
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header toolbar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print-area">
        <div>
          <h2 className="text-lg font-bold text-slate-800">સ્ટ્રક્ચરલ સ્ટેબિલિટી સર્ટિફિકેટ વિગતો / Stability Certificate Information</h2>
          <p className="text-xs text-slate-500">હોર્ડિંગ સ્ટ્રક્ચર્સની મજબૂતીની સમયમર્યાદા, સિવિલ એન્જિનિયર વિગતો અને વેલિડિટી ટ્રેકિંગ</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setSelectedAgency(agencies[0]?.agency_name || "");
              setFinancialYear("2025-26");
              setSelectedLocation("");
              setCertNumber("");
              setIssueDate(new Date().toISOString().split("T")[0]);
              setValidTillDate("");
              setEngineerName("");
              setEngineerMobile("");
              setRemarks("");
              setFormError("");
            }}
            disabled={isAdding || editingId !== null}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" /> પ્રમાણપત્ર ઉમેરો (Add Certificate)
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

      {/* Adding/Editing form */}
      {(isAdding || editingId !== null) && (
        <div className="p-5 bg-orange-50/40 border-b border-slate-200 no-print-area">
          <h3 className="text-sm font-bold text-orange-950 mb-4">
            {isAdding ? "નવું સ્ટેબિલિટી સર્ટિફિકેટ ઉમેરો / Add Stability Certificate" : "સ્ટેબિલિટી પ્રમાણપત્ર સુધારો / Edit Stability Certificate"}
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  એજન્સી / Agency Name <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedAgency}
                  onChange={(e) => handleAgencyChange(e.target.value)}
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
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                >
                  {FINANCIAL_YEARS.map((fy) => (
                    <option key={fy} value={fy}>
                      {fy}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  હોર્ડિંગ લોકેશન / Hoarding Location <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  disabled={!selectedAgency}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
                >
                  <option value="">લોકેશન પસંદ કરો</option>
                  {filteredLocationOptions.map((loc, idx) => (
                    <option key={idx} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                {!selectedAgency && (
                  <p className="text-[10px] text-slate-400 mt-0.5">લોકેશન જોવા માટે પહેલા એજન્સી પસંદ કરો</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  પ્રમાણપત્ર નંબર / Certificate Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  placeholder="SMC/STAB/..."
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm uppercase focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ઇશ્યુ કર્યા તારીખ / Issue Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formatDateToYYYYMMDD(issueDate)}
                  onChange={(e) => setIssueDate(formatDateToDDMMYYYY(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  માનક તારીખ સુધી / Valid Till Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formatDateToYYYYMMDD(validTillDate)}
                  onChange={(e) => setValidTillDate(formatDateToDDMMYYYY(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  રજિસ્ટર્ડ એન્જીનીયર નામ / Engineer Name
                </label>
                <input
                  type="text"
                  value={engineerName}
                  onChange={(e) => setEngineerName(e.target.value)}
                  placeholder="મોટા અક્ષરોમાં નામ લખો"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  એન્જીનીયર મોબાઈલ નંબર / Engineer Mobile
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={engineerMobile}
                  onChange={(e) => setEngineerMobile(e.target.value)}
                  placeholder="૧૦ આંકડાનો મોબાઈલ"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                રિમાર્ક્સ / Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="પ્રમાણપત્ર સંદર્ભે વધારાની નોંધો"
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Save className="h-4 w-4" /> પ્રમાણપત્ર સેવ કરો (Save Certificate)
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

      {/* Instant search box */}
      <div className="p-3 border-b border-slate-200 bg-white flex items-center gap-2 no-print-area">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="એજન્સી, લોકેશન, સર્ટિફિકેટ નંબર કે એન્જીનીયર થી શોધો... (Instant Search)"
          className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 w-full max-w-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
          >
            સાફ કરો
          </button>
        )}
      </div>

      {/* Main Certificates list */}
      <div className="print-area">
        
        {/* Only visible in print layout */}
        <div className="hidden print:block mb-6 text-center border-b pb-4">
          <h1 className="text-xl font-bold">સુરત મહાનગરપાલિકા - નવા પૂર્વ (સરથાણા) ઝોન</h1>
          <h2 className="text-sm font-semibold text-slate-600 mt-1">હોર્ડિંગ સ્ટ્રક્ચરલ સ્ટેબિલિટી રજીસ્ટર / Stability Certificates Registry</h2>
          <p className="text-xs text-slate-500 mt-1">તારીખ: {new Date().toLocaleDateString("gu-IN")} | સમય: {new Date().toLocaleTimeString("gu-IN")}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
              <tr>
                <th className="p-2.5 w-12 text-center">Sr</th>
                <th
                  onClick={() => toggleSort("certificate_number")}
                  className="p-2.5 cursor-pointer select-none hover:bg-slate-200/60"
                >
                  સર્ટિફિકેટ નં / Certificate No {sortField === "certificate_number" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => toggleSort("agency_name")}
                  className="p-2.5 cursor-pointer select-none hover:bg-slate-200/60"
                >
                  એજન્સી નામ / Agency {sortField === "agency_name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="p-2.5">નાણાકીય વર્ષ / FY</th>
                <th className="p-2.5">હોર્ડિંગ સરનામું / Location</th>
                <th className="p-2.5 text-center">ઇશ્યુ તારીખ / Issue Date</th>
                <th
                  onClick={() => toggleSort("valid_till_date")}
                  className="p-2.5 text-center cursor-pointer select-none hover:bg-slate-200/60"
                >
                  વેલિડ તારીખ / Valid Till {sortField === "valid_till_date" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="p-2.5 text-center">બાકી દિવસો / Days Left</th>
                <th className="p-2.5">એન્જીનીયર વિગત / Certified Engineer</th>
                <th className="p-2.5">રિમાર્ક્સ / Remarks</th>
                <th className="p-2.5 no-print text-center w-20">ક્રિયાઓ / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCerts.length > 0 ? (
                paginatedCerts.map((c, idx) => {
                  const daysLeft = daysUntil(c.valid_till_date);
                  const isExpiring = daysLeft <= 45;
                  
                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors ${
                        isExpiring 
                          ? "bg-red-50 hover:bg-red-100/70" 
                          : "hover:bg-slate-50/50"
                      }`}
                    >
                      <td className="p-2.5 text-center font-mono text-slate-500">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="p-2.5 font-bold font-mono text-slate-800">{c.certificate_number}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{c.agency_name}</td>
                      <td className="p-2.5 font-mono text-slate-700">{c.financial_year || "2025-26"}</td>
                      <td className="p-2.5 text-slate-600 max-w-xs truncate" title={c.hoarding_location}>
                        {c.hoarding_location}
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-600">{c.issue_date}</td>
                      <td className="p-2.5 text-center font-bold font-mono text-slate-800">{c.valid_till_date}</td>
                      <td className="p-2.5 text-center">
                        {isExpiring ? (
                          <div className="flex items-center justify-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                            <span className="font-extrabold font-mono text-red-700">
                              {daysLeft < 0 ? "Expired" : `${daysLeft} days`}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                            <span className="font-semibold font-mono text-green-700">{daysLeft} days</span>
                          </div>
                        )}
                      </td>
                      <td className="p-2.5">
                        <p className="font-medium text-slate-800">{c.engineer_name || "-"}</p>
                        {c.engineer_mobile_number && (
                          <p className="text-[10px] text-slate-500 font-mono">📞 {c.engineer_mobile_number}</p>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-600 italic max-w-xs truncate" title={c.remarks}>
                        {c.remarks || "-"}
                      </td>
                      <td className="p-2.5 text-center no-print flex justify-center gap-0.5">
                        <button
                          onClick={() => startEdit(c)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                          title="Edit Certificate"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.certificate_number)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          title="Delete Certificate"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    કોઈ પ્રમાણપત્ર રેકોર્ડ મળ્યો નથી. (No stability certificate records found)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print-area text-xs">
            <span className="text-slate-500">
              કુલ <strong>{filteredCerts.length}</strong> માંથી એન્ટ્રી <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> થી <strong>{Math.min(currentPage * itemsPerPage, filteredCerts.length)}</strong>
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
