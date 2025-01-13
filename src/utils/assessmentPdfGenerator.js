import fs from "fs";
import path from "path";
import { exec } from "child_process";
import ExcelJS from "exceljs";

/**
 * Update Excel file with assessment data
 * @param {Object} data - The assessment data
 * @param {string} filePath - Path to the Excel file
 * @private
 */
async function updateExcelFile(data, filePath) {
  console.log("Starting Excel file update with data:", data);
  console.log("Reading Excel file from:", filePath);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  if (!worksheet) {
    throw new Error("Could not find worksheet in Excel file");
  }

  console.log("Successfully loaded worksheet");

  // Helper function to update cell while preserving formatting
  const updateCell = (cellAddress, value) => {
    const cell = worksheet.getCell(cellAddress);
    const style = cell.style;
    cell.value = value;
    cell.style = style;
  };

  // Update cells with data
  updateCell("A7", `TINGKAT ${data.tingkatGeneralist}`);
  updateCell(
    "C8",
    new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );
  updateCell(
    "C9",
    new Date()
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(/\./g, ":")
  );
  updateCell("B15", data.bidang || "");
  updateCell("A16", data.no || "");
  updateCell("B16", data.nama || "");
  updateCell("C16", data.nip || "");
  updateCell("D16", data.grade || "");
  updateCell("E16", data.jabatanEksisting || "");
  updateCell("F16", data.bidangEksisting || "");
  updateCell("G16", data.tglJabatanTerakhir || "");
  updateCell("H16", data.proyeksiJabatan || "");
  updateCell("I16", data.pendidikan || "");
  updateCell("J16", data.aspekPenilaian?.pemahamanUnit || 0);
  updateCell("K16", data.aspekPenilaian?.pemahamanBidangKerja || 0);
  updateCell("L16", data.aspekPenilaian?.sikap || 0);
  updateCell("M16", data.aspekPenilaian?.keterampilanKomunikasi || 0);
  updateCell("O16", data.kesimpulanRekomendasi || "");
  updateCell("L18", data.tanggalTtd || "");
  updateCell("J22", data.evaluator || "");
  updateCell("J23", data.jabatanEvaluator || "");

  console.log("All cells updated, saving workbook...");

  // Save the workbook
  await workbook.xlsx.writeFile(filePath);

  console.log("Excel file successfully updated and saved");
}

/**
 * Generate PDF assessment file using LibreOffice
 * @param {Object} data - The assessment data
 * @returns {Promise<string>} Path to the generated PDF file
 */
async function generateAssessmentPDF(data) {
  // Create output directory
  const outputDir = path.join(
    process.cwd(),
    "src",
    "uploads",
    "assesment",
    "penilaian"
  );
  await fs.promises.mkdir(outputDir, { recursive: true });

  // Copy template to temp location
  const templatePath = path.join(
    process.cwd(),
    "src",
    "utils",
    "template",
    "format_penilaian.xlsx"
  );
  const timestamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 17);
  const filename = `evaluation_${timestamp}`;
  const tempExcelPath = path.join(outputDir, `${filename}.xlsx`);
  await fs.promises.copyFile(templatePath, tempExcelPath);

  try {
    console.log("Starting PDF generation process...");
    console.log("Template copied to:", tempExcelPath);

    // Update Excel file with data
    await updateExcelFile(data, tempExcelPath);

    console.log("Excel file updated, converting to PDF...");

    // Convert to PDF
    const pdfPath = path.join(outputDir, `${filename}.pdf`);
    await new Promise((resolve, reject) => {
      const convertCommand = `soffice --headless --convert-to pdf --outdir "${outputDir}" "${tempExcelPath}"`;
      exec(convertCommand, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    console.log(
      "PDF conversion command executed, waiting for file generation..."
    );

    // Wait for PDF to be generated
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("PDF file should be generated at:", pdfPath);

    if (!fs.existsSync(pdfPath)) {
      console.error("PDF file was not generated at expected location");
      throw new Error("PDF file was not generated");
    }

    console.log("PDF file successfully generated, cleaning up...");

    // Clean up Excel file
    try {
      await fs.promises.unlink(tempExcelPath);
    } catch (error) {
      console.error("Error cleaning up Excel file:", error);
    }

    return pdfPath;
  } catch (error) {
    console.error("Error generating assessment PDF:", error);
    throw error;
  }
}

export { generateAssessmentPDF };
