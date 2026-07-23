import React, { useState } from 'react';

interface PendingTabProps {
  hoardings: any[];
  quarterlyPayments: any[];
}

export default function PendingTab({ hoardings, quarterlyPayments }: PendingTabProps) {
  const [selectedFY, setSelectedFY] = useState<string>('2024-2025');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // નાણાકીય વર્ષના વિકલ્પો (Financial Years)
  const financialYears = ['2023-2024', '2024-2025', '2025-2026'];

  // ફિલ્ટર લૉજિક
  const filteredData = hoardings.filter((hoarding) => {
    const matchesSearch =
      hoarding.hoardingNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hoarding.agencyName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* હેડર અને ફિલ્ટર્સ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">બાકી લાયસન્સ ફી પત્રક (Pending Fees)</h2>
          <p className="text-sm text-slate-500">નાણાકીય વર્ષ અનુસાર બાકી લેણી રકમ અને ક્વાર્ટરલી સ્ટેટસ</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* નાણાકીય વર્ષ પસંદગી */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">નાણાકીય વર્ષ Select કરો</label>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {financialYears.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
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

      {/* ટેબલ સ્ટેટસ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <th className="p-4">હોર્ડિંગ નં</th>
                <th className="p-4">એજન્સીનું નામ</th>
                <th className="p-4">સાઈઝ / વિસ્તાર</th>
                <th className="p-4 text-center">Q1 (એપ્રિલ-જૂન)</th>
                <th className="p-4 text-center">Q2 (જુલાઈ-સપ્ટે)</th>
                <th className="p-4 text-center">Q3 (ઓક્ટો-ડિસે)</th>
                <th className="p-4 text-center">Q4 (જાન્યુ-માર્ચ)</th>
                <th className="p-4 text-right">કુલ બાકી રકમ (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    પસંદ કરેલ નાણાકીય વર્ષ ({selectedFY}) માટે કોઈ ડેટા મળ્યો નથી.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-semibold text-slate-800">{item.hoardingNo || 'N/A'}</td>
                    <td className="p-4 text-slate-600">{item.agencyName || 'N/A'}</td>
                    <td className="p-4 text-slate-600">{item.size || 'N/A'}</td>

                    {/* ક્વાર્ટરલી પેમેન્ટ સ્ટેટસ */}
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    </td>

                    <td className="p-4 text-right font-bold text-red-600">
                      ₹{item.yearlyFee ? item.yearlyFee.toLocaleString('en-IN') : '0'}
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