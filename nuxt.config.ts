export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],
  css: ['@/assets/css/tailwind.css'],
  supabase: {
    redirect: false // disables all automatic redirects
  }
})
