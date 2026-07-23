import { Request, Response } from 'express';
import db from '../db'; // જો તમારા ડેટાબેઝ કનેક્શનની ફાઈલ 'src/db.ts' હોય

// 1. Get All Hoardings (With Agency & TP Scheme details)
export const getAllHoardings = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT 
                h.*, 
                a.agency_name, 
                tp.tp_scheme_name 
            FROM hoardings h
            LEFT JOIN agencies a ON h.agency_id = a.agency_id
            LEFT JOIN tp_schemes tp ON h.tp_scheme_id = tp.tp_scheme_id
            ORDER BY h.hoarding_id DESC
        `;
        const [rows]: any = await db.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Get Single Hoarding by ID
export const getHoardingById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                h.*, 
                a.agency_name, 
                tp.tp_scheme_name 
            FROM hoardings h
            LEFT JOIN agencies a ON h.agency_id = a.agency_id
            LEFT JOIN tp_schemes tp ON h.tp_scheme_id = tp.tp_scheme_id
            WHERE h.hoarding_id = ?
        `;
        const [rows]: any = await db.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Hoarding not found' });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Create New Hoarding
export const createHoarding = async (req: Request, res: Response) => {
    try {
        const {
            agency_id,
            tp_scheme_id,
            financial_year,
            hoarding_number,
            final_plot_no,
            hoarding_location,
            hoarding_type,
            width,
            height,
            area,
            annual_license_fee,
            latitude,
            longitude,
            status
        } = req.body;

        const query = `
            INSERT INTO hoardings 
            (agency_id, tp_scheme_id, financial_year, hoarding_number, final_plot_no, hoarding_location, hoarding_type, width, height, area, annual_license_fee, latitude, longitude, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result]: any = await db.query(query, [
            agency_id,
            tp_scheme_id || null,
            financial_year || '2025-2026',
            hoarding_number || null,
            final_plot_no || null,
            hoarding_location,
            hoarding_type || 'Single Side Hoarding',
            width || 0,
            height || 0,
            area || 0,
            annual_license_fee || 0,
            latitude || null,
            longitude || null,
            status || 'Active'
        ]);

        res.status(201).json({
            success: true,
            message: 'Hoarding created successfully',
            hoarding_id: result.insertId
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Update Hoarding
export const updateHoarding = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            agency_id,
            tp_scheme_id,
            hoarding_location,
            hoarding_type,
            width,
            height,
            area,
            annual_license_fee,
            status
        } = req.body;

        const query = `
            UPDATE hoardings 
            SET agency_id = ?, tp_scheme_id = ?, hoarding_location = ?, hoarding_type = ?, width = ?, height = ?, area = ?, annual_license_fee = ?, status = ?
            WHERE hoarding_id = ?
        `;

        const [result]: any = await db.query(query, [
            agency_id,
            tp_scheme_id,
            hoarding_location,
            hoarding_type,
            width,
            height,
            area,
            annual_license_fee,
            status,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Hoarding not found' });
        }

        res.status(200).json({ success: true, message: 'Hoarding updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Delete Hoarding
export const deleteHoarding = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [result]: any = await db.query('DELETE FROM hoardings WHERE hoarding_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Hoarding not found' });
        }

        res.status(200).json({ success: true, message: 'Hoarding deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};