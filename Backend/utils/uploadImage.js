import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { logger } from "./logger.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Restrict upload folders to safe relative paths: alphanumeric segments,
// single-level nesting, no "..", no leading "/", no backslashes.
// Prevents path traversal via req.body.folder (e.g. "../../etc").
const FOLDER_SEGMENT_RE = /^[a-zA-Z0-9_-]+$/;

const sanitizeFolder = (folder) => {
  const raw = String(folder || "").trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!raw) return null;
  const segments = raw.split("/").filter(Boolean);
  if (segments.length > 2) return null;
  for (const seg of segments) {
    if (!FOLDER_SEGMENT_RE.test(seg)) return null;
  }
  return segments.join("/");
};

// Public validator so routes can reject unsafe folders before multer runs
export const isValidUploadFolder = (folder) => sanitizeFolder(folder) !== null;

const ALLOWED_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
];

const CONVERTIBLE_MIMETYPES = ["image/jpeg", "image/png", "image/gif"];

// Images sharp can process (JPEG/PNG/GIF → WebP; WebP → recompress/resize)
const PROCESSABLE_MIMETYPES = [...CONVERTIBLE_MIMETYPES, "image/webp"];

/**
 * Upload images with flexible folder + filename support
 * Auto-converts JPEG/PNG/GIF → WebP using sharp
 *
 * Usage:
 *   uploadImage("documents")           → saves to public/documents/
 *   uploadImage("india/trip")          → saves to public/india/trip/
 */
export const uploadImage = (folderName = "images") => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const safeFolder = sanitizeFolder(req.body?.folder) || folderName;
      const uploadPath = path.join("public", safeFolder);

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
      const userFilename = req.body?.filename;
      const rawName = userFilename || file.originalname;
      const safeName = rawName
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .replace(/^(.+?)\.[a-z0-9]+$/, "$1");
      const ext = CONVERTIBLE_MIMETYPES.includes(file.mimetype) ? ".webp" : path.extname(file.originalname) || ".webp";
      const safeFolder = sanitizeFolder(req.body?.folder) || folderName;
      const uploadPath = path.join("public", safeFolder);
      const baseName = safeName && safeName !== "." ? safeName : "image";

      // Clean, readable filename. If the name already exists, append -1, -2 …
      // so uploads never silently overwrite an existing image.
      let candidate = baseName + ext;
      let counter = 1;
      while (fs.existsSync(path.join(uploadPath, candidate))) {
        candidate = `${safeName}-${counter}${ext}`;
        counter++;
      }
      cb(null, candidate);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only images and PDFs are allowed (max 10MB)"), false);
      }
    },
  });

  // Wrap multer to add sharp conversion middleware
  return {
    single: (fieldName) => {
      return async (req, res, next) => {
        upload.single(fieldName)(req, res, async (err) => {
          if (err) return next(err);
          if (!req.file) return next();

          // Convert to WebP if processable, cap width at 1920px
          if (PROCESSABLE_MIMETYPES.includes(req.file.mimetype)) {
            try {
              const webpBuffer = await sharp(req.file.buffer || req.file.path)
                .resize({ width: 1920, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

              // Rewrite file with WebP
              const webpPath = req.file.path.replace(/\.[^.]+$/, ".webp");
              fs.writeFileSync(webpPath, webpBuffer);

              // Delete original if different path
              if (req.file.path !== webpPath && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
              }

              req.file.path = webpPath;
              req.file.filename = path.basename(webpPath);
              req.file.mimetype = "image/webp";
              req.file.size = webpBuffer.length;
            } catch (convErr) {
              logger.error("WebP conversion failed, keeping original:", { message: convErr.message });
            }
          }
          next();
        });
      };
    },
    fields: (fields) => {
      return async (req, res, next) => {
        upload.fields(fields)(req, res, async (err) => {
          if (err) return next(err);
          if (!req.files) return next();

          // Convert each uploaded file to WebP
          for (const fieldFiles of Object.values(req.files)) {
            for (const file of fieldFiles) {
              if (PROCESSABLE_MIMETYPES.includes(file.mimetype)) {
                try {
                  const webpBuffer = await sharp(file.buffer || file.path)
                    .resize({ width: 1920, withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toBuffer();

                  const webpPath = file.path.replace(/\.[^.]+$/, ".webp");
                  fs.writeFileSync(webpPath, webpBuffer);

                  if (file.path !== webpPath && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                  }

                  file.path = webpPath;
                  file.filename = path.basename(webpPath);
                  file.mimetype = "image/webp";
                  file.size = webpBuffer.length;
                } catch (convErr) {
                  logger.error("WebP conversion failed for", { filename: file.filename, message: convErr.message });
                }
              }
            }
          }
          next();
        });
      };
    },
  };
};

// Delete old image from any folder
export const deleteOldImage = (filePath) => {
  if (!filePath) return;

  let fullPath;
  if (filePath.startsWith("http")) {
    const urlPath = new URL(filePath).pathname;
    fullPath = path.join(process.cwd(), "public", urlPath);
  } else if (filePath.startsWith("/")) {
    fullPath = path.join(process.cwd(), "public", filePath);
  } else {
    fullPath = path.join(process.cwd(), "public", filePath);
  }

  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      logger.info("Old image deleted:", { fullPath });
    } catch (err) {
      logger.error("Failed to delete old image:", { fullPath, message: err.message });
    }
  }
};

// Delete image by relative path (e.g. "india/trip/india.webp")
export const deleteMediaFile = (relativePath) => {
  if (!relativePath) return false;
  const fullPath = path.join(process.cwd(), "public", relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
};
