import { randomInt } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

const PAGE_SIZE = 1000

/**
 * Todos los numeros de la rifa que ya tienen fila en sold_numbers (pagados, separados,
 * abonados o reservados por un pago en curso). Pagina de a 1000 porque PostgREST
 * corta las respuestas en ese limite.
 */
async function getTakenNumbers(supabase: SupabaseClient, raffleId: string): Promise<Set<number>> {
  const taken = new Set<number>()
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('sold_numbers')
      .select('number')
      .eq('raffle_id', raffleId)
      .order('number')
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(`Error leyendo números vendidos: ${error.message}`)
    for (const row of data ?? []) taken.add(row.number)
    if (!data || data.length < PAGE_SIZE) break
  }
  return taken
}

/**
 * Elige `quantity` numeros libres al azar dentro del rango de la rifa (Fisher-Yates
 * parcial con crypto.randomInt). Devuelve null si no quedan suficientes disponibles.
 */
export async function pickRandomAvailableNumbers(
  supabase: SupabaseClient,
  raffle: { id: string; number_range_start: number; number_range_end: number },
  quantity: number,
): Promise<number[] | null> {
  const taken = await getTakenNumbers(supabase, raffle.id)

  const available: number[] = []
  for (let n = raffle.number_range_start; n <= raffle.number_range_end; n++) {
    if (!taken.has(n)) available.push(n)
  }

  if (available.length < quantity) return null

  for (let i = 0; i < quantity; i++) {
    const j = i + randomInt(available.length - i)
    ;[available[i], available[j]] = [available[j], available[i]]
  }

  return available.slice(0, quantity).sort((a, b) => a - b)
}
