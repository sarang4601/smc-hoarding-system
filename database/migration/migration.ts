import fs from "fs";
import path from "path";

import pool from "../../src/db";
import { validateJson } from "./validator";
import { logStep } from "./logger";

import { 
 importAgencies,
 importTpSchemes,
 importWards,
 importHoardings,
 importLicenses
} from "./importer";

async function runMigration() {

    logStep("Validating JSON");

    const result = validateJson();

    if (!result.valid) {
        console.log(result.errors);
        process.exit(1);
    }

    console.log("✅ JSON Validation Passed");


    const jsonPath = path.join(
        process.cwd(),
        "smc_hoarding_db.json"
    );

    const db = JSON.parse(
        fs.readFileSync(jsonPath, "utf8")
    );


    logStep("Connecting MySQL");

    const conn = await pool.getConnection();

    console.log("✅ Connected to MySQL");


    try {

        logStep("Starting Transaction");

        await conn.beginTransaction();

        console.log("✅ Transaction Started");


        console.log("\nImporting Agencies...");

        await importAgencies(
            conn,
            db.agencies
        );


        console.log("\nImporting TP Schemes...");

        await importTpSchemes(
            conn,
            db.tpSchemes
        );


        console.log("\nImporting Wards...");

        await importWards(
            conn,
            db.wards || []
        );

        console.log("\nImporting Hoardings...");

        await importHoardings(
            conn,
          db.hoardings || []
      );

        console.log("\nImporting Licenses...");

        await importLicenses(
            conn,
            db.licenses || []   
        );

        await conn.commit();

        console.log("✅ Transaction Committed");


    } catch (err) {

        await conn.rollback();

        console.error("❌ Migration Failed");
        console.error(err);


    } finally {

        conn.release();

    }

}


runMigration()
.catch(console.error);