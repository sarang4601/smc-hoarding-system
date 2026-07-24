import React, { useState, useMemo } from "react";
import { Agency, Hoarding, TPScheme } from "../types";
import { Plus, Edit2, Trash2, Search, Printer, Download, X, Save, FileText, Upload, RotateCcw } from "lucide-react";
import { exportToCSV, roundup, getFinancialYearFromDate, formatDateToDDMMYYYY, formatDateToYYYYMMDD, parseDateString } from "../utils/export";

function matchTPScheme(input: string, schemes: TPScheme[]) {
  const normalized = input.trim().toUpperCase();
  if (!normalized) return undefined;
  return schemes.find((scheme) => {
    const code = scheme.tp_scheme_code.trim().toUpperCase();
    const name = scheme.tp_scheme_name.trim().toUpperCase();
    const composite = `${code} - ${name}`.toUpperCase();
    return code === normalized || name === normalized || composite.includes(normalized) || name.includes(normalized);
  });
}

export const HOARDING_TYPES = [
  "Single Side Hoarding",
  "Double Side Hoarding",
  "Computerized Hoarding"
];

export const FINANCIAL_YEARS = [
  "2024-25",
  "2025-26",
  "2026-27",
  "2027-28",
  "2028-29",
  "2029-30",
  "2030-31",
  "2031-32",
  "2032-33",
  "2033-34"
];

interface HoardingTabProps {
  hoardings: Hoarding[];
  agencies: Agency[];
  tpSchemes: TPScheme[];
  onAdd: (hoarding: Omit<Hoarding, "id" | "area" | "annual_license_fee" | "quarterly_license_fee">) => Promise<boolean>;
  onEdit: (hoarding: Hoarding) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

export default function HoardingTab({ hoardings, agencies, tpSchemes, onAdd, onEdit, onDelete }: HoardingTabProps) {
  // Local UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [selectedAgency, setSelectedAgency] = useState("");
  const [tpNumber, setTpNumber] = useState("");
  const [selectedTPSchemeId, setSelectedTPSchemeId] = useState<number | null>(null);
  const [finalPlotNo, setFinalPlotNo] = useState("");
  const [hoardingType, setHoardingType] = useState("Single Side Hoarding");
  const [financialYear, setFinancialYear] = useState("2025-26");
  const [location, setLocation] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [permissionDate, setPermissionDate] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [rate, setRate] = useState("");
  const [docBase64, setDocBase64] = useState("");
  const [docName, setDocName] = useState("");

  // Administrative Unlock Mode for Financial Year Override
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // Cancellation Management States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancellationDate, setCancellationDate] = useState(new Date().toISOString().split("T")[0]);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelledBy, setCancelledBy] = useState("SMC Admin (સરકારી વહીવટકર્તા)");
  const [cancelError, setCancelError] = useState("");

  // Sort and Pagination
  const [sortField, setSortField] = useState<keyof Hoarding>("agency_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Real-time automatic Financial Year calculation when permission date changes
  React.useEffect(() => {
    if (permissionDate) {
      const fy = getFinancialYearFromDate(permissionDate);
      setFinancialYear(fy);
    }
  }, [permissionDate]);

  // Real-time calculations
  const calculatedArea = useMemo(() => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return 0;
    return parseFloat((w * h).toFixed(4));
  }, [width, height]);

  const calculatedAnnualFee = useMemo(() => {
    const r = parseFloat(rate);
    if (calculatedArea === 0 || isNaN(r) || r < 0) return 0;
    const isComputerized = hoardingType === "Computerized Hoarding" || hoardingType === "કોમ્પ્યુટરાઈઝ્ડ હોર્ડિંગ";
    const multiplier = isComputerized ? 2 : 1;
    return roundup(calculatedArea * r * multiplier);
  }, [calculatedArea, rate, hoardingType]);

  const calculatedQuarterlyFee = useMemo(() => {
    if (calculatedAnnualFee === 0) return 0;
    return roundup(calculatedAnnualFee / 4);
  }, [calculatedAnnualFee]);

  // Handle Document File Upload (PDF, Word, Images, etc.)
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setDocBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setSelectedAgency("");
    setTpNumber("");
    setSelectedTPSchemeId(null);
    setFinalPlotNo("");
    setHoardingType("Single Side Hoarding");
    setFinancialYear("2025-26");
    setLocation("");
    setOwnerName("");
    setPermissionDate("");
    setWidth("");
    setHeight("");
    setRate("");
    setDocBase64("");
    setDocName("");
    setFormError("");
    setIsAdding(false);
    setEditingId(null);
  };

