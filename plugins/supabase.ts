import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  console.log('[Supabase Plugin] URL:', config.public.supabaseUrl)
  console.log('[Supabase Plugin] ANON KEY:', config.public.supabaseAnonKey)

  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey
  )

  nuxtApp.provide('supabase', supabase)
})
