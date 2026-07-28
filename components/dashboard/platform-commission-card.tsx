'use client'

import { useState, useEffect } from 'react'
import { Percent, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function PlatformCommissionCard() {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/platform-settings')
      .then((res) => res.json())
      .then((data) => setValue(String(data.commissionPercent ?? '')))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/platform-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionPercent: parseFloat(value) }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--dash-card)', border: '1px solid var(--dash-border)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: '#5C3BFE' }}>
          <Percent className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>Comisión de plataforma</p>
          <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>
            % que BonoRifa cobra sobre cada venta de organizadores externos (no aplica a tus propias rifas)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--dash-muted)' }}>
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
        </div>
      ) : (
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ color: 'var(--dash-muted)' }}>Porcentaje (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={value}
              onChange={(e) => { setValue(e.target.value); setSaved(false) }}
              className="w-28"
            />
          </div>
          <Button onClick={handleSave} disabled={saving || !value} size="sm" style={{ background: '#5C3BFE', color: '#fff', border: 'none' }}>
            {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
            Guardar
          </Button>
          {saved && <p className="text-xs font-semibold" style={{ color: 'rgba(52,211,153,1)' }}>✓ Guardado</p>}
        </div>
      )}
    </div>
  )
}
