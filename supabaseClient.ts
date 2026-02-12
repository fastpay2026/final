import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://isdywilbkneoxhotovts.supabase.co"
const supabaseAnonKey = "sb_publishable_mryW3oqzYneGH1p54Pwf7A_eU1RV1W2"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

