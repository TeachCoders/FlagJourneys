import express from "express";
import { prisma } from "../utils/prismaConnection.js";
import bcrypt from "bcryptjs";
import { z } from "zod";
const router = express.Router();
import { uploadImage, deleteOldImage } from "../utils/uploadImage.js";
import { logger } from "../utils/logger.js";

const LOGIN_LOCK_THRESHOLD = 5;
const LOGIN_LOCK_MINUTES = 15;

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email format").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

const passwordComplexity = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

function isLocked(entity) {
  if (!entity.lockedUntil) return false;
  return new Date(entity.lockedUntil) > new Date();
}

async function recordFailedLogin(entity) {
  if (!entity) return;
  const attempts = (entity.failedLoginAttempts || 0) + 1;
  const update = { failedLoginAttempts: attempts };
  if (attempts >= LOGIN_LOCK_THRESHOLD) {
    update.lockedUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);
  }
  if (entity.vendarEmail !== undefined) {
    await prisma.vendor.update({ where: { id: entity.id }, data: update });
  } else {
    await prisma.users.update({ where: { id: entity.id }, data: update });
  }
}

async function resetFailedLogins(entity) {
  if (!entity) return;
  if (entity.failedLoginAttempts === 0 && !entity.lockedUntil) return;
  const data = { failedLoginAttempts: 0, lockedUntil: null };
  if (entity.vendarEmail !== undefined) {
    await prisma.vendor.update({ where: { id: entity.id }, data });
  } else {
    await prisma.users.update({ where: { id: entity.id }, data });
  }
}

