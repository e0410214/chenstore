import { createClient } from '@supabase/supabase-js';

// 🔥 替換成你的 Supabase URL 和 匿名金鑰（Anon Key）
const SUPABASE_URL = "https://upzyauibhzsjzkbabpne.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwenlhdWliaHpzanprYmFicG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMzY5OTUsImV4cCI6MjA1NDYxMjk5NX0.zMefZ8N4FVujxzs2HzT5ec1sGlabb5lMe9CSkLBCQkM";
const SUPABASE_BUCKET = "123"

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY,SUPABASE_BUCKET);

export default supabase;
