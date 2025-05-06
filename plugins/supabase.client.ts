import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig() as unknown as { public: { supabaseUrl: string; supabaseAnonKey: string } }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey
  )

  nuxtApp.provide('supabase', supabase)
})
