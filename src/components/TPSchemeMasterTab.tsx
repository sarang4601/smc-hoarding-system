import React, { useMemo, useState } from "react";
import { TPScheme } from "../types";
import { Plus, Edit2, Trash2, RefreshCcw, Download, FileSpreadsheet, Filter, Search, ShieldCheck } from "lucide-react";

interface TPSchemeMasterTabProps {
  tpSchemes: any[];
  onAdd: (scheme: any) => Promise<boolean>;
  onEdit: (scheme: any) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onRestore: (id: number) => Promise<boolean>;
}

export default function TPSchemeMasterTab({ tpSchemes, onAdd, onEdit, onDelete, onRestore }: TPSchemeMasterTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tpSchemeCode, setTpSchemeCode] = useState("");
  const [tpSchemeName, setTpSchemeName] = useState("");
  const [zoneName, setZoneName] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [formError, setFormError] = useState("");

  const activeSchemes = useMemo(() => {
    return tpSchemes
      .filter((scheme) => {
        if (statusFilter !== "All" && scheme.status !== statusFilter) return false;
        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;

        const code = (scheme.tp_scheme_code || scheme.tpCode || scheme.code || "").toLowerCase();
        const name = (scheme.tp_scheme_name || scheme.tpName || scheme.name || "").toLowerCase();
        const zone = (scheme.zone_name || scheme.zoneName || scheme.zone || "").toLowerCase();

        return code.includes(term) || name.includes(term) || zone.includes(term);
      })
      .sort((a, b) => {
        const orderA = a.display_order || a.displayOrder || 0;
        const orderB = b.display_order || b.displayOrder || 0;
        return orderA - orderB;
      });
  }, [tpSchemes, searchTerm, statusFilter]);

  const resetForm = () => {
    setEditingId(null);
    setTpSchemeCode("");
    setTpSchemeName("");
    setZoneName("");
    setStatus("Active");
    setDisplayOrder(1);
    setFormError("");
  };

  const beginEdit = (scheme: any) => {
    setEditingId(scheme.id);
    setTpSchemeCode(scheme.tp_scheme_code || scheme.tpCode || scheme.code || "");
    setTpSchemeName(scheme.tp_scheme_name || scheme.tpName || scheme.name || "");
    setZoneName(scheme.zone_name || scheme.zoneName || scheme.zone || "");
    setStatus(scheme.status || "Active");
    setDisplayOrder(scheme.display_order || scheme.displayOrder || 1);
    setFormError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!tpSchemeCode.trim() || !tpSchemeName.trim() || !zoneName.trim()) {
      setFormError("સ્થિતિ, નામ અને ઝોન જરૂરી છે. (Code, Name and Zone are required.)");
      return;
    }

    const payload = {
      // બંને ફોર્મેટમાં સેટ કરો જેથી App.tsx અને આ કમ્પોનન્ટ બંનેમાં સપોર્ટ કરે
      tp_scheme_code: tpSchemeCode.trim(),
      tpCode: tpSchemeCode.trim(),
      code: tpSchemeCode.trim(),

      tp_scheme_name: tpSchemeName.trim(),
      tpName: tpSchemeName.trim(),
      name: tpSchemeName.trim(),

      zone_name: zoneName.trim(),
      zoneName: zoneName.trim(),
      zone: zoneName.trim(),

      status,
      display_order: displayOrder || 1,
      displayOrder: displayOrder || 1,
      created_by: "system",
      updated_by: "system"
    };

    const success = editingId !== null
      ? await onEdit({ id: editingId, ...payload, created_at: "", updated_at: "", deleted_at: "" })
      : await onAdd(payload);

    if (success) {
      resetForm();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print-area">
        <div>
          <h2 className="text-lg font-bold text-slate-800">TP યોજના માસ્ટર / TP Scheme Master</h2>
          <p className="text-xs text-slate-500">TP યોજના નામો, કોડ અને ઝોન માટે કેન્દ્રિય માસ્ટર સંગ્રહ.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={resetForm}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <RefreshCcw className="h-4 w-4" /> નવું ટેમ્પલેટ રીસેટ
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Download className="h-4 w-4" /> Printable Report
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-3">TP યોજના શોધો અને ફિલ્ટર કરો</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ટિપ્પણી શોધો (કોડ, નામ, ઝોન)..."
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "All" | "Active" | "Inactive")}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="All">બધા સ્ટેટસ (All Status)</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-3">નવીં TP યોજના ઉમેરો / સુધારો</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">TP કોડ / TP Scheme Code</label>
                  <input
                    type="text"
                    value={tpSchemeCode}
                    onChange={(e) => setTpSchemeCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="TP-18"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ઝોન નામ / Zone Name</label>
                  <input
                    type="text"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="મોટા વરાછા"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">TP યોજના નામ / TP Scheme Name</label>
                <textarea
                  value={tpSchemeName}
                  onChange={(e) => setTpSchemeName(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="ટી.પી. સ્કીમ નં. ૧૮ (મોટા વરાછા)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">સ્ટેટસ / Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    min={1}
                    onChange={(e) => setDisplayOrder(Number(e.target.value || 1))}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {formError && <p className="text-xs text-red-600">{formError}</p>}

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold transition-colors"
                >
                  {editingId !== null ? "સુધારો / Update" : "ઉમેરો / Add"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-semibold transition-colors"
                >
                  રદ કરો / Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2">ક્રમ</th>
                <th className="px-3 py-2">TP કોડ</th>
                <th className="px-3 py-2">TP યોજના નામ</th>
                <th className="px-3 py-2">ઝોન</th>
                <th className="px-3 py-2">સ્થિતિ</th>
                <th className="px-3 py-2">ડિસ્પ્લે ઓર્ડર</th>
                <th className="px-3 py-2">ક્રિયાઓ</th>
              </tr>
            </thead>
            <tbody>
              {activeSchemes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-slate-500">
                    કોઈ TP યોજના મળી નથી.
                  </td>
                </tr>
              ) : (
                activeSchemes.map((scheme, index) => (
                  <tr key={scheme.id} className={scheme.deleted_at ? "bg-red-50" : "bg-white"}>
                    <td className="px-3 py-2 font-mono">{index + 1}</td>
                    <td className="px-3 py-2 font-mono">
                      {scheme.tp_scheme_code || scheme.tpCode || scheme.code}
                    </td>
                    <td className="px-3 py-2">
                      {scheme.tp_scheme_name || scheme.tpName || scheme.name}
                    </td>
                    <td className="px-3 py-2">
                      {scheme.zone_name || scheme.zoneName || scheme.zone}
                    </td>
                    <td className="px-3 py-2">{scheme.status}</td>
                    <td className="px-3 py-2">
                      {scheme.display_order || scheme.displayOrder}
                    </td>
                    <td className="px-3 py-2 space-x-1">
                      <button
                        onClick={() => beginEdit(scheme)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px]"
                      >
                        <Edit2 className="inline h-3.5 w-3.5 mr-1" />
                        Edit
                      </button>
                      {scheme.deleted_at ? (
                        <button
                          onClick={() => onRestore(scheme.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px]"
                        >
                          <RefreshCcw className="inline h-3.5 w-3.5 mr-1" />
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => onDelete(scheme.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px]"
                        >
                          <Trash2 className="inline h-3.5 w-3.5 mr-1" />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}