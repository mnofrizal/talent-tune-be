import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const notaDinasUploadsDir = path.join(
  __dirname,
  "..",
  "uploads",
  "assesment",
  "nota-dinas"
);

const presentationUploadsDir = path.join(
  __dirname,
  "..",
  "uploads",
  "assesment",
  "ppt"
);

const questionnaireUploadsDir = path.join(
  __dirname,
  "..",
  "uploads",
  "assesment",
  "questionnaire"
);

const penilaianUploadsDir = path.join(
  __dirname,
  "..",
  "uploads",
  "assesment",
  "penilaian"
);

// Configure storage for nota dinas files
const notaDinasStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, notaDinasUploadsDir);
  },
  filename: function (req, file, cb) {
    const date = new Date();
    const timestamp =
      date.getDate().toString().padStart(2, "0") +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      date.getFullYear() +
      date.getHours().toString().padStart(2, "0") +
      date.getMinutes().toString().padStart(2, "0") +
      date.getSeconds().toString().padStart(2, "0");
    const filename = `nodin_${timestamp}${path.extname(file.originalname)}`;
    cb(null, filename);
  },
});

// Configure storage for presentation files
const presentationStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, presentationUploadsDir);
  },
  filename: function (req, file, cb) {
    const date = new Date();
    const timestamp =
      date.getDate().toString().padStart(2, "0") +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      date.getFullYear() +
      date.getHours().toString().padStart(2, "0") +
      date.getMinutes().toString().padStart(2, "0") +
      date.getSeconds().toString().padStart(2, "0");
    const filename = `presentation_${timestamp}${path.extname(
      file.originalname
    )}`;
    cb(null, filename);
  },
});

// Configure multer for nota dinas files
const notaDinasUpload = multer({
  storage: notaDinasStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Configure multer for presentation files
const presentationUpload = multer({
  storage: presentationStorage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PPT and PPTX files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for presentations
  },
});

// Export the configured multer middleware
export const upload = {
  notaDinas: notaDinasUpload,
  presentation: presentationUpload,
};

// Export the uploads directory paths
export const uploadsDir = {
  notaDinas: notaDinasUploadsDir,
  presentation: presentationUploadsDir,
  questionnaire: questionnaireUploadsDir,
  penilaian: penilaianUploadsDir,
};
