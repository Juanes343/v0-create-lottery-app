import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_COMMISSION_PERCENT = 10

export async function getPlatformCommissionPercent(): Promise<number> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('platform_settings')
    .select('commission_percent')
    .eq('id', 1)
    .single()

  return data ? Number(data.commission_percent) : DEFAULT_COMMISSION_PERCENT
}

export async function setPlatformCommissionPercent(percent: number): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('platform_settings')
    .update({ commission_percent: percent, updated_at: new Date().toISOString() })
    .eq('id', 1)
}
