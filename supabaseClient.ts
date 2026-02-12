import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://isdywilbkneoxhotovts.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZHl3aWxia25lb3hob3RvdnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDM2ODgsImV4cCI6MjA4NjMxOTY4OH0.xqS35yKh6Qbp2nXiqM23hxqaFV7sAKZCT9jAiHtLMB4"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

