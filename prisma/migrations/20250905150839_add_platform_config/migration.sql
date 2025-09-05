-- CreateTable
CREATE TABLE "platform_configs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Qoder和通义灵码 AI Coding 作品秀',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_configs_pkey" PRIMARY KEY ("id")
);
