-- AlterTable
ALTER TABLE "works" ADD COLUMN     "fileSize" BIGINT,
ADD COLUMN     "imagePath" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "ossKey" TEXT,
ADD COLUMN     "ossUrl" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
