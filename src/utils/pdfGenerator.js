import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { questions } from "../config/questions-data.js";
import { uploadsDir } from "./uploadConfig.js";

export const generateEvaluationPDF = async (evaluation, assessment) => {};

export const generateQuestionnairePDF = async (
  responses,
  assessmentId,
  participant
) => {
  // Create PDF with minimal margins
  const doc = new PDFDocument({
    size: "A4",
    margin: 30,
    bufferPages: true,
    autoFirstPage: true,
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "");
  const filename = `questionnaire_${assessmentId}_${timestamp}.pdf`;
  const filePath = path.join(uploadsDir.questionnaire, filename);

  if (!fs.existsSync(uploadsDir.questionnaire)) {
    fs.mkdirSync(uploadsDir.questionnaire, { recursive: true });
  }

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Title at the top of the page with reduced spacing
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("KUESIONER KOMITMEN ANTI PENYUAPAN", {
      align: "center",
      lineGap: 2, // Reduced line gap
    });

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text(
      "PESERTA FIT AND PROPER TEST PENGISIAN JABATAN PT PLN INDONESIA POWER",
      {
        align: "center",
        lineGap: 10, // Reduced line gap
      }
    );

  // Define table dimensions with optimized spacing
  const pageWidth = doc.page.width;
  const tableTop = 80; // Increased top margin to add space
  const colWidths = {
    no: Math.floor(pageWidth * 0.04), // Reduced
    material: Math.floor(pageWidth * 0.12), // Reduced
    question: Math.floor(pageWidth * 0.35), // Reduced for bigger margins
    sangat_paham: Math.floor(pageWidth * 0.07),
    paham: Math.floor(pageWidth * 0.07),
    cukup_paham: Math.floor(pageWidth * 0.07),
    kurang_paham: Math.floor(pageWidth * 0.07),
    tidak_paham: Math.floor(pageWidth * 0.07),
  };

  const totalWidth = Object.values(colWidths).reduce(
    (sum, width) => sum + width,
    0
  );
  const marginLeft = (pageWidth - totalWidth) / 2;

  // Add header immediately after creating document
  const headerY = 10;
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#808080")
    .text(
      `${participant.name} / ${
        participant.nip
      } | Created at: ${new Date().toLocaleDateString()}`,
      marginLeft,
      headerY,
      {
        width: pageWidth - 60, // Account for margins
        align: "left",
        style: { italic: true },
      }
    );

  // Set up header for subsequent pages
  doc.on("pageAdded", () => {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#808080")
      .text(
        `${participant.name} / ${
          participant.nip
        } | Created at: ${new Date().toLocaleDateString()}`,
        marginLeft,
        headerY,
        {
          width: pageWidth - 60, // Account for margins
          align: "left",
          style: { italic: true },
        }
      );
  });

  // Optimized table header function
  const drawTableHeader = (y) => {
    doc.lineWidth(0.5); // Reduced line width

    doc
      .rect(marginLeft, y, totalWidth, 30) // Reduced height
      .fillColor("#F5F5F5")
      .fill();

    doc.rect(marginLeft, y, totalWidth, 30).strokeColor("#000000").stroke();

    let x = marginLeft;
    Object.values(colWidths).forEach((width) => {
      doc
        .moveTo(x, y)
        .lineTo(x, y + 30)
        .stroke();
      x += width;
    });

    doc
      .font("Helvetica-Bold")
      .fontSize(9) // Reduced font size
      .fillColor("#000000");

    const headers = [
      { text: "NO", width: colWidths.no },
      { text: "MATERI", width: colWidths.material },
      { text: "PERNYATAAN", width: colWidths.question },
      { text: "SANGAT\nPAHAM", width: colWidths.sangat_paham },
      { text: "PAHAM", width: colWidths.paham },
      { text: "CUKUP\nPAHAM", width: colWidths.cukup_paham },
      { text: "KURANG\nPAHAM", width: colWidths.kurang_paham },
      { text: "TIDAK\nPAHAM", width: colWidths.tidak_paham },
    ];

    let currentX = marginLeft;
    headers.forEach((header) => {
      doc.text(header.text, currentX, y + 5, {
        width: header.width,
        align: "center",
        lineGap: 1,
      });
      currentX += header.width;
    });
  };

  // Draw initial table header
  drawTableHeader(tableTop);
  let currentY = tableTop + 30;
  let questionNumber = 1;

  // Optimized category processing
  const processCategory = (category) => {
    const categoryHeight = 20; // Reduced height

    if (currentY + categoryHeight > doc.page.height - 50) {
      doc.addPage();
      currentY = 70; // Increased top margin in new page
      drawTableHeader(currentY);
      currentY += 30;
    }

    // Draw outer border
    doc
      .rect(marginLeft, currentY, totalWidth, categoryHeight)
      .strokeColor("#000000")
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#000000")
      .text(category.category, marginLeft, currentY + 5, {
        width: totalWidth,
        align: "center",
      });

    currentY += categoryHeight;
  };

  // Optimized question processing
  const processQuestion = (item) => {
    doc.font("Helvetica").fontSize(9);

    const textHeight = doc.heightOfString(item.statement, {
      width: colWidths.question - 6,
      lineGap: 1,
    });
    const rowHeight = Math.max(20, textHeight + 6); // Reduced minimum height

    if (currentY + rowHeight > doc.page.height - 50) {
      doc.addPage();
      currentY = 70; // Increased top margin in new page
      drawTableHeader(currentY);
      currentY += 30;
    }

    doc.rect(marginLeft, currentY, totalWidth, rowHeight).stroke();

    let x = marginLeft;
    Object.values(colWidths).forEach((width) => {
      doc
        .moveTo(x, currentY)
        .lineTo(x, currentY + rowHeight)
        .stroke();
      x += width;
    });

    // Number
    doc.text(questionNumber.toString(), marginLeft, currentY + 5, {
      width: colWidths.no,
      align: "center",
    });

    // Material
    doc.text(item.material, marginLeft + colWidths.no + 2, currentY + 5, {
      width: colWidths.material - 4,
      align: "left",
    });

    // Statement with optimized line height
    doc.text(
      item.statement,
      marginLeft + colWidths.no + colWidths.material + 2,
      currentY + 5,
      {
        width: colWidths.question - 4,
        align: "left",
        lineGap: 1,
      }
    );

    // Response with ✔️ based on responses
    const response = responses[item.id];
    if (response === "Sangat Paham") {
      doc
        .font("Helvetica-Bold")
        .text(
          "X",
          marginLeft +
            colWidths.no +
            colWidths.material +
            colWidths.question +
            2,
          currentY + 5,
          {
            width: colWidths.sangat_paham - 4,
            align: "center",
          }
        );
    } else if (response === "Paham") {
      doc
        .font("Helvetica-Bold")
        .text(
          "X",
          marginLeft +
            colWidths.no +
            colWidths.material +
            colWidths.question +
            colWidths.sangat_paham +
            2,
          currentY + 5,
          {
            width: colWidths.paham - 4,
            align: "center",
          }
        );
    } else if (response === "Cukup Paham") {
      doc
        .font("Helvetica-Bold")
        .text(
          "X",
          marginLeft +
            colWidths.no +
            colWidths.material +
            colWidths.question +
            colWidths.sangat_paham +
            colWidths.paham +
            2,
          currentY + 5,
          {
            width: colWidths.cukup_paham - 4,
            align: "center",
          }
        );
    } else if (response === "Kurang Paham") {
      doc
        .font("Helvetica-Bold")
        .text(
          "X",
          marginLeft +
            colWidths.no +
            colWidths.material +
            colWidths.question +
            colWidths.sangat_paham +
            colWidths.paham +
            colWidths.cukup_paham +
            2,
          currentY + 5,
          {
            width: colWidths.kurang_paham - 4,
            align: "center",
          }
        );
    } else if (response === "Tidak Paham") {
      doc
        .font("Helvetica-Bold")
        .text(
          "X",
          marginLeft +
            colWidths.no +
            colWidths.material +
            colWidths.question +
            colWidths.sangat_paham +
            colWidths.paham +
            colWidths.cukup_paham +
            colWidths.kurang_paham +
            2,
          currentY + 5,
          {
            width: colWidths.tidak_paham - 4,
            align: "center",
          }
        );
    }

    currentY += rowHeight;
    questionNumber++;
  };

  // Process questions with optimized spacing
  questions.forEach((category) => {
    processCategory(category);
    category.items.forEach((item) => {
      processQuestion(item);
    });
  });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => {
      resolve({
        filename,
        filePath: filename,
      });
    });
    stream.on("error", reject);
  });
};
