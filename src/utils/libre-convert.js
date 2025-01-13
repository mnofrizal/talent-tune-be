import { exec } from "child_process";
import path from "path";
import fs from "fs";

/**
 * Convert a file to PDF using LibreOffice
 * @param {string} inputPath - Path to the input file
 * @returns {Promise<string>} Path to the converted PDF file
 */
export async function convertToPdf(inputPath) {
  try {
    // Create the convert directory if it doesn't exist
    const convertDir = path.join(
      process.cwd(),
      "src",
      "uploads",
      "assesment",
      "penilaian",
      "convert"
    );
    await fs.promises.mkdir(convertDir, { recursive: true });

    // Get the filename without extension
    const filename = path.basename(inputPath, path.extname(inputPath));

    // Construct the output PDF path
    const outputPath = path.join(convertDir, `${filename}.pdf`);

    // Convert to PDF using LibreOffice
    await new Promise((resolve, reject) => {
      exec(
        `soffice --headless --convert-to pdf --outdir "${convertDir}" "${inputPath}"`,
        (error, stdout, stderr) => {
          if (error) {
            console.error("Conversion error:", error);
            reject(error);
            return;
          }
          resolve(stdout);
        }
      );
    });

    return outputPath;
  } catch (error) {
    console.error("Error converting file to PDF:", error);
    throw error;
  }
}
