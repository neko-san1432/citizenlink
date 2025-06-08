import { createClient } from "https://esm.sh/@supabase/supabase-js";
let DB_PUB_API =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcHNjc2NqbWZjeXdvYWtncnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NDc5MjcsImV4cCI6MjA1OTMyMzkyN30.2Il7ghBSgOvh5nklss7bgcvrV4WeXbT2FmkR273gPIc";
let DB_PUB_URL = "https://lspscscjmfcywoakgrtf.supabase.co";
export const supabase = createClient(DB_PUB_URL, DB_PUB_API);