router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).send({
        success: false,
        message: parsed.error.issues[0].message,
      });
    }
    const { email, password } = parsed.data;

    let user = await prisma.users.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      include: { team: { select: { id: true, name: true } } },
    });

    let vendor = null;
    if (!user) {
      vendor = await prisma.vendor.findFirst({
        where: { vendarEmail: { equals: email, mode: "insensitive" } },
        include: { vendorGroup: true },
      });
    }

    const target = user || vendor;
    if (!target) {
      return res.status(401).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!target.isActive && !vendor) {
      return res.status(403).send({
        success: false,
        message: "Your account is currently inactive. Please contact support.",
      });
    }
    if (vendor && !vendor.vendarIsActive) {
      return res.status(403).send({
        success: false,
        message: "Your account is currently inactive. Please contact support.",
      });
    }

    if (isLocked(target)) {
      const remaining = Math.ceil((new Date(target.lockedUntil) - new Date()) / 60000);
      return res.status(423).send({
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${remaining} minutes.`,
      });
    }

    const storedHash = user ? user.hasPassword : vendor.vendarPassword;
    if (!storedHash) {
      return res.status(401).send({ success: false, message: "Invalid email or password" });
    }
    const isValidPassword = await bcrypt.compare(password, storedHash);

    if (!isValidPassword) {
      await recordFailedLogin(user || vendor);
      return res.status(401).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user) await resetFailedLogins(user);
    if (vendor) await resetFailedLogins(vendor);

    let userDetials;
    if (user) {
      userDetials = {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        bannerImage: user.bannerImage,
        isActive: user.isActive,
        role: user.role,
        team: user.team || null,
      };
    } else {
      userDetials = {
        id: vendor.id,
        name: vendor.vendarCompanyName || vendor.vendarName,
        email: vendor.vendarEmail,
        profileImage: vendor.vendarProfileImage,
        bannerImage: vendor.vendarBannerImage,
        isActive: vendor.vendarIsActive,
        role: "vendor",
        vendorType: vendor.vendarServiceType,
        vendorGroup: vendor.vendorGroup,
        companyName: vendor.vendarCompanyName,
      };
    }

    // Clear any stale session cookies from previous domain/deployment so the
    // freshly regenerated session isn't shadowed by an older cookie that the
    // browser may still be sending for the api subdomain.
    res.clearCookie("connect.sid", { domain: ".flagjourneys.com", path: "/" });
    res.clearCookie("connect.sid", { domain: "api.flagjourneys.com", path: "/" });
    res.clearCookie("connect.sid");

    req.session.regenerate((regenErr) => {
      if (regenErr) {
        logger.error("Session regeneration error:", { regenErr });
        return res.status(500).send({ success: false, message: "Internal Server Error" });
      }
      req.session.user = userDetials;
      req.session.save((saveErr) => {
        if (saveErr) {
          logger.error("Session save error:", { saveErr });
          return res.status(500).send({ success: false, message: "Internal Server Error" });
        }
        return res.status(200).send({
          success: true,
          message: "Successfully logged in",
          info: userDetials,
        });
      });
    });
  } catch (err) {
    logger.error("Login error:", { error: err.message, stack: err.stack });
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
});

// Seed API to create Super Admin — blocked in production
router.post("/seed", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ success: false, message: "Seed route is disabled in production" });
    }
    if (process.env.ALLOW_SEED !== "true") {
      return res.status(403).json({ success: false, message: "Set ALLOW_SEED=true to use this route" });
    }

    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) {
      return res.status(500).json({ success: false, message: "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set" });
    }
    const name = "Super Admin";
    const role = "super_admin";

    const existUser = await prisma.users.findFirst({
      where: { email },
    });

    if (existUser) {
      return res.status(200).send({
        success: true,
        message: "Super Admin already seeded",
      });
    }

    const hasPassword = bcrypt.hashSync(password, 10);
    const superAdmin = await prisma.users.create({
      data: {
        name,
        email,
        role,
        hasPassword,
        isActive: true,
      },
    });

    return res.status(201).send({
      success: true,
      message: "Super Admin seeded successfully",
      info: {
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
      },
    });
  } catch (err) {
    logger.error("Seed error:", { error: err.message, stack: err.stack });
    return res.status(500).send({
      success: false,
      message: "Failed to seed super admin",
    });
  }
});

// Logout — destroy session + clear cookies
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send({ success: false, message: "Logout failed" });
    }
    res.clearCookie("connect.sid", { domain: ".flagjourneys.com", path: "/" });
    res.clearCookie("connect.sid", { domain: "api.flagjourneys.com", path: "/" });
    res.clearCookie("connect.sid");
    res.clearCookie("csrf-token");
    res.clearCookie("__Host-csrf-token");
    return res.send({ success: true, message: "Logged out successfully" });
  });
});

router.get("/me", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).send({ success: false, message: "Unauthorized" });
    }
    return res.status(200).send({ success: true, info: req.session.user });
  } catch (err) {
    logger.error("Session check error:", { error: err.message, stack: err.stack });
    return res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

// Profile update: name, profileImage, bannerImage (no email/role change)
router.put(
  "/me",
  uploadImage("user").fields([
    { name: "profileImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const sessionUser = req.session?.user;
      if (!sessionUser?.email) {
        return res.status(401).send({ success: false, message: "Unauthorized" });
      }

      const { name, password, oldPassword } = req.body;
      const profileImage = req.files?.profileImage?.[0]?.filename || null;
      const bannerImage = req.files?.bannerImage?.[0]?.filename || null;

      let hashedPassword = undefined;
      if (password) {
        const passwordCheck = passwordComplexity.safeParse(password);
        if (!passwordCheck.success) {
          return res.status(400).send({
            success: false,
            message: passwordCheck.error.issues[0].message,
          });
        }

        if (!oldPassword) {
          return res.status(400).send({ success: false, message: "Old password is required to set a new password" });
        }

        let currentHash;
        if (sessionUser.role === "vendor") {
          const vendor = await prisma.vendor.findFirst({ where: { vendarEmail: sessionUser.email } });
          currentHash = vendor?.vendarPassword;
        } else {
          const user = await prisma.users.findFirst({ where: { email: sessionUser.email } });
          currentHash = user?.hasPassword;
        }

        if (!currentHash) {
          return res.status(404).send({ success: false, message: "User not found" });
        }

        const isOldPasswordValid = await bcrypt.compare(oldPassword, currentHash);
        if (!isOldPasswordValid) {
          return res.status(401).send({ success: false, message: "Old password is incorrect" });
        }

        hashedPassword = await bcrypt.hash(password, 10);
      }

      let updated;

      if (sessionUser.role === "vendor") {
        const existing = await prisma.vendor.findFirst({ where: { vendarEmail: sessionUser.email } });
        if (!existing) return res.status(404).send({ success: false, message: "Vendor not found" });

        if (existing.vendarProfileImage && profileImage) deleteOldImage(existing.vendarProfileImage);
        if (existing.vendarBannerImage && bannerImage) deleteOldImage(existing.vendarBannerImage);

        updated = await prisma.vendor.update({
          where: { id: existing.id },
          data: {
            ...(name && { vendarName: name }),
            ...(profileImage && { vendarProfileImage: profileImage }),
            ...(bannerImage && { vendarBannerImage: bannerImage }),
            ...(hashedPassword && { vendarPassword: hashedPassword }),
          },
        });

        req.session.user = {
          ...sessionUser,
          name: updated.vendarName,
          profileImage: updated.vendarProfileImage,
          bannerImage: updated.vendarBannerImage,
        };
      } else {
        const existing = await prisma.users.findFirst({ where: { email: sessionUser.email } });
        if (!existing) return res.status(404).send({ success: false, message: "User not found" });

        if (existing.profileImage && profileImage) deleteOldImage(existing.profileImage);
        if (existing.bannerImage && bannerImage) deleteOldImage(existing.bannerImage);

        updated = await prisma.users.update({
          where: { id: existing.id },
          data: {
            ...(name && { name }),
            ...(profileImage && { profileImage }),
            ...(bannerImage && { bannerImage }),
            ...(hashedPassword && { hasPassword: hashedPassword }),
          },
        });

        req.session.user = {
          ...sessionUser,
          name: updated.name,
          profileImage: updated.profileImage,
          bannerImage: updated.bannerImage,
        };
      }

      return res.status(200).send({ success: true, message: "Profile updated", info: updated });
    } catch (err) {
      logger.error("Profile update error:", { error: err.message, stack: err.stack });
      return res.status(500).send({ success: false, message: "Internal Server Error" });
    }
  }
);

const loginRouter = router;

export { passwordComplexity };
export default loginRouter;
