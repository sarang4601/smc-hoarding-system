import { Request, Response } from 'express';
import db from '../db';

// 1. Get All Licenses
export const getAllLicenses = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT l.*, h.hoarding_number, a.agency_name 
            FROM licenses l
            LEFT JOIN hoardings h ON l.hoarding_id = h.hoarding_id
            LEFT JOIN agencies a ON h.agency_id = a.agency_id
            ORDER BY l.license_id DESC
        `;
        const [rows]: any = await db.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Create License
export const createLicense = async (req: Request, res: Response) => {
    try {
        const { hoarding_id, start_date, end_date, license_fee, gst, tds, net_amount } = req.body;
        const sql = `INSERT INTO licenses (hoarding_id, start_date, end_date, license_fee, gst, tds, net_amount) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result]: any = await db.query(sql, [
            hoarding_id, 
            start_date, 
            end_date, 
            license_fee, 
            gst || 0, 
            tds || 0, 
            net_amount || 0
        ]);
        res.status(201).json({ success: true, message: 'License created successfully', license_id: result.insertId });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};