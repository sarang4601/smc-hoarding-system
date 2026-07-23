export interface Agency {
  id: number;
  agency_name: string;
  gst_number: string;
}

export interface TPScheme {
  id: number;
  tp_scheme_code: string;
  tp_scheme_name: string;
  zone_name: string;
  status: "Active" | "Inactive";
  display_order: number;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  deleted_at: string;
}

export interface AuditTrailEntry {
  id: number;
  entity: "tp_scheme";
  entity_id: number;
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
  timestamp: string;
  user: string;
  old_value: any;
  new_value: any;
}

export interface Hoarding {
  id: number;
  agency_name: string; // Foreign Key to Agency.agency_name
  tp_scheme_id?: number;
  tp_scheme_code?: string;
  tp_scheme_name?: string;
  tp_number: string; // TP Number (ટી.પી. નંબર)
  final_plot_no: string; // Final Plot Number / R.S. Number (ફાઇનલ પ્લોટ નંબર / આર.એસ. નંબર)
  hoarding_type: string; // Hoarding Type (હોર્ડિંગ પ્રકાર: Single Side / Double Side / Computerized)
  financial_year: string; // Financial Year (compulsory) (નાણાકીય વર્ષ - આવશ્યક)
  hoarding_location: string;
  property_owner_name: string;
  permission_date: string; // YYYY-MM-DD
  width: number;
  height: number;
  area: number; // width * height (વિસ્તાર = પહોળાઈ * ઉંચાઈ)
  rate: number; // rate per sq meter (દર પ્રતિ ચોરસ મીટર)
  annual_license_fee: number; // Math.ceil(area * rate) (વાર્ષિક લાયસન્સ ફી)
  quarterly_license_fee: number; // Math.ceil(annual_license_fee / 4) (ત્રૈમાસિક ફી)
  document?: string; // base64 string
  document_name?: string;
  status?: "Active" | "Cancelled";
  cancellation_date?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancellation_financial_year?: string;
}

export interface QuarterlyPayment {
  id: number;
  agency_name: string; // Foreign Key dropdown
  quarter: string; // "Q1", "Q2", etc.
  financial_year: string; // Financial Year (compulsory)
  license_fee: number; // User manually enters or defaults
  interest: number;
  miscellaneous_charges: number;
  receipt_number: string;
  receipt_date: string; // YYYY-MM-DD
  remarks: string;
  sgst: number; // Math.ceil((license_fee + interest) * 0.09) (SGST)
  cgst: number; // Math.ceil((license_fee + interest) * 0.09) (CGST)
  grand_total: number; // license_fee + interest + sgst + cgst + miscellaneous_charges
}

export interface StabilityCertificate {
  id: number;
  agency_name: string; // Dropdown
  hoarding_location: string; // Dropdown filtered by selected agency
  financial_year: string; // Financial Year (compulsory)
  certificate_number: string;
  issue_date: string; // YYYY-MM-DD
  valid_till_date: string; // YYYY-MM-DD
  engineer_name: string;
  engineer_mobile_number: string;
  remarks: string;
}

export interface DashboardStats {
  totalAgencies: number;
  totalHoardings: number;
  totalAnnualLicenseFee: number;
  totalQuarterlyLicenseFee: number;
  totalPaidAmount: number;
  pendingAmount: number;
  expiringCertificatesCount: number;
}
