/*
  Warnings:

  - The primary key for the `session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[name]` on the table `Teams` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `Traveller` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EngagementModel" AS ENUM ('COMMISSION', 'SERVICE');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('COMMISSION', 'SERVICE_FEE', 'FULL_PACKAGE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "BannerEntityType" AS ENUM ('Country', 'State', 'City', 'Journey', 'Month', 'TravelExperience');

-- CreateEnum
CREATE TYPE "FaqEntityType" AS ENUM ('Country', 'State', 'City', 'Journey', 'Month', 'TravelExperience');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "adults" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "advanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "balanceTerms" TEXT,
ADD COLUMN     "bannerImageUrl" JSONB,
ADD COLUMN     "children" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "destination" TEXT,
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "excludes" TEXT[],
ADD COLUMN     "includes" TEXT[],
ADD COLUMN     "isEmailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isWhatsappSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "itinerary" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "packageName" TEXT,
ADD COLUMN     "quotationNo" TEXT,
ADD COLUMN     "travelDate" TEXT,
ADD COLUMN     "validTill" TEXT;

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "carName" TEXT,
ADD COLUMN     "carOwnerName" TEXT,
ADD COLUMN     "carType" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "guideLanguage" TEXT,
ADD COLUMN     "guideName" TEXT,
ADD COLUMN     "hotelName" TEXT,
ADD COLUMN     "hotelType" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "vendorId" INTEGER;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "amount" DOUBLE PRECISION,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" INTEGER,
ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "paymentType" TEXT DEFAULT 'ADVANCE';

-- AlterTable
ALTER TABLE "Teams" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Traveller" ADD COLUMN     "bookingStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "budgetRange" TEXT,
ADD COLUMN     "destination" TEXT,
ADD COLUMN     "groupSize" INTEGER,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "selectedJourney" TEXT,
ADD COLUMN     "selectedJourneyId" INTEGER,
ADD COLUMN     "source" TEXT DEFAULT 'website',
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TravellerRequirementConfirmation" ADD COLUMN     "dropLocation" TEXT,
ADD COLUMN     "isEmailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isWhatsappSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pickupLocation" TEXT,
ADD COLUMN     "specialRequirements" TEXT,
ADD COLUMN     "travelTime" TEXT,
ADD COLUMN     "vehiclePreference" TEXT;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankIfscCode" TEXT,
ADD COLUMN     "defaultCommission" DOUBLE PRECISION,
ADD COLUMN     "engagementModel" "EngagementModel" NOT NULL DEFAULT 'SERVICE',
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ALTER COLUMN "vendarName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "session" DROP CONSTRAINT "session_pkey",
ALTER COLUMN "sid" SET DATA TYPE TEXT,
ALTER COLUMN "sess" SET DATA TYPE JSONB,
ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "chatAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastChatActiveAt" TIMESTAMP(3),
ADD COLUMN     "lockedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "chat_conversations" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "touristName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "travellerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastChannel" TEXT NOT NULL DEFAULT 'web',
    "lastMessageAt" TIMESTAMP(3),
    "assignedToUserId" INTEGER,
    "botState" TEXT NOT NULL DEFAULT 'AWAITING_NAME',
    "needsData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'web',
    "direction" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "buttons" JSONB,
    "source" TEXT NOT NULL DEFAULT 'bot',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_faqs" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "keywords" TEXT[],
    "answer" TEXT NOT NULL,
    "linkType" TEXT,
    "linkEntityId" INTEGER,
    "linkTitle" TEXT,
    "linkUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_unanswered" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "raw" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'open',
    "source" TEXT NOT NULL DEFAULT 'no_faq',
    "destination" TEXT,
    "conversationId" INTEGER,
    "answeredFaqId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_unanswered_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorAssignment" (
    "id" SERIAL NOT NULL,
    "travellerId" INTEGER NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "services" TEXT[],
    "packageType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "commissionRate" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "serviceWiseAmount" JSONB,
    "serviceWiseDetails" JSONB,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayment" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "assignmentId" INTEGER,
    "invoiceNo" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingAmount" DOUBLE PRECISION NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentInstallment" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "transactionId" TEXT,
    "paymentSlip" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "targetRole" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourPackage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 0,
    "pricePerPerson" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPrice" DOUBLE PRECISION,
    "bannerImageUrl" JSONB,
    "shortDescription" TEXT,
    "description" TEXT,
    "itinerary" JSONB NOT NULL DEFAULT '[]',
    "hotelDetails" JSONB NOT NULL DEFAULT '[]',
    "carDetails" JSONB NOT NULL DEFAULT '[]',
    "guideDetails" JSONB NOT NULL DEFAULT '[]',
    "includes" TEXT[],
    "excludes" TEXT[],
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBestSelling" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" SERIAL NOT NULL,
    "images" TEXT[],
    "bannerTitle" TEXT NOT NULL,
    "bannerTag" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "overView" TEXT,
    "seoKeyword" TEXT,
    "canonical" TEXT,
    "seoTitle" TEXT,
    "h1Title" TEXT,
    "thumbImg" TEXT,
    "moreDescription" TEXT,
    "capital" TEXT,
    "currency" TEXT,
    "language" TEXT,
    "timezone" TEXT,
    "bestTimeToVisit" TEXT,
    "dialCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showOnSite" BOOLEAN NOT NULL DEFAULT true,
    "activeSnapshot" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "overView" TEXT,
    "seoKeyword" TEXT,
    "canonical" TEXT,
    "seoTitle" TEXT,
    "h1Title" TEXT,
    "thumbImg" TEXT,
    "moreDescription" TEXT,
    "capital" TEXT,
    "language" TEXT,
    "famousFor" TEXT,
    "area" TEXT,
    "countryId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showOnSite" BOOLEAN NOT NULL DEFAULT true,
    "activeSnapshot" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "overView" TEXT,
    "seoKeyword" TEXT,
    "canonical" TEXT,
    "seoTitle" TEXT,
    "h1Title" TEXT,
    "thumbImg" TEXT,
    "moreDescription" TEXT,
    "famousFor" TEXT,
    "attractions" TEXT,
    "weather" TEXT,
    "stateId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showOnSite" BOOLEAN NOT NULL DEFAULT true,
    "activeSnapshot" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Month" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "season" TEXT,
    "seoDescription" TEXT NOT NULL,
    "overView" TEXT,
    "seoKeyword" TEXT,
    "canonical" TEXT,
    "seoTitle" TEXT,
    "h1Title" TEXT,
    "thumbImg" TEXT,
    "moreDescription" TEXT,
    "weather" TEXT,
    "bestFor" TEXT,
    "festivals" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activeSnapshot" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Month_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelExperience" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "overView" TEXT,
    "seoKeyword" TEXT,
    "canonical" TEXT,
    "seoTitle" TEXT,
    "h1Title" TEXT,
    "thumbImg" TEXT,
    "moreDescription" TEXT,
    "type" TEXT,
    "idealFor" TEXT,
    "duration" TEXT,
    "budgetRange" TEXT,
    "highlights" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activeSnapshot" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TravelExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" SERIAL NOT NULL,
    "ques" TEXT NOT NULL,
    "ans" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journey" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "overView" TEXT,
    "seoKeyword" TEXT,
    "canonical" TEXT,
    "seoTitle" TEXT,
    "h1Title" TEXT,
    "thumbImg" TEXT,
    "moreDescription" TEXT,
    "destination" TEXT,
    "duration" TEXT,
    "noDays" INTEGER NOT NULL,
    "pricePerPerson" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPrice" DOUBLE PRECISION,
    "highlights" TEXT[],
    "hotelDetails" JSONB,
    "carDetails" JSONB,
    "guideDetails" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBestSelling" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cityOrder" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "travelExperienceOrder" INTEGER[] DEFAULT ARRAY[]::INTEGER[],

    CONSTRAINT "Journey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyDay" (
    "id" SERIAL NOT NULL,
    "day" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "journeyId" INTEGER NOT NULL,

    CONSTRAINT "JourneyDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhyChoose" (
    "id" SERIAL NOT NULL,
    "choseUsList" TEXT[],
    "journeyId" INTEGER NOT NULL,

    CONSTRAINT "WhyChoose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inclusion" (
    "id" SERIAL NOT NULL,
    "inclusionList" TEXT[],
    "journeyId" INTEGER NOT NULL,

    CONSTRAINT "Inclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exclusion" (
    "id" SERIAL NOT NULL,
    "inclusionList" TEXT[],
    "journeyId" INTEGER NOT NULL,

    CONSTRAINT "Exclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPolicy" (
    "id" SERIAL NOT NULL,
    "inclusionList" TEXT[],
    "journeyId" INTEGER NOT NULL,

    CONSTRAINT "BookingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsPage" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "moreDescription" TEXT,
    "seoTitle" TEXT,
    "h1Title" TEXT,
    "seoKeyword" TEXT,
    "canonical" TEXT,
    "thumbImg" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "moreDescription" TEXT,
    "author" TEXT,
    "category" TEXT,
    "tags" TEXT,
    "publishedAt" TEXT,
    "thumbImg" TEXT,
    "seoTitle" TEXT,
    "h1Title" TEXT,
    "seoKeyword" TEXT,
    "canonical" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "folder" TEXT,
    "originalName" TEXT,
    "label" TEXT,
    "altText" TEXT,
    "caption" TEXT,
    "category" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT,
    "userId" INTEGER,
    "ipAddress" TEXT,
    "country" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "referrer" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "pagePath" TEXT NOT NULL,
    "sectionId" TEXT,
    "dwellTimeMs" INTEGER,
    "element" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_intents" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "searchQuery" TEXT,
    "destination" TEXT,
    "dateModified" BOOLEAN NOT NULL DEFAULT false,
    "filtersApplied" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replay_events" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "replay_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ad_landing_pages" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "theme" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT NOT NULL,
    "h1Title" TEXT,
    "bannerImages" TEXT[],
    "whyChooseImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "heroHeading" TEXT,
    "heroSubheading" TEXT,
    "ctaText" TEXT DEFAULT 'Enquire Now',
    "ctaFormEnabled" BOOLEAN NOT NULL DEFAULT true,
    "linkedJourneyIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "linkedTourPackageIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "linkedDestinationType" TEXT,
    "linkedDestinationIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "sectionsOrder" JSONB,
    "customCardOverrides" JSONB,
    "customFaqs" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "utmSource" TEXT,
    "utmCampaign" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_gallery" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CityToJourney" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CityToJourney_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_JourneyToMonth" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_JourneyToMonth_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_JourneyToTravelExperience" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_JourneyToTravelExperience_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_conversations_token_key" ON "chat_conversations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "chat_conversations_travellerId_key" ON "chat_conversations"("travellerId");

-- CreateIndex
CREATE INDEX "chat_conversations_phone_idx" ON "chat_conversations"("phone");

-- CreateIndex
CREATE INDEX "chat_conversations_status_idx" ON "chat_conversations"("status");

-- CreateIndex
CREATE INDEX "chat_conversations_assignedToUserId_idx" ON "chat_conversations"("assignedToUserId");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_idx" ON "chat_messages"("conversationId");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_id_idx" ON "chat_messages"("conversationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_unanswered_question_key" ON "chat_unanswered"("question");

-- CreateIndex
CREATE INDEX "chat_unanswered_status_idx" ON "chat_unanswered"("status");

-- CreateIndex
CREATE INDEX "chat_unanswered_answeredFaqId_idx" ON "chat_unanswered"("answeredFaqId");

-- CreateIndex
CREATE INDEX "VendorAssignment_travellerId_idx" ON "VendorAssignment"("travellerId");

-- CreateIndex
CREATE INDEX "VendorAssignment_vendorId_idx" ON "VendorAssignment"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPayment_invoiceNo_key" ON "VendorPayment"("invoiceNo");

-- CreateIndex
CREATE INDEX "VendorPayment_vendorId_idx" ON "VendorPayment"("vendorId");

-- CreateIndex
CREATE INDEX "VendorPayment_assignmentId_idx" ON "VendorPayment"("assignmentId");

-- CreateIndex
CREATE INDEX "notifications_userId_targetRole_read_idx" ON "notifications"("userId", "targetRole", "read");

-- CreateIndex
CREATE UNIQUE INDEX "TourPackage_slug_key" ON "TourPackage"("slug");

-- CreateIndex
CREATE INDEX "Banner_entityType_entityId_idx" ON "Banner"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "country_slug_key" ON "country"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "State_slug_key" ON "State"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Month_slug_key" ON "Month"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TravelExperience_slug_key" ON "TravelExperience"("slug");

-- CreateIndex
CREATE INDEX "Faq_entityType_entityId_idx" ON "Faq"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Journey_slug_key" ON "Journey"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CmsPage_slug_key" ON "CmsPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_name_key" ON "BlogCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Media_url_key" ON "Media"("url");

-- CreateIndex
CREATE INDEX "Media_folder_idx" ON "Media"("folder");

-- CreateIndex
CREATE INDEX "Media_category_idx" ON "Media"("category");

-- CreateIndex
CREATE INDEX "user_sessions_visitorId_idx" ON "user_sessions"("visitorId");

-- CreateIndex
CREATE INDEX "user_sessions_startedAt_idx" ON "user_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "activity_logs_sessionId_idx" ON "activity_logs"("sessionId");

-- CreateIndex
CREATE INDEX "activity_logs_eventName_idx" ON "activity_logs"("eventName");

-- CreateIndex
CREATE INDEX "search_intents_sessionId_idx" ON "search_intents"("sessionId");

-- CreateIndex
CREATE INDEX "search_intents_destination_idx" ON "search_intents"("destination");

-- CreateIndex
CREATE INDEX "replay_events_sessionId_createdAt_idx" ON "replay_events"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ad_landing_pages_slug_key" ON "ad_landing_pages"("slug");

-- CreateIndex
CREATE INDEX "ad_landing_pages_slug_idx" ON "ad_landing_pages"("slug");

-- CreateIndex
CREATE INDEX "ad_landing_pages_isActive_idx" ON "ad_landing_pages"("isActive");

-- CreateIndex
CREATE INDEX "_CityToJourney_B_index" ON "_CityToJourney"("B");

-- CreateIndex
CREATE INDEX "_JourneyToMonth_B_index" ON "_JourneyToMonth"("B");

-- CreateIndex
CREATE INDEX "_JourneyToTravelExperience_B_index" ON "_JourneyToTravelExperience"("B");

-- CreateIndex
CREATE INDEX "FollowupNote_travellerId_idx" ON "FollowupNote"("travellerId");

-- CreateIndex
CREATE INDEX "Invoice_travellerId_idx" ON "Invoice"("travellerId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceItem_vendorId_idx" ON "InvoiceItem"("vendorId");

-- CreateIndex
CREATE INDEX "Payment_travellerId_idx" ON "Payment"("travellerId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Teams_name_key" ON "Teams"("name");

-- CreateIndex
CREATE INDEX "TourBooking_travellerId_idx" ON "TourBooking"("travellerId");

-- CreateIndex
CREATE INDEX "TourBooking_assignedToUserId_idx" ON "TourBooking"("assignedToUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Traveller_phone_key" ON "Traveller"("phone");

-- CreateIndex
CREATE INDEX "Traveller_assignedToUserId_idx" ON "Traveller"("assignedToUserId");

-- CreateIndex
CREATE INDEX "Traveller_vendorId_idx" ON "Traveller"("vendorId");

-- CreateIndex
CREATE INDEX "Traveller_bookingStatus_idx" ON "Traveller"("bookingStatus");

-- CreateIndex
CREATE INDEX "Traveller_travelDate_idx" ON "Traveller"("travelDate");

-- CreateIndex
CREATE INDEX "Traveller_status_idx" ON "Traveller"("status");

-- CreateIndex
CREATE INDEX "Traveller_phone_idx" ON "Traveller"("phone");

-- CreateIndex
CREATE INDEX "VehicleBooking_travellerId_idx" ON "VehicleBooking"("travellerId");

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "Traveller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_unanswered" ADD CONSTRAINT "chat_unanswered_answeredFaqId_fkey" FOREIGN KEY ("answeredFaqId") REFERENCES "chat_faqs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAssignment" ADD CONSTRAINT "VendorAssignment_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "Traveller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAssignment" ADD CONSTRAINT "VendorAssignment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "VendorAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentInstallment" ADD CONSTRAINT "PaymentInstallment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "VendorPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "State" ADD CONSTRAINT "State_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyDay" ADD CONSTRAINT "JourneyDay_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhyChoose" ADD CONSTRAINT "WhyChoose_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inclusion" ADD CONSTRAINT "Inclusion_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exclusion" ADD CONSTRAINT "Exclusion_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPolicy" ADD CONSTRAINT "BookingPolicy_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "user_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_intents" ADD CONSTRAINT "search_intents_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "user_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replay_events" ADD CONSTRAINT "replay_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "user_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CityToJourney" ADD CONSTRAINT "_CityToJourney_A_fkey" FOREIGN KEY ("A") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CityToJourney" ADD CONSTRAINT "_CityToJourney_B_fkey" FOREIGN KEY ("B") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JourneyToMonth" ADD CONSTRAINT "_JourneyToMonth_A_fkey" FOREIGN KEY ("A") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JourneyToMonth" ADD CONSTRAINT "_JourneyToMonth_B_fkey" FOREIGN KEY ("B") REFERENCES "Month"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JourneyToTravelExperience" ADD CONSTRAINT "_JourneyToTravelExperience_A_fkey" FOREIGN KEY ("A") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JourneyToTravelExperience" ADD CONSTRAINT "_JourneyToTravelExperience_B_fkey" FOREIGN KEY ("B") REFERENCES "TravelExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
