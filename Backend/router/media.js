import { Router } from "express";
import { prisma } from "../utils/prismaConnection.js";
import { requireSalesOrAdmin } from "../middleware/requireSalesOrAdmin.js";
import { deleteMediaFile } from "../utils/uploadImage.js";
import { handlePrismaError } from "../utils/handlePrismaError.js";
import { logger } from "../utils/logger.js";

const router = Router();

const HIDDEN_FOLDERS = ["documents", "user"];

const toRelativePath = (url) => {
  try {
    return new URL(url).pathname.replace(/^\//, "");
  } catch {
    return null;
  }
};

// List media — pinned first, then sortOrder, then newest.
// Hidden folders (documents/, user/) are excluded from the library.
router.get("/", requireSalesOrAdmin, async (req, res) => {
  try {
    const media = await prisma.media.findMany({
      where: { folder: { notIn: HIDDEN_FOLDERS } },
      orderBy: [
        { isPinned: "desc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });
    return res.json({ success: true, data: media });
  } catch (error) {
    logger.error("Media list error:", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Failed to list media" });
  }
});

// Search media — matches label, filename, altText (case-insensitive)
router.get("/search", requireSalesOrAdmin, async (req, res) => {
  try {
    const q = (req.query.q ?? "").toString().trim();
    if (!q) return res.json({ success: true, data: [] });

    const media = await prisma.media.findMany({
      where: {
        folder: { notIn: HIDDEN_FOLDERS },
        OR: [
          { label: { contains: q, mode: "insensitive" } },
          { filename: { contains: q, mode: "insensitive" } },
          { altText: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [
        { isPinned: "desc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });
    return res.json({ success: true, data: media });
  } catch (error) {
    logger.error("Media search error:", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Failed to search media" });
  }
});

// Update media — pin, sortOrder, label (rename), altText, caption
router.patch("/:id", requireSalesOrAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid media id" });

    if (req.body.isPinned !== undefined && typeof req.body.isPinned !== "boolean") {
      return res.status(400).json({ success: false, message: "'isPinned' must be a boolean" });
    }
    if (req.body.sortOrder !== undefined && !Number.isInteger(req.body.sortOrder)) {
      return res.status(400).json({ success: false, message: "'sortOrder' must be a number" });
    }

    const allowed = {};
    for (const key of ["isPinned", "sortOrder", "label", "altText", "caption"]) {
      if (req.body[key] !== undefined) allowed[key] = req.body[key];
    }
    if (Object.keys(allowed).length === 0) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }

    const media = await prisma.media.update({ where: { id }, data: allowed });
    return res.json({ success: true, data: media });
  } catch (error) {
    logger.error("Media update error:", { error: error.message, stack: error.stack });
    if (handlePrismaError(res, error, "Media")) return;
    return res.status(500).json({ success: false, message: "Failed to update media" });
  }
});

// Delete media — removes file from disk and DB record
router.delete("/:id", requireSalesOrAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid media id" });

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return res.status(404).json({ success: false, message: "Media not found" });

    const relPath = toRelativePath(media.url);
    if (relPath) {
      deleteMediaFile(relPath);
    }

    await prisma.media.delete({ where: { id } });
    return res.json({ success: true, message: "Media deleted" });
  } catch (error) {
    logger.error("Media delete error:", { error: error.message, stack: error.stack });
    if (handlePrismaError(res, error, "Media")) return;
    return res.status(500).json({ success: false, message: "Failed to delete media" });
  }
});

export default router;
