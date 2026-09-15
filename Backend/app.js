import express from "express";
import "dotenv/config";
import fs from "fs";
import path from "path";
import dns from "node:dns";
import net from "node:net";
import userRoter from "./router/user.js";
import loginRouter from "./router/auth.js";
import tourBookingRouter from "./router/tourBooking.js";
import vehicleBookingRouter from "./router/vehicleBooking.js";
import travellerLeadRouter from "./router/traveller-lead.js";
import cors from "cors";
import session from "express-session";
import pg from "pg";
import connectPgSimple from "connect-pg-simple";
import teamsRouter from "./router/team.js";
import packageBuilderRouter from "./router/package-builder-router.js";
import venderRouter from "./router/vendar.js";
import vendorGroupRouter from "./router/vendorGroup.js";
import vendorAssignmentRouter from "./router/vendorAssignment.js";
import vendorPaymentRouter from "./router/vendorPayment.js";
import travellerPaymentRouter from "./router/travellerPayment.js";
import tourPackageRouter from "./router/tourPackageRouter.js";
import notificationRouter from "./router/notification.js";
import chatRouter from "./router/chat.js";
import { uploadImage, isValidUploadFolder } from "./utils/uploadImage.js";
import { isSupabaseStorageEnabled, isPublicFolder, uploadToSupabaseStorage } from "./utils/supabaseStorage.js";
import { requireSalesOrAdmin } from "./middleware/requireSalesOrAdmin.js";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { doubleCsrf } from "csrf-csrf";

import countryRouter from "./router/country.js";
import stateRouter from "./router/state.js";
import cityRouter from "./router/city.js";
import seasonRouter from "./router/season.js";
import travelExperienceRouter from "./router/travelExperience.js";
import cmsPageRouter from "./router/cmsPage.js";
import blogPostRouter from "./router/blogPost.js";
import blogCategoryRouter from "./router/blogCategory.js";
import journeyRouter from "./router/journey.js";
import dashboardRouter from "./router/dashboard.js";
import mediaRouter from "./router/media.js";
import { prisma } from "./utils/prismaConnection.js";
import { logger, requestLogger } from "./utils/logger.js";
import analyticsRouter from "./router/analytics.js";
import adLandingPageRouter from "./router/adLandingPage.js";
import guestGalleryRouter from "./router/guestGallery.js";
import { scheduleAnalyticsRetention } from "./utils/analyticsRetention.js";
import * as Sentry from "@sentry/node";

const isProduction = process.env.NODE_ENV === "production";

const sentryEnabled = Boolean(process.env.SENTRY_DSN);
if (sentryEnabled) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: isProduction ? 0.1 : 0,
  });
}

const app = express();

if (isProduction) {
  app.set("trust proxy", 1);
}

if (isProduction) {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] === "http") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

const PgStore = connectPgSimple(session);
export const sessionPool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
sessionPool.on("error", (err) => {
  logger.error("Session pool idle client error", { message: err.message });
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = (process.env.CORS_ORIGIN || "http://localhost:3000")
        .split(",")
        .map((o) => o.trim());
      if (allowed.includes(origin)) return callback(null, true);
      if (!isProduction && (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin))) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, message: "Origin not allowed by CORS policy" });
  }
  next(err);
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", "data:", "http:", "https:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      upgradeInsecureRequests: [],
    },
  },
}));

app.use(
  session({
    store: new PgStore({ pool: sessionPool, tableName: "session", createTableIfMissing: false }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      ...(isProduction && { domain: ".flagjourneys.com" }),
    },
  })
);

app.use(cookieParser());

const { generateCsrfToken, validateRequest } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || process.env.SESSION_SECRET,
  getSessionIdentifier: (req) => req.session?.id || "no-session",
  cookieName: isProduction ? "__Host-csrf-token" : "csrf-token",
  cookieOptions: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
});

app.get("/auth/csrf-token", (req, res) => {
  const issue = () => res.json({ csrfToken: generateCsrfToken(req, res) });
  // saveUninitialized:false means a guest's freshly generated (in-memory)
  // session would NEVER persist – its id changes on every request, breaking
  // both CSRF validation and any server-side binding. Touch + save forces
  // the CURRENT session id to stick (row stored + connect.sid cookie sent).
  req.session.guest = true; // marks the session modified
  req.session.save((saveErr) => {
    if (saveErr) console.error("[CSRF] guest session save failed:", saveErr);
    issue();
  });
});

const CSRF_EXEMPT_PATHS = [
  "/auth/login",
  "/auth/logout",
  "/auth/csrf-token",
  "/traveller-lead/public/portal-login",
  "/traveller-lead/public/portal-receipt",
];

