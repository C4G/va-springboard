-- AddForeignKey
ALTER TABLE "TrainingProgram" ADD CONSTRAINT "TrainingProgram_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
