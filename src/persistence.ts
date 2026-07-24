import type { Hoarding } from "./types";

export function buildHoardingRecord(input: Partial<Hoarding> & {
  id?: number;
  agency_name: string;
  tp_number: string;
  final_plot_no: string;
  hoarding_type: string;
  financial_year: string;
  hoarding_location: string;
  property_owner_name: string;
  permission_date: string;
  width: number;
  height: number;
  rate: number;
  document?: string;
  document_name?: string;
}): Hoarding {
  const width = Number(input.width ?? 0);
  const height = Number(input.height ?? 0);
  const rate = Number(input.rate ?? 0);
  const area = Number((width * height).toFixed(4));
  const annualLicenseFee = Math.round(area * rate * (input.hoarding_type === "Computerized Hoarding" ? 2 : 1));
  const quarterlyLicenseFee = Math.round(annualLicenseFee / 4);

  return {
    id: input.id ?? Date.now(),
    agency_name: input.agency_name,
    tp_scheme_id: input.tp_scheme_id,
    tp_scheme_code: input.tp_scheme_code ?? "",
    tp_scheme_name: input.tp_scheme_name ?? "",
    tp_number: input.tp_number,
    final_plot_no: input.final_plot_no,
    hoarding_type: input.hoarding_type,
    financial_year: input.financial_year,
    hoarding_location: input.hoarding_location,
    property_owner_name: input.property_owner_name,
    permission_date: input.permission_date || new Date().toISOString().split("T")[0],
    width,
    height,
    area,
    rate,
    annual_license_fee: annualLicenseFee,
    quarterly_license_fee: quarterlyLicenseFee,
    document: input.document,
    document_name: input.document_name,
    status: input.status ?? "Active",
    cancellation_date: input.cancellation_date ?? "",
    cancellation_reason: input.cancellation_reason ?? "",
    cancelled_by: input.cancelled_by ?? "",
    cancellation_financial_year: input.cancellation_financial_year ?? ""
  };
}
