import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dptxuqubiodqweicypjj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdHh1cXViaW9kcXdlaWN5cGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTg5MDUsImV4cCI6MjA3OTA5NDkwNX0.04D4xdEi5sAOQ8TZ61IFH4UmiotJ48H9sllvgQaeukA";
export const supabase = createClient(supabaseUrl, supabaseKey);
