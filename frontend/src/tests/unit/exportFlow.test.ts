// ─── Export Flow — Test Cases ─────────────────────────────────────────────────
// Covers: looksLikeValidXml heuristic, VALIDATE_XML column lookup,
//         export mode logic, filename resolution, and XML gate behaviour.
//
// Run with:  npx vitest run exportFlow.test.ts
// Install:   npm i -D vitest

import { describe, expect, it } from "vitest";

// ─── Inline the functions under test ─────────────────────────────────────────
// These are copied from spreadsheet.worker.ts so tests run without a Worker.
// Keep in sync with the worker when logic changes.

function looksLikeValidXml(val: string): boolean {
  const v = val.trim();
  if (!v) return false;
  if (!v.startsWith("<") || !v.endsWith(">")) return false;
  // Check unescaped & before self-closing shortcut so it applies everywhere
  if (/&(?![a-zA-Z#][a-zA-Z0-9#]*;)/.test(v)) return false;
  if (/^<[^>]+\/>$/.test(v)) return true;
  const openMatch = /^<([A-Za-z_][\w:.-]*)[\s>]/.exec(v);
  if (!openMatch) return false;
  const rootTag = openMatch[1];
  if (!v.endsWith(`</${rootTag}>`)) return false;
  return true;
}

function resolveName(
  row: Record<string, string>,
  fileNameCol: string,
  fallback: string
): string {
  if (!fileNameCol) return fallback;
  const val = (row[fileNameCol] ?? "").trim();
  return !val || /^(null|undefined|n\/a|-)$/i.test(val) ? fallback : val;
}

// ─── Sample XML from actual system output ────────────────────────────────────
const REAL_CLAIM_XML = `<CLAIM pClaimNumber="HD1" pTrackingNumber="" pPhilhealthClaimType="ALL-CASE-RATE" pPatientType="O" pIsEmergency="N">
<CF1 pMemberPIN="190005154891" pMemberLastName="NICABERA" pMemberFirstName="JAIME" pMemberMiddleName="BARTOLASO" pMemberSuffix="" pMemberBirthDate="03-22-1951" pMemberShipType="P" pMailingAddress="PINAGBUHATAN PASIG CITY" pMemberSex="M" pZipCode="1800" pLandlineNo="" pMobileNo="" pEmailAddress="" pPatientIs="M" pPatientPIN="190005154891" pPatientLastName="NICABERA" pPatientFirstName="JAIME" pPatientMiddleName="BARTOLASO" pPatientSuffix="" pPatientBirthDate="03-22-1951" pPatientSex="M" pPEN="" pEmployerName=""/>
<CF2 pPatientReferred="N" pAdmissionDate="08-28-2017" pAdmissionTime="12:00:00PM" pDischargeDate="08-30-2017" pDischargeTime="01:00:00PM" pDisposition="I" pExpiredDate="" pExpiredTime="" pAccommodationType="P" pHasAttachedSOA="Y">
<DIAGNOSIS pAdmissionDiagnosis="ESRD">
<DISCHARGE pDischargeDiagnosis="ESRD">
<ICDCODE pICDCode="N18.5"/>
<RVSCODES pRelatedProcedure="HEMODIALYSIS" pRVSCode="90935" pProcedureDate="08-28-2017" pLaterality="N"/>
</DISCHARGE>
</DIAGNOSIS>
<SPECIAL>
<PROCEDURES>
<HEMODIALYSIS>
<SESSIONS pSessionDate="08-28-2017"/>
<SESSIONS pSessionDate="08-30-2017"/>
</HEMODIALYSIS>
</PROCEDURES>
</SPECIAL>
<PROFESSIONALS pDoctorAccreCode="120298103016" pDoctorLastName="REYES" pDoctorFirstName="RACQUEL" pDoctorMiddleName="T" pDoctorSuffix="" pWithCoPay="N" pDoctorCoPay="0" pDoctorSignDate="08-28-2017"/>
<CONSUMPTION pEnoughBenefits="Y">
<BENEFITS pTotalHCIFees="4500" pTotalProfFees="700" pGrandTotal="5200"/>
</CONSUMPTION>
<APR>
<APRBYPATSIG pDateSigned="08-28-2017"/>
</APR>
</CF2>
<ALLCASERATE>
<CASERATE pCaseRateCode="CR0388" pICDCode="" pRVSCode="90935" pCaseRateAmount="2600"/>
</ALLCASERATE>
<DOCUMENTS>
<DOCUMENT pDocumentType="CF2" pDocumentURL="https://www.easyclaimsph.com/docs/H99007367/09082017/HEMO1/HD1/NICABERA, JAIMECF2.enc"/>
<DOCUMENT pDocumentType="SOA" pDocumentURL="https://www.easyclaimsph.com/docs/H99007367/09082017/HEMO1/HD1/SOA.enc"/>
</DOCUMENTS>
</CLAIM>`;

// ─── 1. looksLikeValidXml — valid cases ──────────────────────────────────────
describe("looksLikeValidXml — valid XML", () => {
  it("passes the real PhilHealth CLAIM XML", () => {
    expect(looksLikeValidXml(REAL_CLAIM_XML)).toBe(true);
  });

  it("passes with leading and trailing whitespace", () => {
    expect(looksLikeValidXml(`  ${REAL_CLAIM_XML}  `)).toBe(true);
  });

  it("passes with leading newline", () => {
    expect(looksLikeValidXml(`\n${REAL_CLAIM_XML}`)).toBe(true);
  });

  it("passes with trailing newline", () => {
    expect(looksLikeValidXml(`${REAL_CLAIM_XML}\n`)).toBe(true);
  });

  it("passes CRLF line endings", () => {
    const crlf = REAL_CLAIM_XML.replace(/\n/g, "\r\n");
    expect(looksLikeValidXml(crlf)).toBe(true);
  });

  it("passes a simple self-closing root element", () => {
    expect(looksLikeValidXml(`<RECORD pId="1"/>`)).toBe(true);
  });

  it("passes a compact single-line XML", () => {
    expect(
      looksLikeValidXml(`<CLAIM><CF1 pId="1"/><CF2>data</CF2></CLAIM>`)
    ).toBe(true);
  });

  it("passes XML with hyphens in attribute values (ALL-CASE-RATE)", () => {
    expect(
      looksLikeValidXml(`<CLAIM pType="ALL-CASE-RATE"><CF1/></CLAIM>`)
    ).toBe(true);
  });

  it("passes XML with valid entity references (&amp; &lt; &gt;)", () => {
    expect(
      looksLikeValidXml(`<NOTE value="A &amp; B &lt; C &gt; D"></NOTE>`)
    ).toBe(true);
  });

  it("passes XML with numeric entity &#xA;", () => {
    expect(looksLikeValidXml(`<X v="line&#xA;break"></X>`)).toBe(true);
  });

  it("passes XML with URLs containing slashes and commas in attributes", () => {
    expect(
      looksLikeValidXml(
        `<DOC url="https://example.com/docs/NICABERA, JAIME.enc"/>`
      )
    ).toBe(true);
  });

  it("passes XML with namespace prefix on root tag", () => {
    expect(looksLikeValidXml(`<ph:CLAIM><ph:CF1/></ph:CLAIM>`)).toBe(true);
  });
});

// ─── 2. looksLikeValidXml — invalid / broken cases ───────────────────────────
describe("looksLikeValidXml — invalid XML", () => {
  it("fails an empty string", () => {
    expect(looksLikeValidXml("")).toBe(false);
  });

  it("fails a whitespace-only string", () => {
    expect(looksLikeValidXml("   ")).toBe(false);
  });

  it("fails plain text with no tags", () => {
    expect(looksLikeValidXml("NICABERA JAIME")).toBe(false);
  });

  it("fails a number string", () => {
    expect(looksLikeValidXml("12345")).toBe(false);
  });

  it("fails a date string that looks like a value", () => {
    expect(looksLikeValidXml("08-28-2017")).toBe(false);
  });

  it("fails when root tag is not closed", () => {
    expect(looksLikeValidXml(`<CLAIM><CF1/>`)).toBe(false);
  });

  it("fails when closing tag doesn't match root", () => {
    expect(looksLikeValidXml(`<CLAIM><CF1/></CF1>`)).toBe(false);
  });

  it("fails when opening tag is missing", () => {
    expect(looksLikeValidXml(`CF1 data</CLAIM>`)).toBe(false);
  });

  it("fails with unescaped & in content", () => {
    expect(looksLikeValidXml(`<NOTE>A & B</NOTE>`)).toBe(false);
  });

  it("fails with unescaped & in attribute value", () => {
    expect(looksLikeValidXml(`<DOC url="a&b"/>`)).toBe(false);
  });

  it("fails a string wrapped in double quotes (Excel cell artifact)", () => {
    expect(looksLikeValidXml(`"<CLAIM><CF1/></CLAIM>"`)).toBe(false);
  });

  it("fails with only an opening tag and no content or close", () => {
    expect(looksLikeValidXml(`<CLAIM>`)).toBe(false);
  });
});

// ─── 3. resolveName — per-row filename resolution ────────────────────────────
describe("resolveName — per-row filename column", () => {
  it("returns the column value when present and valid", () => {
    expect(resolveName({ claimNo: "HD1" }, "claimNo", "row_1")).toBe("HD1");
  });

  it("falls back to row number when column value is empty string", () => {
    expect(resolveName({ claimNo: "" }, "claimNo", "row_1")).toBe("row_1");
  });

  it("falls back when column value is whitespace only", () => {
    expect(resolveName({ claimNo: "   " }, "claimNo", "row_1")).toBe("row_1");
  });

  it("falls back when column value is 'null' (literal string)", () => {
    expect(resolveName({ claimNo: "null" }, "claimNo", "row_1")).toBe("row_1");
  });

  it("falls back when column value is 'undefined' (literal string)", () => {
    expect(resolveName({ claimNo: "undefined" }, "claimNo", "row_1")).toBe(
      "row_1"
    );
  });

  it("falls back when column value is 'n/a'", () => {
    expect(resolveName({ claimNo: "n/a" }, "claimNo", "row_1")).toBe("row_1");
  });

  it("falls back when column value is '-'", () => {
    expect(resolveName({ claimNo: "-" }, "claimNo", "row_1")).toBe("row_1");
  });

  it("falls back when no fileNameCol is specified", () => {
    expect(resolveName({ claimNo: "HD1" }, "", "row_1")).toBe("row_1");
  });

  it("falls back when column key doesn't exist in row", () => {
    expect(resolveName({}, "claimNo", "row_1")).toBe("row_1");
  });

  it("returns value with spaces (sanitization is done by caller)", () => {
    expect(resolveName({ claimNo: "HD 1" }, "claimNo", "row_1")).toBe("HD 1");
  });

  it("is case-insensitive for null/undefined sentinel (NULL)", () => {
    expect(resolveName({ claimNo: "NULL" }, "claimNo", "row_1")).toBe("row_1");
  });

  it("is case-insensitive for N/A sentinel", () => {
    expect(resolveName({ claimNo: "N/A" }, "claimNo", "row_1")).toBe("row_1");
  });
});

// ─── 4. XML gate — columns.length check (ExportDialog logic) ─────────────────
describe("XML format gate — visibleColumns.length check", () => {
  // This replicates the handleFormatClick guard in ExportDialog.
  function canSelectXml(visibleColumns: string[]): boolean {
    return visibleColumns.length === 1;
  }

  it("allows XML when exactly 1 column is visible", () => {
    expect(canSelectXml(["xml_data"])).toBe(true);
  });

  it("blocks XML when 0 columns are visible", () => {
    expect(canSelectXml([])).toBe(false);
  });

  it("blocks XML when 2 columns are visible", () => {
    expect(canSelectXml(["xml_data", "patient_id"])).toBe(false);
  });

  it("blocks XML when many columns are visible", () => {
    expect(canSelectXml(["a", "b", "c", "d", "e"])).toBe(false);
  });
});

// ─── 5. Column name lookup robustness ────────────────────────────────────────
describe("VALIDATE_XML column lookup — robustness", () => {
  // Replicates the two-step lookup in the worker's VALIDATE_XML handler.
  function resolveColumnIndex(
    colIndex: Map<string, number>,
    visibleCol: string
  ): number {
    const trimmed = visibleCol.trim();
    let ci = colIndex.get(trimmed) ?? -1;
    if (ci < 0) {
      const lower = trimmed.toLowerCase();
      for (const [name, idx] of colIndex.entries()) {
        if (name.trim().toLowerCase() === lower) {
          ci = idx;
          break;
        }
      }
    }
    return ci;
  }

  const colIndex = new Map<string, number>([
    ["xml_data", 0],
    ["patient_id", 1],
    ["claim_no", 2],
  ]);

  it("finds column by exact name", () => {
    expect(resolveColumnIndex(colIndex, "xml_data")).toBe(0);
  });

  it("finds column with leading/trailing spaces", () => {
    expect(resolveColumnIndex(colIndex, "  xml_data  ")).toBe(0);
  });

  it("finds column case-insensitively", () => {
    expect(resolveColumnIndex(colIndex, "XML_DATA")).toBe(0);
  });

  it("finds column with mixed case and spaces", () => {
    expect(resolveColumnIndex(colIndex, "  Xml_Data  ")).toBe(0);
  });

  it("returns -1 for a completely unknown column", () => {
    expect(resolveColumnIndex(colIndex, "nonexistent")).toBe(-1);
  });

  it("returns -1 for empty string", () => {
    expect(resolveColumnIndex(colIndex, "")).toBe(-1);
  });
});

// ─── 6. Export config — per-row always zips ──────────────────────────────────
describe("Export config — per-row mode always produces a zip", () => {
  // Replicates the simplified EXPORT handler branch logic.
  function getExportKind(mode: "single" | "per-row"): "file" | "zip" {
    return mode === "single" ? "file" : "zip";
  }

  it("single mode produces a file", () => {
    expect(getExportKind("single")).toBe("file");
  });

  it("per-row mode always produces a zip regardless of row count", () => {
    expect(getExportKind("per-row")).toBe("zip");
  });
});
