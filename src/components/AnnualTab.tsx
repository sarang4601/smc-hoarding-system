import React, { useState, useMemo } from 'react';

interface AnnualTabProps {
  agencies: any[];
  hoardings: any[];
  quarterlyPayments: any[];
}

// ચાલુ નાણાકીય વર્ષ (Current Financial Year) ઓટોમેટિક મેળવવાનું ફંક્શન
const getCurrentFinancialYear = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1 = Jan, 4 = April

  // જો એપ્રિલ (4) કે પછીનો મહિનો હોય તો
  if (month >= 4) {
    const nextYear = (year + 1).toString().slice(-2);
    return `${year}-${nextYear}`;
  } else {
    // જો જાન્યુઆરી થી માર્ચ હોય તો
    const prevYear = year - 1;
    const currentYearShort = year.toString().slice(-2);
    return `${prevYear}-${currentYearShort}`;
  }
};

export default function AnnualTab({ agencies, hoardings, quarterlyPayments }: AnnualTabProps) {
  // ઓટોમેટિક કરંટ FY સેટ કરો
  const [selectedFY, setSelectedFY] = useState<string>(getCurrentFinancialYear());
  const [searchTerm, setSearchTerm] = useState<string>('');

  // નાણાકીય વર્ષના ઓપ્શન્સ
  const financialYears = ['2026-27', '2025-26', '2024-25', '2023-24'];

  // સિલેક્ટ કરેલા FY અને Search Term મુજબ હોર્ડિંગ ડેટા ફિલ્ટર
  const filteredHoardings = useMemo(() => {
    return hoardings.filter((item) => {
      const matchesSearch =
        item.hoardingNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.agencyName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [hoardings, searchTerm]);

  return (
    <div className="space-y-6">
      {/* હેડર અને ફિલ્ટર બાર */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">વાર્ષિક માહિતી સારાંશ (Annual Summary)</h2>
          <p className="text-sm text-slate-500">
            ચાલુ વર્ષ: <span className="font-semibold text-blue-600">{selectedFY}</span> મુજબ વાર્ષિક લાયસન્સ ફીનો હિસાબ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* નાણાકીય વર્ષ સિલેક્ટર */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">નાણાકીય વર્ષ</label>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {financialYears.map((fy) => (
                <option key={fy} value={fy}>
                  {fy} {fy === getCurrentFinancialYear() ? '(ચાલુ વર્ષ)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* શોધ બોક્સ */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">શોધો (Search)</label>
            <input
              type="text"
              placeholder="હોર્ડિંગ નં / એજન્સી..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ડેટા ટેબલ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <th className="p-4">હોર્ડિંગ નં</th>
                <th className="p-4">એજન્સીનું નામ</th>
                <th className="p-4">સાઈઝ / લોકેશન</th>
                <th className="p-4 text-right">વાર્ષિક ફી (₹)</th>
                <th className="p-4 text-center">નાણાકીય વર્ષ</th>
                <th className="p-4 text-center">સ્ટેટસ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredHoardings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    નાણાકીય વર્ષ {selectedFY} માટે કોઈ ડેટા મળ્યો નથી.
                  </td>
                </tr>
              ) : (
                filteredHoardings.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-semibold text-slate-800">{item.hoardingNo || 'N/A'}</td>
                    <td className="p-4 text-slate-600">{item.agencyName || 'N/A'}</td>
                    <td className="p-4 text-slate-600">{item.size || item.location || 'N/A'}</td>
                    <td className="p-4 text-right font-bold text-slate-800">
                      ₹{item.yearlyFee ? item.yearlyFee.toLocaleString('en-IN') : '0'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {selectedFY}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                        Active
                      </span>
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
}git add .