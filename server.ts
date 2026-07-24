import path from 'path';
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors"; // 👈 ૧. CORS ઉમેર્યું
import fs from "fs";
import { Agency, Hoarding, QuarterlyPayment, StabilityCertificate } from "./src/types";
import pool from "./src/db";

const app = express();
const PORT = 3000;

// 👈 ૨. CORS અને JSON Middleware
app.use(cors()); 
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const DB_FILE_PATH = path.join(process.cwd(), "smc_hoarding_db.json");

// Default DB Structure
interface TPGridScheme {
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

interface DatabaseSchema {
  agencies: Agency[];
  hoardings: Hoarding[];
  quarterlyPayments: QuarterlyPayment[];
  stabilityCertificates: StabilityCertificate[];
  tpSchemes: TPGridScheme[];
  tpSchemeAudits: any[];
}

const defaultDB: DatabaseSchema = {
  agencies: [
    { id: 1, agency_name: "Tapi Publicity Services", gst_number: "24AACCT1024F1ZA" },
    { id: 2, agency_name: "Sarthana Outdoor Advertisers", gst_number: "24AABCS5678B2Z2" }
  ],
  hoardings: [
    {
      id: 1,
      agency_name: "Tapi Publicity Services",
      tp_number: "TP-24 (Valak)",
      final_plot_no: "F.P. 45",
      hoarding_type: "Single Side Hoarding",
      financial_year: "2025-26",
      hoarding_location: "Sarthana Jakatnaka Junction, Near Police Chowki",
      property_owner_name: "Surat Municipal Corporation",
      permission_date: "10/04/2025",
      width: 6.0,
      height: 3.0,
      area: 18.0,
      rate: 1200,
      annual_license_fee: 21600,
      quarterly_license_fee: 5400,
      status: "Active"
    }
  ],
  quarterlyPayments: [],
  stabilityCertificates: [],
  tpSchemes: [],
  tpSchemeAudits: []
};

function getDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(defaultDB, null, 2), "utf8");
      return defaultDB;
    }
    const data = fs.readFileSync(DB_FILE_PATH, "utf8");
    return JSON.parse(data) as DatabaseSchema;
  } catch (err) {
    return defaultDB;
  }
}

// ---------------- REST API ENDPOINTS ----------------

// AGENCIES API
app.get("/api/agencies", (req, res) => {
  const db = getDB();
  res.json(db.agencies);
});

// HOARDINGS API
app.get("/api/hoardings", (req, res) => {
  const db = getDB();
  res.json(db.hoardings || []);
});

app.post("/api/hoardings", (req, res) => {
  const db = getDB();
  const payload = req.body;
  const created = {
    ...payload,
    id: payload.id ?? Date.now(),
    status: payload.status ?? "Active",
    area: payload.area ?? Number((Number(payload.width || 0) * Number(payload.height || 0)).toFixed(4)),
    annual_license_fee: payload.annual_license_fee ?? 0,
    quarterly_license_fee: payload.quarterly_license_fee ?? 0
  };

  db.hoardings = [...db.hoardings, created];
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), "utf8");
  res.status(201).json({ success: true, hoarding_id: created.id });
});

app.put("/api/hoardings/:id", (req, res) => {
  const db = getDB();
  const id = Number(req.params.id);
  const payload = req.body;

  const index = db.hoardings.findIndex((item) => Number(item.id) === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Hoarding not found" });
  }

  db.hoardings[index] = {
    ...db.hoardings[index],
    ...payload,
    id,
    area: payload.area ?? Number((Number(payload.width || db.hoardings[index].width || 0) * Number(payload.height || db.hoardings[index].height || 0)).toFixed(4))
  };

  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), "utf8");
  res.json({ success: true, message: "Hoarding updated" });
});

// SERVER LISTEN
// Vite Build ની ફાઈલો બતાવવા માટે
app.use(express.static(path.resolve('dist')));

// કોઈપણ રૂટ પર રિક્વેસ્ટ આવે તો index.html ઓપન થશે
app.get('*', (req, res) => {
  res.sendFile(path.resolve('dist', 'index.html'));
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ SMC Hoarding Backend running on http://localhost:${PORT}`);
});