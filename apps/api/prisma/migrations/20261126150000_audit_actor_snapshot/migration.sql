-- Who acted, kept on each audit entry as they were at the time.
ALTER TABLE "AuditLog" ADD COLUMN "actorRole" "Role";
ALTER TABLE "AuditLog" ADD COLUMN "actorName" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "actorEmail" TEXT;

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Existing entries: take the snapshot from the actor's current account.
UPDATE "AuditLog" a
SET "actorRole" = u."role",
    "actorName" = u."firstName" || ' ' || u."lastName",
    "actorEmail" = u."email"
FROM "User" u
WHERE a."actorId" = u."id";

-- New entries: every insert fills the snapshot, whichever code path writes it.
CREATE OR REPLACE FUNCTION audit_actor_snapshot() RETURNS trigger AS $$
BEGIN
  IF NEW."actorId" IS NOT NULL AND NEW."actorRole" IS NULL THEN
    SELECT u."role", u."firstName" || ' ' || u."lastName", u."email"
      INTO NEW."actorRole", NEW."actorName", NEW."actorEmail"
      FROM "User" u
      WHERE u."id" = NEW."actorId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AuditLog_actor_snapshot"
BEFORE INSERT ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION audit_actor_snapshot();