app.use((req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  if (CSRF_EXEMPT_PATHS.includes(req.path)) return next();
  if (validateRequest(req)) return next();
  return res.status(403).json({ success: false, csrf: true, message: "Invalid or missing CSRF token" });
});

app.use(requestLogger);

const PRIVATE_UPLOAD_FOLDERS = ["documents", "user"];

app.use((req, res, next) => {
  const firstSegment = req.path.split("/")[1];
  if (!PRIVATE_UPLOAD_FOLDERS.includes(firstSegment)) return next();

  const publicDir = path.resolve(process.cwd(), "public");
  const relPath = req.path.replace(/^\/+/, "").replace(/\\/g, "/");
  const filePath = path.resolve(publicDir, relPath);
  if (!filePath.startsWith(publicDir + path.sep)) {
    return res.status(400).json({ success: false, message: "Invalid path" });
  }

  let isFile = false;
  try {
    isFile = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    isFile = false;
  }
  if (!isFile) return next();

  return requireSalesOrAdmin(req, res, () => {
    try {
      res.setHeader("X-Content-Type-Options", "nosniff");
      return res.sendFile(filePath);
    } catch (err) {
      console.error("Private file serve error:", err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
});

app.use(
  express.static("public", {
    maxAge: process.env.NODE_ENV === "production" ? "30d" : 0,
    immutable: process.env.NODE_ENV === "production",
    setHeaders: (res, filePath) => {
      if (/\.(webp|jpg|jpeg|png|gif|svg|avif|ico)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      }
    },
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts, please try again later" },
});

// Frequent, low-risk auth reads (session checks / CSRF tokens) must not be
// throttled like login attempts – the whole app shell calls them on every page.
const authReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: { success: false, message: "Too many requests, please try again later" },
});

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, please try again later" },
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/user", userRoter);
// Brute-force protection only on credential endpoints; must be mounted
// BEFORE the general /auth router so it runs first.
app.use("/auth/login", authLimiter);
app.use("/auth", authReadLimiter, loginRouter);
app.use("/teams", teamsRouter);
app.use("/traveller-lead", travellerLeadRouter);
app.use("/tour-booking", publicLimiter, tourBookingRouter);
app.use("/vehicle-booking", publicLimiter, vehicleBookingRouter);
app.use("/package-builder", packageBuilderRouter);
app.use("/vender", venderRouter);
app.use("/vendor-group", vendorGroupRouter);
app.use("/vendor-assignment", vendorAssignmentRouter);
app.use("/vendor-payment", vendorPaymentRouter);
app.use("/traveller-payment", travellerPaymentRouter);
app.use("/tour-packages", tourPackageRouter);
app.use("/notifications", notificationRouter);
app.use("/chat", chatRouter);

app.use("/country", countryRouter);
app.use("/state", stateRouter);
app.use("/city", cityRouter);
app.use("/season", seasonRouter);
app.use("/holidays", travelExperienceRouter);
app.use("/cms", cmsPageRouter);
app.use("/blog", blogPostRouter);
app.use("/blog-category", blogCategoryRouter);
app.use("/journey", journeyRouter);
app.use("/media", mediaRouter);
app.use("/dashboard", dashboardRouter);
app.use("/analytics", analyticsRouter);
app.use("/ad-landing-pages", adLandingPageRouter);
app.use("/guest-gallery", guestGalleryRouter);
scheduleAnalyticsRetention();

const upload = uploadImage("content");
app.post(
  "/upload",
  requireSalesOrAdmin,
  (req, res, next) => {
    const folder = req.body?.folder;
    if (folder !== undefined && folder !== "" && typeof folder === "string" && !isValidUploadFolder(folder)) {
      return res.status(400).json({ success: false, message: "Invalid folder" });
    }
    next();
  },
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
      const relativePath = path.relative(path.join(process.cwd(), "public"), req.file.path);
      const url = req.file.publicUrl || `/${relativePath.replace(/\\/g, "/")}`;

      const folder = req.body?.folder || "content";
      const filename = req.file.filename;
      const media = await prisma.media.create({
        data: {
          filename,
          url,
          folder,
          originalName: req.file.originalname,
          label: req.body?.label || filename,
          altText: req.body?.altText || null,
          category: req.body?.category || null,
        },
      });

      return res.json({ success: true, url, media });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ success: false, message: "File upload failed" });
    }
  }
);

