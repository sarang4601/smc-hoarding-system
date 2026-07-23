import React, { useState, useMemo, useEffect } from "react";
import { Agency } from "../types";
import { Plus, Edit2, Trash2, Search, Printer, Download, X, Save } from "lucide-react";
import { exportToCSV } from "../utils/export";

interface AgencyTabProps {
  agencies: Agency[];
  onAdd: (agency: Omit<Agency, "id">) => Promise<boolean>;
  onEdit: (agency: Agency) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

export default function AgencyTab({ agencies, onAdd, onEdit, onDelete }: AgencyTabProps) {
  // Local UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form values
  const [agencyName, setAgencyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [formError, setFormError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort and Pagination
  const [sortField, setSortField] = useState<keyof Agency>("agency_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Validate GST Format (15 characters: 2 digits, 10 alphanumeric PAN, 1 digit, 1 char, 1 'Z', 1 char)
  const validateGST = (gst: string): boolean => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst.toUpperCase());
  };

  // Reset form
  const resetForm = () => {
    setAgencyName("");
    setGstNumber("");
    setFormError("");
    setIsAdding(false);
    setEditingId(null);
  };

  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = window.setTimeout(() => setFeedbackMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [feedbackMessage]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFeedbackMessage("");
    setIsSubmitting(true);

    try {
      const trimmedName = agencyName.trim();
      const trimmedGST = gstNumber.trim().toUpperCase();

      if (!trimmedName) {
        setFormError("એજન્સીનું નામ ફરજિયાત છે. (Agency name is required)");
        return;
      }

      if (trimmedGST && !validateGST(trimmedGST)) {
        setFormError("અમાન્ય GST નંબર ફોર્મેટ! (Invalid GST Number format, e.g. 24AACCT1024F1ZA)");
        return;
      }

      if (isAdding) {
        const duplicate = agencies.some(
          (a) => a.agency_name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (duplicate) {
          setFormError("એજન્સીનું નામ પહેલેથી જ અસ્તિત્વમાં છે! (Agency name already exists!)");
          return;
        }

        const success = await onAdd({ agency_name: trimmedName, gst_number: trimmedGST });
        if (success) {
          resetForm();
          setFeedbackMessage("એજન્સી સફળતાપૂર્વક ઉમેરાઈ. (Agency added successfully)");
        }
      } else if (editingId !== null) {
        const duplicate = agencies.some(
          (a) => a.id !== editingId && a.agency_name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (duplicate) {
          setFormError("અન્ય એજન્સીનું આ જ નામ છે! (Another agency has this name!)");
          return;
        }

        const success = await onEdit({ id: editingId, agency_name: trimmedName, gst_number: trimmedGST });
        if (success) {
          resetForm();
          setFeedbackMessage("એજન્સી સફળતાપૂર્વક સુધારાઈ. (Agency updated successfully)");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (agency: Agency) => {
    setEditingId(agency.id);
    setAgencyName(agency.agency_name);
    setGstNumber(agency.gst_number);
    setIsAdding(false);
    setFormError("");
    setFeedbackMessage("");
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmDelete = window.confirm(
      `શું તમે ખરેખર "${name}" એજન્સીને ડિલીટ કરવા માંગો છો?\n(Are you sure you want to delete agency "${name}"?)`
    );
    if (confirmDelete) {
      const success = await onDelete(id);
      if (success) {
        setFeedbackMessage(`"${name}" એજન્સી સફળતાપૂર્વક ડિલીટ થઈ. (Agency deleted successfully)`);
      }
    }
  };

  // Filter & Sort
  const filteredAgencies = useMemo(() => {
    return agencies
      .filter((a) => {
        const s = searchTerm.toLowerCase();
        return (
          a.agency_name.toLowerCase().includes(s) ||
          a.gst_number.toLowerCase().includes(s)
        );
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === "string") {
          return sortOrder === "asc"
            ? valA.localeCompare(valB as string)
            : (valB as string).localeCompare(valA);
        }
        return 0;
      });
  }, [agencies, searchTerm, sortField, sortOrder]);

  // Pagination Slice
  const paginatedAgencies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAgencies.slice(start, start + itemsPerPage);
  }, [filteredAgencies, currentPage]);

  const totalPages = Math.ceil(filteredAgencies.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [currentPage, totalPages]);

  const toggleSort = (field: keyof Agency) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportToCSV(
      filteredAgencies,
      ["Sr No", "Agency Name (એજન્સીનું નામ)", "GST Number (GST નંબર)"],
      ["id", "agency_name", "gst_number"],
      "SMC_Sarthana_Agencies_Report"
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header and Controls */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print-area">
        <div>
          <h2 className="text-lg font-bold text-slate-800">એજન્સીની માહિતી / Agency Information</h2>
          <p className="text-xs text-slate-500">રજિસ્ટર્ડ એજન્સીઓ અને તેમની GST વિગતો મેનેજ કરો</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setAgencyName("");
              setGstNumber("");
              setFormError("");
            }}
            disabled={isAdding || editingId !== null}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" /> એજન્સી ઉમેરો (Add)
          </button>
          
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Download className="h-4 w-4" /> Excel નિકાસ
          </button>
          
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Printer className="h-4 w-4" /> પ્રિન્ટ / PDF
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="mx-4 mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {feedbackMessage}
        </div>
      )}

      {/* Forms Segment */}
      {(isAdding || editingId !== null) && (
        <div className="p-4 bg-orange-50/50 border-b border-slate-200 no-print-area">
          <h3 className="text-sm font-bold text-orange-950 mb-3">
            {isAdding ? "નવી એજન્સી ઉમેરો / Add New Agency" : "એજન્સી સુધારો / Edit Agency"}
          </h3>
          
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                એજન્સીનું નામ / Agency Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="એજન્સીનું નામ લખો"
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST નંબર / GST Number <span className="text-slate-500 text-[11px]">(Optional)</span>
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="ઉદાહરણ: 24AACCT1024F1ZA"
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm uppercase focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Save className="h-3.5 w-3.5" /> {isSubmitting ? "સેવાઈ રહ્યું છે..." : "સેવ કરો (Save)"}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="py-1.5 px-3 bg-slate-300 hover:bg-slate-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-800 rounded text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <X className="h-3.5 w-3.5" /> રદ કરો (Cancel)
              </button>
            </div>
          </form>

          {formError && (
            <p className="mt-2 text-xs text-red-600 font-medium">{formError}</p>
          )}
        </div>
      )}

      {/* Search Input Bar */}
      <div className="p-3 border-b border-slate-200 bg-white flex items-center gap-2 no-print-area">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="એજન્સી નામ અથવા GST નંબરથી શોધો... (Instant Search)"
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

      {/* Printable Sheet View Container */}
      <div className="print-area">
        
        {/* Only visible in print layout */}
        <div className="hidden print:block mb-6 text-center border-b pb-4">
          <h1 className="text-xl font-bold">સુરત મહાનગરપાલિકા - નવા પૂર્વ (સરથાણા) ઝોન</h1>
          <h2 className="text-sm font-semibold text-slate-600 mt-1">નોંધાયેલ એજન્સી અહેવાલ / Registered Agencies Report</h2>
          <p className="text-xs text-slate-500 mt-1">તારીખ: {new Date().toLocaleDateString("gu-IN")} | સમય: {new Date().toLocaleTimeString("gu-IN")}</p>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
              <tr>
                <th className="p-3 w-16 text-center">Sr No / ક્રમ</th>
                <th
                  onClick={() => toggleSort("agency_name")}
                  className="p-3 cursor-pointer select-none hover:bg-slate-200/60"
                >
                  એજન્સીનું નામ / Agency Name {sortField === "agency_name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => toggleSort("gst_number")}
                  className="p-3 cursor-pointer select-none hover:bg-slate-200/60"
                >
                  GST નંબર / GST Number {sortField === "gst_number" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="p-3 w-28 text-center no-print">ક્રિયાઓ / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedAgencies.length > 0 ? (
                paginatedAgencies.map((agency, index) => (
                  <tr key={agency.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-center text-slate-500 font-mono">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{agency.agency_name}</td>
                    <td className="p-3 font-mono text-slate-600 uppercase tracking-wider">{agency.gst_number}</td>
                    <td className="p-3 text-center no-print flex justify-center gap-1">
                      <button
                        onClick={() => startEdit(agency)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title="Edit Agency"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(agency.id, agency.agency_name)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Delete Agency"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    કોઈ એજન્સી મળી નથી. (No agencies registered)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print-area text-xs">
            <span className="text-slate-500">
              કુલ <strong>{filteredAgencies.length}</strong> માંથી એન્ટ્રી <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> થી <strong>{Math.min(currentPage * itemsPerPage, filteredAgencies.length)}</strong>
            </span>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 disabled:opacity-40 cursor-pointer"
              >
                પાછલું (Prev)
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
                આગળ (Next)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
