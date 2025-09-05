-- CreateTable
CREATE TABLE "online_counter_configs" (
    "id" TEXT NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 1075,
    "baseCount" INTEGER NOT NULL DEFAULT 1000,
    "maxCount" INTEGER NOT NULL DEFAULT 2000,
    "growthRate" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "displayText" TEXT NOT NULL DEFAULT '人正在云栖大会创作',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "online_counter_configs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "online_counter_configs" ADD CONSTRAINT "online_counter_configs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
