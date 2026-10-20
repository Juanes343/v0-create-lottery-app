import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Valida el "referido por" de un vendedor: debe ser otro vendedor del mismo admin.
 * Devuelve un mensaje de error, o null si es valido (o si se esta quitando: referrerId null).
 */
export async function validateReferrer(
  supabase: SupabaseClient,
  { referrerId, sellerId, ownerId }: { referrerId: string | null; sellerId?: string; ownerId: string },
): Promise<string | null> {
  if (!referrerId) return null
  if (referrerId === sellerId) return 'Un vendedor no puede ser referido de sí mismo'

  const { data: referrer } = await supabase
    .from('profiles')
    .select('id, role, created_by')
    .eq('id', referrerId)
    .single()

  if (!referrer || referrer.role !== 'vendedor' || referrer.created_by !== ownerId) {
    return 'El vendedor que refiere no existe o no es de tu equipo'
  }
  return null
}
