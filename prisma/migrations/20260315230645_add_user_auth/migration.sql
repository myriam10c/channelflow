-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- Create a default admin user for migration purposes
INSERT INTO "User" ("id", "email", "password", "name", "role", "createdAt", "updatedAt")
VALUES ('admin-user-id', 'admin@channelflow.com', NULL, 'Admin', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- AlterTable - add userId as nullable first
ALTER TABLE "Property" ADD COLUMN "userId" TEXT;

-- Update existing properties to link to the admin user
UPDATE "Property" SET "userId" = 'admin-user-id' WHERE "userId" IS NULL;

-- Make userId NOT NULL
ALTER TABLE "Property" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Property_userId_idx" ON "Property"("userId");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
