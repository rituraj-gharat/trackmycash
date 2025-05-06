export const useSupabase = () => {
    const supabase = useNuxtApp().$supabase
    return supabase
  }
  