  // Single clean handleSave function implementation
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedAgency) {
      setFormError("એજન્સી પસંદ કરવી ફરજિયાત છે. (Agency selection is required)");
      return;
    }
    
    if (!finalPlotNo.trim()) {
      setFormError("ફાઇનલ પ્લોટ નંબર / આર.એસ. નંબર જરૂરી છે. (Final Plot No is required)");
      return;
    }
    if (!hoardingType) {
      setFormError("હોર્ડિંગ પ્રકાર જરૂરી છે. (Hoarding Type is required)");
      return;
    }
    if (!financialYear) {
      setFormError("નાણાકીય વર્ષ જરૂરી છે. (Financial Year is required)");
      return;
    }
    if (!location.trim()) {
      setFormError("લોકેશન જરૂરી છે. (Location is required)");
      return;
    }

    const w = parseFloat(width);
    const h = parseFloat(height);
    const r = parseFloat(rate);

    if (isNaN(w) || isNaN(h) || isNaN(r)) {
      setFormError("પહોળાઈ, ઊંચાઈ અને દર માત્ર સંખ્યાત્મક મૂલ્યો હોવા જોઈએ. (Width, Height, Rate must be numeric.)");
      return;
    }

    if (w <= 0 || h <= 0 || r < 0) {
      setFormError("નકારાત્મક કિંમતો માન્ય નથી. પહોળાઈ અને ઊંચાઈ શૂન્યથી મોટી હોવી જોઈએ. (Negative values not allowed.)");
      return;
    }

    const targetDate = permissionDate || new Date().toISOString().split("T")[0];
    let matchedScheme = null;
    if (tpNumber.trim()) {
      matchedScheme = selectedTPSchemeId !== null 
        ? tpSchemes.find((scheme) => scheme.id === selectedTPSchemeId) 
        : matchTPScheme(tpNumber.trim(), tpSchemes);
    }

    const dataPayload = {
      agency_name: selectedAgency,
      tp_scheme_id: matchedScheme ? matchedScheme.id : undefined,
      tp_scheme_code: matchedScheme ? matchedScheme.tp_scheme_code : "",
      tp_scheme_name: matchedScheme ? matchedScheme.tp_scheme_name : "",
      tp_number: tpNumber.trim() ? (matchedScheme ? matchedScheme.tp_scheme_code : tpNumber.trim()) : "",
      final_plot_no: finalPlotNo.trim(),
      hoarding_type: hoardingType,
      financial_year: financialYear,
      hoarding_location: location.trim(),
      property_owner_name: ownerName.trim(),
      permission_date: targetDate,
      width: w,
      height: h,
      rate: r,
      document: docBase64 || undefined,
      document_name: docName || undefined
    };

    if (isAdding) {
      const success = await onAdd(dataPayload);
      if (success) resetForm();
    } else if (editingId !== null) {
      const success = await onEdit({
        id: editingId,
        ...dataPayload,
        area: calculatedArea,
        annual_license_fee: calculatedAnnualFee,
        quarterly_license_fee: calculatedQuarterlyFee
      });
      if (success) resetForm();
    }
  };

  const startEdit = (h: Hoarding) => {
    setEditingId(h.id);
    setSelectedAgency(h.agency_name);
    setTpNumber(h.tp_number);
    setSelectedTPSchemeId(h.tp_scheme_id ?? null);
    setFinalPlotNo(h.final_plot_no);
    setHoardingType(h.hoarding_type);
    setFinancialYear(h.financial_year);
    setLocation(h.hoarding_location);
    setOwnerName(h.property_owner_name);
    setPermissionDate(h.permission_date);
    setWidth(h.width.toString());
    setHeight(h.height.toString());
    setRate(h.rate.toString());
    setDocBase64(h.document || "");
    setDocName(h.document_name || "");
    setIsAdding(false);
    setFormError("");
  };

  const openCancellationModal = (id: number) => {
    setCancellingId(id);
    setCancellationDate(formatDateToDDMMYYYY(new Date().toISOString().split("T")[0]));
    setCancellationReason("");
    setCancelledBy("SMC Admin (સરકારી વહીવટકર્તા)");
    setCancelError("");
    setIsCancelModalOpen(true);
  };

  const handleSaveCancellation = async () => {
    if (!cancellingId) return;
    const hoarding = hoardings.find((h) => h.id === cancellingId);
    if (!hoarding) return;

    const cDateObj = parseDateString(cancellationDate);
    const pDateObj = parseDateString(hoarding.permission_date);
    if (cDateObj && pDateObj && cDateObj < pDateObj) {
      setCancelError(`ભૂલ: રદ કરવાની તારીખ મંજૂરી તારીખ (${hoarding.permission_date}) થી પહેલાં હોઈ શકે નહીં. (Cancellation Date cannot be before Permission Date)`);
      return;
    }

    const updatedHoarding: Hoarding = {
      ...hoarding,
      status: "Cancelled",
      cancellation_date: cancellationDate,
      cancellation_reason: cancellationReason.trim() || "પરવાનગી રદ કરવામાં આવી (Permission Cancelled)",
      cancelled_by: cancelledBy.trim() || "SMC Admin",
      cancellation_financial_year: getFinancialYearFromDate(cancellationDate)
    };
    
    const success = await onEdit(updatedHoarding);
    if (success) {
      setIsCancelModalOpen(false);
      setCancellingId(null);
      setCancelError("");
    }
  };

  const handleRestoreHoarding = async (h: Hoarding) => {
    const confirmRestore = window.confirm(
      `શું તમે ખરેખર "${h.agency_name}" ના આ હોર્ડિંગને ફરીથી સક્રિય (Active) કરવા માંગો છો?\n(Are you sure you want to restore and activate this hoarding record?)`
    );
    if (!confirmRestore) return;

    const restoredHoarding: Hoarding = {
      ...h,
      status: "Active",
      cancellation_date: "",
      cancellation_reason: "",
      cancelled_by: "",
      cancellation_financial_year: ""
    };
    await onEdit(restoredHoarding);
  };
    
  // Filter & Sort
  const filteredHoardings = useMemo(() => {
    return hoardings
      .filter((h) => {
        const s = searchTerm.toLowerCase();
        return (
          h.agency_name.toLowerCase().includes(s) ||
          h.tp_number.toLowerCase().includes(s) ||
          h.final_plot_no.toLowerCase().includes(s) ||
          h.hoarding_type.toLowerCase().includes(s) ||
          h.financial_year.toLowerCase().includes(s) ||
          h.hoarding_location.toLowerCase().includes(s) ||
          (h.property_owner_name && h.property_owner_name.toLowerCase().includes(s))
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
  }, [hoardings, searchTerm, sortField, sortOrder]);

  const paginatedHoardings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHoardings.slice(start, start + itemsPerPage);
  }, [filteredHoardings, currentPage]);

  const totalPages = Math.ceil(filteredHoardings.length / itemsPerPage);

  const toggleSort = (field: keyof Hoarding) => {
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
      filteredHoardings,
      [
        "Agency Name",
        "TP Number",
        "Final Plot No / R.S. No",
        "Hoarding Type",
        "Financial Year",
        "Location",
        "Owner Name",
        "Permission Date",
        "Width (m)",
        "Height (m)",
        "Area (sq.m)",
        "Rate (INR)",
        "Annual Fee (INR)",
        "Quarterly Fee (INR)"
      ],
      [
        "agency_name",
        "tp_number",
        "final_plot_no",
        "hoarding_type",
        "financial_year",
        "hoarding_location",
        "property_owner_name",
        "permission_date",
        "width",
        "height",
        "area",
        "rate",
        "annual_license_fee",
        "quarterly_license_fee"
      ],
      "SMC_Sarthana_Hoardings_Inventory"
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header and Action Controls */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print-area">
        <div>
          <h2 className="text-lg font-bold text-slate-800">હોર્ડિંગ્સની માહિતી / Hoardings Information</h2>
          <p className="text-xs text-slate-500">ઝોનમાં રજિસ્ટર્ડ તમામ હોર્ડિંગ સ્ટ્રક્ચર્સ, સાઈઝ અને એજન્સી વિગતો</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setSelectedAgency(agencies[0]?.agency_name || "");
              setTpNumber("");
              setFinalPlotNo("");
              setHoardingType("Single Side Hoarding");
              setFinancialYear("2025-26");
              setLocation("");
              setOwnerName("");
              setPermissionDate(new Date().toISOString().split("T")[0]);
              setWidth("");
              setHeight("");
              setRate("");
              setDocBase64("");
              setDocName("");
              setSelectedTPSchemeId(null);
              setFormError("");
            }}
            disabled={isAdding || editingId !== null}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" /> હોર્ડિંગ ઉમેરો (Add)
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

      {/* Adding / Editing Form Section */}
      {(isAdding || editingId !== null) && (
        <div className="p-5 bg-orange-50/40 border-b border-slate-200 no-print-area">
          <h3 className="text-sm font-bold text-orange-950 mb-4">
            {isAdding ? "નવું હોર્ડિંગ નોંધણી / Add New Hoarding Structure" : "હોર્ડિંગ સ્ટ્રક્ચર વિગતો સુધારો / Edit Hoarding"}
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
                  ટી.પી. યોજના વિકલ્પ / TP Scheme <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="tp-scheme-options"
                  value={tpNumber}
                  onChange={(e) => {
                  const value = e.target.value;
                  setTpNumber(value);
                  const match = matchTPScheme(value, tpSchemes);
                    setSelectedTPSchemeId(match ? match.id : null);
                  }}
                    placeholder="TP-18 - ટી.પી. સ્કીમ નં. ૧૮ ..."
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <datalist id="tp-scheme-options">
                  {tpSchemes.map((scheme) => (
                    <option
                      key={scheme.id}
                      value={`${scheme.tp_scheme_code} - ${scheme.tp_scheme_name}`}
                    />
                  ))}
                </datalist>
                {selectedTPSchemeId !== null && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    પસંદ કરેલ યોજના: {tpSchemes.find((s) => s.id === selectedTPSchemeId)?.tp_scheme_name || "-"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ફાઇનલ પ્લોટ / આર.એસ. નંબર / Final Plot No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={finalPlotNo}
                  onChange={(e) => setFinalPlotNo(e.target.value)}
                  placeholder="उदा. 45/A"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  પરમિશન તારીખ / Permission Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formatDateToYYYYMMDD(permissionDate)}
                  onChange={(e) => setPermissionDate(formatDateToDDMMYYYY(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  હોર્ડિંગ પ્રકાર / Hoarding Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={hoardingType}
                  onChange={(e) => setHoardingType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {HOARDING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>નાણાકીય વર્ષ / Financial Year <span className="text-red-500">*</span></span>
                  <button
                    type="button"
                    onClick={() => setIsAdminUnlocked(!isAdminUnlocked)}
                    className="text-[10px] text-orange-600 hover:underline flex items-center gap-0.5 cursor-pointer font-sans"
                  >
                    {isAdminUnlocked ? "🔒 લોક કરો (Lock)" : "🔓 એડમિન અનલોક (Admin Unlock)"}
                  </button>
                </label>
                <select
                  required
                  disabled={!isAdminUnlocked}
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className={`w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono transition-colors ${
                    !isAdminUnlocked ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white text-slate-900"
                  }`}
                >
                  {FINANCIAL_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 mt-0.5 font-sans">મંજૂરી તારીખ મુજબ ઓટો-સિલેક્ટ થાય છે</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  જમીન માલિકનું નામ / Property Owner Name
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="SMC અથવા ખાનગી માલિકનું નામ"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  હોર્ડિંગ લોકેશન / Hoarding Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="સંપૂર્ણ સરનામું અથવા લોકેશન"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 items-center bg-white p-3 rounded border border-slate-200 font-mono">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                  પહોળાઈ / Width (m) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="મીટર"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                  ઊંચાઈ / Height (m) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="મીટર"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 font-sans">
                  ક્ષેત્રફળ / Area (Sq.m)
                </label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700">
                  {calculatedArea > 0 ? calculatedArea.toFixed(4) : "0.0000"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                  દર / Rate per Sq.m <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="INR"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 font-sans">
                  વાર્ષિક ફી / Annual Fee
                </label>
                <div className="w-full bg-amber-50 border border-amber-200 rounded px-2 py-1 text-xs font-bold text-amber-900">
                  ₹ {calculatedAnnualFee}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 font-sans">
                  ત્રિમાસિક ફી / Quarterly Fee
                </label>
                <div className="w-full bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-xs font-bold text-emerald-900">
                  ₹ {calculatedQuarterlyFee}
                </div>
              </div>
            </div>

            {/* Document Upload Row */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <FileText className="h-4 w-4 text-orange-600" /> મંજૂરી ઓર્ડર / સ્ટ્રક્ચર દસ્તાવેજ અપલોડ (Doc/PDF/Image)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-xs text-slate-700 font-semibold cursor-pointer border-dashed">
                    <Upload className="h-3.5 w-3.5 text-slate-500" /> ફાઇલ પસંદ કરો (Select)
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      onChange={handleDocUpload}
                      className="hidden"
                    />
                  </label>
                  {docBase64 ? (
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[300px]" title={docName}>
                        📎 {docName || "દસ્તાવેજ અપલોડ કરેલ છે"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDocBase64("");
                          setDocName("");
                        }}
                        className="text-xs text-left text-red-600 hover:underline font-semibold cursor-pointer"
                      >
                        હટાવો (Remove)
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-sans">કોઈ દસ્તાવેજ અપલોડ કરેલ નથી</span>
                  )}
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-semibold">
                {formError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Save className="h-4 w-4" /> સેવ કરો (Save Hoarding)
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                રદ કરો (Cancel)
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}