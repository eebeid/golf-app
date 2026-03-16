ALTER TABLE "Settings" ADD COLUMN "ryderCupConfig" JSONB DEFAULT '{"enabled": false, "team1": [], "team2": []}'::jsonb;
