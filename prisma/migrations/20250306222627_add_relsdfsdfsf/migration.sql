-- CreateTable
CREATE TABLE "Grant" (
    "id" TEXT NOT NULL,
    "mouDate" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "grantTotal" DOUBLE PRECISION NOT NULL,
    "grantInf" DOUBLE PRECISION NOT NULL,
    "grantTrain" DOUBLE PRECISION NOT NULL,
    "grantInfSp" DOUBLE PRECISION NOT NULL,
    "grantTrainSp" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Grant_pkey" PRIMARY KEY ("id")
);
