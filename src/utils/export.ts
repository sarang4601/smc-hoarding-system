// Calculations & Export Utilities for SMC Hoarding System

/**
 * Rounds up any number to the nearest integer.
 * e.g., 45.01 -> 46
 */
export function roundup(value: number): number {
  return Math.ceil(value);
}

/**
 * Formats a number in Indian Rupees format (INR)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Parses any date string (including DD/MM/YYYY or YYYY-MM-DD) into a valid Date object.
 */
export function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;
  return null;
}

/**
 * Formats a Date object or standard date string to DD/MM/YYYY.
 */
export function formatDateToDDMMYYYY(dateInput: Date | string | null): string {
  if (!dateInput) return "";
  let dateObj: Date | null = null;
  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else {
    dateObj = parseDateString(dateInput);
  }
  if (!dateObj) return "";
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a DD/MM/YYYY or similar date string to YYYY-MM-DD for standard calendar pickers.
 */
export function formatDateToYYYYMMDD(dateStr: string): string {
  if (!dateStr) return "";
  const dateObj = parseDateString(dateStr);
  if (!dateObj) return "";
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Calculates number of days between today and target date.
 * Returns negative if the date has passed.
 */
export function daysUntil(targetDateStr: string): number {
  const target = parseDateString(targetDateStr);
  if (!target) return 0;
  const today = new Date();
  
  // Set times to midnight to calculate pure days
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a certificate is expiring within 45 days (or is already expired)
 */
export function isExpiringSoon(targetDateStr: string): boolean {
  if (!targetDateStr) return false;
  const days = daysUntil(targetDateStr);
  return days <= 45;
}

/**
 * Automatically determines and selects the correct Financial Year.
 * Financial Year starts from 01 April and ends on 31 March.
 */
export function getFinancialYearFromDate(dateStr: string): string {
  if (!dateStr) return "2025-26";
  const date = parseDateString(dateStr);
  if (!date || isNaN(date.getTime())) return "2025-26";
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (Jan is 0, April is 3)
  if (month >= 3) { // April to Dec
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else { // Jan to March
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

/**
 * Calculates remaining months in the current quarter from the permission date.
 */
export function getRemainingMonthsInQuarter(dateStr: string): number {
  if (!dateStr) return 3;
  const date = parseDateString(dateStr);
  if (!date || isNaN(date.getTime())) return 3;
  const month = date.getMonth(); // 0-indexed
  return 3 - (month % 3);
}

/**
 * Calculates proportionate first quarter license fee.
 * Monthly License Fee = Annual License Fee ÷ 12
 * Quarter License Fee = Monthly License Fee × Remaining Months
 * Always use ROUNDUP (CEILING).
 */
export function calculateProportionateFirstQuarterFee(annualFee: number, dateStr: string): number {
  if (!annualFee) return 0;
  const remainingMonths = getRemainingMonthsInQuarter(dateStr);
  const monthlyFee = annualFee / 12;
  return Math.ceil(monthlyFee * remainingMonths);
}

/**
 * Exports data to CSV with BOM for perfect Gujarati Unicode rendering in Excel
 */
export function exportToCSV(data: any[], headers: string[], keys: string[], filename: string) {
  // Add UTF-8 BOM so Excel opens Gujarati characters correctly
  let csvContent = "\uFEFF";
  
  // Create headers row
  csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";
  
  // Create data rows
  data.forEach(item => {
    const row = keys.map(key => {
      let val = item[key];
      if (val === undefined || val === null) {
        val = "";
      } else if (typeof val === "number") {
        val = val.toString();
      } else {
        val = val.toString().replace(/"/g, '""');
      }
      return `"${val}"`;
    });
    csvContent += row.join(",") + "\n";
  });
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parses the start year of a financial year string like "2025-26" -> 2025.
 */
export function getFYStartYear(fy: string): number {
  if (!fy) return 0;
  const parts = fy.split("-");
  return parseInt(parts[0], 10) || 0;
}

/**
 * Determines the status of a hoarding in a selected target Financial Year.
 * Returns "Hidden" if the hoarding was not permitted yet.
 * Returns "Cancelled" if the hoarding was cancelled on or before the target FY.
 * Returns "Active" otherwise.
 */
export function getHoardingStatusInFY(h: { financial_year?: string; permission_date: string; status?: string; cancellation_date?: string }, targetFY: string): "Active" | "Cancelled" | "Hidden" {
  const regFY = h.financial_year || getFinancialYearFromDate(h.permission_date);
  const regStart = getFYStartYear(regFY);
  const targetStart = getFYStartYear(targetFY);

  // A hoarding should appear only from the Financial Year in which its Permission Date falls
  if (targetStart < regStart) {
    return "Hidden";
  }

  if (h.status === "Cancelled" && h.cancellation_date) {
    const cancelFY = getFinancialYearFromDate(h.cancellation_date);
    const cancelStart = getFYStartYear(cancelFY);
    if (targetStart === cancelStart) {
      return "Cancelled";
    }
    if (targetStart > cancelStart) {
      return "Hidden";
    }
  }

  return "Active";
}

/**
 * Calculates the expected annual and quarterly license fees for a hoarding in a target Financial Year.
 * Returns 0 if the hoarding is hidden or if it is cancelled and we are past the cancellation Financial Year.
 */
export function getHoardingExpectedFeesInFY(h: { financial_year?: string; permission_date: string; status?: string; cancellation_date?: string; annual_license_fee: number; quarterly_license_fee: number }, targetFY: string): { annual: number; quarterly: number } {
  const status = getHoardingStatusInFY(h, targetFY);
  if (status === "Hidden") {
    return { annual: 0, quarterly: 0 };
  }

  // If the target year is strictly after the cancellation year, do not include in demand
  if (h.status === "Cancelled" && h.cancellation_date) {
    const cancelFY = getFinancialYearFromDate(h.cancellation_date);
    const cancelStart = getFYStartYear(cancelFY);
    const targetStart = getFYStartYear(targetFY);
    if (targetStart > cancelStart) {
      return { annual: 0, quarterly: 0 };
    }
  }

  return {
    annual: h.annual_license_fee || 0,
    quarterly: h.quarterly_license_fee || 0
  };
}

/**
 * Generates the quarter selection options dynamically for a given Financial Year (e.g. "2025-26")
 */
export function getQuarterOptionsForFY(fy: string): string[] {
  if (!fy) return [];
  const startYear = parseInt(fy.split("-")[0]);
  if (isNaN(startYear)) return [];
  return [
    `Q1 (April-June) ${startYear}`,
    `Q2 (July-Sept) ${startYear}`,
    `Q3 (Oct-Dec) ${startYear}`,
    `Q4 (Jan-March) ${startYear + 1}`
  ];
}
