-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Availability" ADD VALUE 'METADATA_ONLY';
ALTER TYPE "Availability" ADD VALUE 'REGION_RESTRICTED';
ALTER TYPE "Availability" ADD VALUE 'SUBSCRIPTION_REQUIRED';
ALTER TYPE "Availability" ADD VALUE 'UNAVAILABLE';

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalSource" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "imdbId" TEXT,
ADD COLUMN     "metadataAttribution" TEXT,
ADD COLUMN     "syncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PlaybackAsset" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "episodeId" TEXT,
    "playbackProvider" TEXT NOT NULL DEFAULT 'demo',
    "streamUrl" TEXT NOT NULL,
    "licenseStart" TIMESTAMP(3),
    "licenseEnd" TIMESTAMP(3),
    "allowedRegions" TEXT NOT NULL DEFAULT '["GLOBAL"]',
    "isDrmProtected" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaybackAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaybackAsset_mediaId_episodeId_idx" ON "PlaybackAsset"("mediaId", "episodeId");

-- CreateIndex
CREATE INDEX "PlaybackAsset_status_idx" ON "PlaybackAsset"("status");

-- CreateIndex
CREATE INDEX "Media_externalSource_externalId_idx" ON "Media"("externalSource", "externalId");

-- AddForeignKey
ALTER TABLE "PlaybackAsset" ADD CONSTRAINT "PlaybackAsset_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybackAsset" ADD CONSTRAINT "PlaybackAsset_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
