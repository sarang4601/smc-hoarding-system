import fs from "fs";
import path from "path";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data: any;
}

const REQUIRED_COLLECTIONS = [
  "agencies",
  "tpSchemes",
  "hoardings",
  "quarterlyPayments",
  "stabilityCertificates",
];

export function validateJson(): ValidationResult {
  const errors: string[] = [];

  const filePath = path.join(process.cwd(), "smc_hoarding_db.json");

  if (!fs.existsSync(filePath)) {
    return {
      valid: false,
      errors: ["JSON file not found."],
      data: null,
    };
  }

  let json: any;

  try {
    json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    return {
      valid: false,
      errors: ["Invalid JSON format."],
      data: null,
    };
  }

  // Required Collections
  for (const table of REQUIRED_COLLECTIONS) {
    if (!Array.isArray(json[table])) {
      errors.push(`${table} collection missing.`);
    }
  }

  // Agencies
  if (json.agencies) {
    json.agencies.forEach((a: any, i: number) => {
      if (!a.agency_name)
        errors.push(`Agency Row ${i + 1}: agency_name missing`);
    });
  }

  // TP Schemes
  if (json.tpSchemes) {
    json.tpSchemes.forEach((tp: any, i: number) => {
      if (!tp.tp_scheme_code)
        errors.push(`TP Scheme Row ${i + 1}: code missing`);

      if (!tp.tp_scheme_name)
        errors.push(`TP Scheme Row ${i + 1}: name missing`);
    });
  }

  // Hoardings
  if (json.hoardings) {
    json.hoardings.forEach((h: any, i: number) => {
      if (!h.agency_name)
        errors.push(`Hoarding Row ${i + 1}: agency missing`);

      if (!h.tp_scheme_code)
        errors.push(`Hoarding Row ${i + 1}: TP Scheme missing`);

      if (!h.financial_year)
        errors.push(`Hoarding Row ${i + 1}: Financial Year missing`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    data: json,
  };
}

