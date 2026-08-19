-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
