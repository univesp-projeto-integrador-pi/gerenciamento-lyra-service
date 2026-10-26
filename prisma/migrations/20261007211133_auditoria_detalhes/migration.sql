-- AlterTable
ALTER TABLE "auditorias" ADD COLUMN     "detalhes" JSONB;

-- CreateIndex
CREATE INDEX "auditorias_recurso_recursoId_idx" ON "auditorias"("recurso", "recursoId");