app.post("/media/replace", requireSalesOrAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const cleanup = () => {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    };

    const relPath = req.body?.path || "";
    if (!relPath || path.isAbsolute(relPath) || relPath.split("/").includes("..")) {
      cleanup();
      return res.status(400).json({ success: false, message: "Invalid path" });
    }

    const publicDir = path.resolve(process.cwd(), "public");
    const targetPath = path.resolve(publicDir, relPath);
    if (!targetPath.startsWith(publicDir + path.sep)) {
      cleanup();
      return res.status(400).json({ success: false, message: "Invalid path" });
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(req.file.path, targetPath);
    cleanup();

    let url = `/${relPath.replace(/\\/g, "/")}`;
    if (isSupabaseStorageEnabled() && isPublicFolder(path.dirname(relPath))) {
      const publicUrl = await uploadToSupabaseStorage({
        key: relPath.replace(/\\/g, "/"),
        buffer: fs.readFileSync(targetPath),
        contentType: req.file.mimetype,
      });
      if (publicUrl) url = publicUrl;
    }

    return res.json({ success: true, url });
  } catch (error) {
    console.error("Media replace error:", error);
    return res.status(500).json({ success: false, message: "Failed to replace file" });
  }
});

const isPrivateIp = (ip) => {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts[0] === 0 || parts[0] === 10 || parts[0] === 127) return true;
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    if (lower.startsWith("::ffff:")) return isPrivateIp(lower.slice(7));
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe80")) return true;
    return false;
  }
  return true;
};

const isSafeTarget = async (url) => {
  try {
    const addresses = await dns.promises.lookup(url.hostname, { all: true });
    return addresses.every(({ address }) => !isPrivateIp(address));
  } catch {
    return false;
  }
};

app.get("/proxy-image", requireSalesOrAdmin, async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: "URL is required" });

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid URL" });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({ success: false, message: "Only HTTP/HTTPS URLs allowed" });
    }

    if (!(await isSafeTarget(parsedUrl))) {
      return res.status(400).json({ success: false, message: "Access to this address is not allowed" });
    }

    let currentUrl = parsedUrl.href;
    let response;
    for (let i = 0; i < 5; i++) {
      response = await fetch(currentUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(15000),
        redirect: "manual",
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          return res.status(502).json({ success: false, message: "Invalid redirect" });
        }
        const nextUrl = new URL(location, currentUrl);
        if (nextUrl.protocol !== "http:" && nextUrl.protocol !== "https:") {
          return res.status(400).json({ success: false, message: "Invalid redirect protocol" });
        }
        if (!(await isSafeTarget(nextUrl))) {
          return res.status(400).json({ success: false, message: "Access to this address is not allowed" });
        }
        currentUrl = nextUrl.href;
        continue;
      }
      break;
    }

    if (!response.ok) {
      return res.status(502).json({ success: false, message: `Failed to fetch: ${response.status}` });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return res.status(400).json({ success: false, message: "URL does not point to an image" });
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    console.error("Proxy image error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to proxy image" });
  }
});

const processStart = Date.now();

app.get("/health", async (req, res) => {
  const checks = { status: "ok" };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = "up";
  } catch (error) {
    logger.error("health check: db down", { error: error.message });
    checks.db = "down";
    checks.status = "degraded";
  }

  try {
    await sessionPool.query("SELECT 1");
    checks.sessionStore = "up";
  } catch (error) {
    logger.error("health check: session store down", { error: error.message });
    checks.sessionStore = "down";
    checks.status = "degraded";
  }

  const mem = process.memoryUsage();
  checks.uptimeSec = Math.round(process.uptime());
  checks.memory = {
    rssMB: Math.round(mem.rss / 1024 / 1024),
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
  };
  checks.node = process.version;
  checks.startedAt = new Date(processStart).toISOString();

  const statusCode = checks.status === "ok" ? 200 : 503;
  res.status(statusCode).json(checks);
});

if (sentryEnabled) {
  Sentry.setupExpressErrorHandler(app);
}

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  logger.error("unhandled route error", {
    method: req.method,
    url: req.originalUrl,
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  if (sentryEnabled) Sentry.captureException(err);
  if (res.headersSent) return next(err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "File too large (max 10MB)" });
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ success: false, message: "Unexpected file field" });
  }
  if (err.name === "MulterError") {
    return res.status(400).json({ success: false, message: err.message || "Upload error" });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid JSON in request body" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body too large" });
  }
  if (err.name === "ZodError") {
    const message = err.issues?.[0]?.message || "Validation error";
    return res.status(400).json({ success: false, message });
  }
  if (err.message?.startsWith("Only images")) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: isProduction ? "Internal Server Error" : (err.message || "Internal Server Error"),
  });
});

export default app;
