import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildHoardingRecord } from "../src/persistence";

describe("persistence helpers", () => {
  it("computes hoarding fees from width, height, and rate", () => {
    const record = buildHoardingRecord({
      id: 101,
      agency_name: "Test Agency",
      tp_number: "TP-24",
      final_plot_no: "FP-1",
      hoarding_type: "Single Side Hoarding",
      financial_year: "2025-26",
      hoarding_location: "Test Location",
      property_owner_name: "Owner",
      permission_date: "2025-01-01",
      width: 6,
      height: 3,
      rate: 1200,
      document: "",
      document_name: ""
    });

    assert.equal(record.area, 18);
    assert.equal(record.annual_license_fee, 21600);
    assert.equal(record.quarterly_license_fee, 5400);
    assert.equal(record.status, "Active");
  });
});
