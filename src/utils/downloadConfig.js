import fs from "fs";
import path from "path";
import { errorResponse } from "./responseWrapper.js";
import { uploadsDir } from "./uploadConfig.js";

export const handleFileDownload = (fileType) => async (req, res) => {
  try {
    const { filename } = req.params;
    let filePath;
    let contentType;

    switch (fileType) {
      case "notaDinas":
        filePath = path.join(uploadsDir.notaDinas, filename);
        contentType = "application/pdf";
        break;
      case "presentation":
        filePath = path.join(uploadsDir.presentation, filename);
        contentType =
          "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        break;
      case "questionnaire":
        filePath = path.join(uploadsDir.questionnaire, filename);
        contentType = "application/pdf";
        break;
      case "penilaian":
        filePath = path.join(uploadsDir.penilaian, filename);
        contentType = "application/pdf";
        break;
      default:
        return res.status(400).json(errorResponse("Invalid file type"));
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json(errorResponse("File not found"));
    }

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", contentType);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("Error streaming file:", error);
      return res.status(500).json(errorResponse("Error downloading file"));
    });
  } catch (error) {
    console.error("Download error:", error);
    return res
      .status(500)
      .json(errorResponse("Error processing download request"));
  }
};
