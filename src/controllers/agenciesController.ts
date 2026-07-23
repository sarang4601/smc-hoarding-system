import { Request, Response } from 'express';
import db from '../db';

// 1. Get All Agencies
export const getAllAgencies = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await db.query('SELECT * FROM agencies ORDER BY agency_id DESC');
        res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Get Single Agency by ID
export const getAgencyById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [rows]: any = await db.query('SELECT * FROM agencies WHERE agency_id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Agency not found' });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Create Agency
export const createAgency = async (req: Request, res: Response) => {
    try {
        const { agency_name, gst_number, mobile_no, email, address, status } = req.body;
        const sql = `INSERT INTO agencies (agency_name, gst_number, mobile_no, email, address, status) VALUES (?, ?, ?, ?, ?, ?)`;
        const [result]: any = await db.query(sql, [
            agency_name, 
            gst_number || null, 
            mobile_no || null, 
            email || null, 
            address || null, 
            status || 'Active'
        ]);
        res.status(201).json({ success: true, message: 'Agency created successfully', agency_id: result.insertId });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Update Agency
export const updateAgency = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { agency_name, gst_number, mobile_no, email, address, status } = req.body;
        const sql = `UPDATE agencies SET agency_name=?, gst_number=?, mobile_no=?, email=?, address=?, status=? WHERE agency_id=?`;
        const [result]: any = await db.query(sql, [agency_name, gst_number, mobile_no, email, address, status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Agency not found' });
        }
        res.status(200).json({ success: true, message: 'Agency updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Delete Agency
export const deleteAgency = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [result]: any = await db.query('DELETE FROM agencies WHERE agency_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Agency not found' });
        }
        res.status(200).json({ success: true, message: 'Agency deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};