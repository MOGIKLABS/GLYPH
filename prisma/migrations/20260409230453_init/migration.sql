-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RightsStatus" AS ENUM ('DRAFT', 'CLEARED', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "TakedownStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'ACTIONED', 'REJECTED');

-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'QUEUED',
    "title" TEXT,
    "prompt" TEXT NOT NULL,
    "durationSecRequested" INTEGER NOT NULL,
    "bpm" INTEGER,
    "key" TEXT,
    "commercialUse" BOOLEAN NOT NULL DEFAULT true,
    "declaredStyleRefs" TEXT NOT NULL DEFAULT '',
    "modelProvider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "errorMessage" TEXT,
    "audioPath" TEXT,
    "audioMime" TEXT,
    "audioDurationSec" INTEGER,

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generationId" TEXT NOT NULL,
    "modelProvider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "outputHash" TEXT,
    "paramsJson" TEXT NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RightsRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "generationId" TEXT NOT NULL,
    "commercialUse" BOOLEAN NOT NULL,
    "status" "RightsStatus" NOT NULL DEFAULT 'DRAFT',
    "declaredStyleRefs" TEXT NOT NULL DEFAULT '',
    "licenseNotes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "RightsRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TakedownNotice" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "TakedownStatus" NOT NULL DEFAULT 'OPEN',
    "claimantName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "workDescription" TEXT NOT NULL,
    "basis" TEXT NOT NULL,
    "generationId" TEXT,

    CONSTRAINT "TakedownNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "detailJson" TEXT NOT NULL DEFAULT '{}',
    "takedownId" TEXT,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedTerm" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "term" TEXT NOT NULL,

    CONSTRAINT "BlockedTerm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_generationId_key" ON "Receipt"("generationId");

-- CreateIndex
CREATE UNIQUE INDEX "RightsRecord_generationId_key" ON "RightsRecord"("generationId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedTerm_term_key" ON "BlockedTerm"("term");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RightsRecord" ADD CONSTRAINT "RightsRecord_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_takedownId_fkey" FOREIGN KEY ("takedownId") REFERENCES "TakedownNotice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
