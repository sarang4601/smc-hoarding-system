import { PoolConnection } from "mysql2/promise";

// 1. Import Agencies
export async function importAgencies(
    conn: PoolConnection,
    agencies: any[]
) {
    console.log(`\nImporting ${agencies.length} Agencies...\n`);

    let inserted = 0;
    let skipped = 0;

    for (const agency of agencies) {
        try {
            const [rows]: any = await conn.query(
                `SELECT agency_id FROM agencies WHERE agency_name = ?`,
                [agency.agency_name]
            );

            if (rows.length > 0) {
                skipped++;
                continue;
            }

            await conn.query(
                `INSERT INTO agencies (agency_name, gst_number, mobile_no, email, address, status) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    agency.agency_name,
                    agency.gst_number || null,
                    agency.mobile_no || null,
                    agency.email || null,
                    agency.address || null,
                    agency.status || 'Active'
                ]
            );

            inserted++;
        } catch (error) {
            skipped++;
        }
    }

    console.log(`✅ Agencies Inserted : ${inserted}`);
    console.log(`⚠️ Agencies Skipped : ${skipped}`);
}

// 2. Import TP Schemes
export async function importTpSchemes(
    conn: PoolConnection,
    schemes: any[]
) {
    console.log(`\nImporting ${schemes.length} TP Schemes...\n`);

    let inserted = 0;
    let skipped = 0;

    for (const scheme of schemes) {
        try {
            const [rows]: any = await conn.query(
                `SELECT tp_scheme_id FROM tp_schemes WHERE tp_scheme_code = ?`,
                [scheme.tp_scheme_code]
            );

            if (rows.length > 0) {
                skipped++;
                continue;
            }

            await conn.query(
                `INSERT INTO tp_schemes (tp_scheme_code, tp_scheme_name, zone_name, display_order, status, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    scheme.tp_scheme_code,
                    scheme.tp_scheme_name,
                    scheme.zone_name,
                    scheme.display_order || 0,
                    scheme.status || 'Active',
                    scheme.created_by || null,
                    scheme.updated_by || null
                ]
            );

            inserted++;
        } catch (error) {
            skipped++;
        }
    }

    console.log(`✅ TP Schemes Inserted : ${inserted}`);
    console.log(`⚠️ TP Schemes Skipped : ${skipped}`);
}

// 3. Import Wards
export async function importWards(
    conn: PoolConnection,
    wards: any[]
) {
    console.log(`\nImporting ${wards.length} Wards...\n`);

    let inserted = 0;
    let skipped = 0;

    for (const ward of wards) {
        try {
            await conn.query(
                `INSERT INTO wards (ward_no, ward_name, zone) VALUES (?, ?, ?)`,
                [
                    ward.ward_no,
                    ward.ward_name,
                    ward.zone
                ]
            );

            inserted++;
        } catch (error) {
            skipped++;
        }
    }

    console.log(`✅ Wards Inserted : ${inserted}`);
    console.log(`⚠️ Wards Skipped : ${skipped}`);
}

// 4. Import Hoardings
export async function importHoardings(
    conn: PoolConnection,
    hoardings: any[]
) {
    console.log(`\nImporting ${hoardings.length} Hoardings...\n`);

    let inserted = 0;
    let skipped = 0;

    for (const item of hoardings) {
        try {
            await conn.query(
                `INSERT INTO hoardings (agency_id, tp_scheme_id, financial_year, hoarding_location, hoarding_type, width, height, area, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    item.agency_id,
                    item.tp_scheme_id || null,
                    item.financial_year || '2025-2026',
                    item.hoarding_location || item.location,
                    item.hoarding_type || 'Single Side Hoarding',
                    item.width || 0,
                    item.height || 0,
                    item.area || item.size || 0,
                    item.latitude || null,
                    item.longitude || null,
                    item.status || 'Active'
                ]
            );

            inserted++;
        } catch (error) {
            skipped++;
        }
    }

    console.log(`✅ Hoardings Inserted : ${inserted}`);
    console.log(`⚠️ Hoardings Skipped : ${skipped}`);
}

// 5. Import Licenses
export async function importLicenses(
    conn: PoolConnection,
    licenses: any[]
) {
    console.log(`\nImporting ${licenses.length} Licenses...\n`);

    let inserted = 0;
    let skipped = 0;

    for (const item of licenses) {
        try {
            await conn.query(
                `INSERT INTO licenses (hoarding_id, start_date, end_date, license_fee, gst, tds, net_amount) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    item.hoarding_id,
                    item.start_date,
                    item.end_date,
                    item.license_fee,
                    item.gst || 0,
                    item.tds || 0,
                    item.net_amount || 0
                ]
            );

            inserted++;
        } catch (error) {
            skipped++;
        }
    }

    console.log(`✅ Licenses Inserted : ${inserted}`);
    console.log(`⚠️ Licenses Skipped : ${skipped}`);
}