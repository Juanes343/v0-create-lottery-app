'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Eye, ShoppingCart, CheckCircle2, Clock, XCircle,
  Phone, Mail, ChevronDown, ChevronUp, Wifi, WifiOff,
} from 'lucide-react'
import { CopyLinkButton } from './copy-link-button'
import { ManualSaleModal } from './manual-sale-modal'

interface RaffleStats {
  id: string
  title: string
  prize_description: string
  status: string
  slug: string
  price_per_number: number
  sold_count: number
  total_numbers: number
  progress: number
  ownerUsername?: string
  number_range_start: number
  number_range_end: number
  currency?: string
}

interface PurchaseItem {
  id: string
  raffle_id: string
  buyer_name: string
  buyer_phone?: string
  buyer_email: string
  total_amount: number
  status: string
  payment_method?: string
  currency?: string
  created_at: string
  raffle_title?: string
  sold_numbers?: number[]
}

interface VendorRaffleCardProps {
  raffle: RaffleStats
  purchases: PurchaseItem[]
  publicUrl: string
  fullPublicUrl: string
}

const purchaseStatusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: 'check' | 'clock' | 'x' }> = {
  completed: { label: 'Pagado',    color: 'rgba(52,211,153,1)',  bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)',  icon: 'check' },
  pending:   { label: 'Pendiente', color: 'rgba(251,191,36,1)',  bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)',  icon: 'clock' },
  failed:    { label: 'Fallido',   color: 'rgba(248,113,113,1)', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)',  icon: 'x'     },
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft:     { label: 'Borrador',   color: 'rgba(148,163,184,1)', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)'  },
  active:    { label: 'Activa',     color: 'rgba(52,211,153,1)',  bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)'  },
  completed: { label: 'Completada', color: 'rgba(34,211,238,1)',  bg: 'rgba(34,211,238,0.1)',  border: 'rgba(34,211,238,0.2)'   },
  cancelled: { label: 'Cancelada',  color: 'rgba(248,113,113,1)', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)'  },
}

const MANUAL_METHODS = ['efectivo', 'transferencia', 'nequi', 'daviplata', 'otro']
const METHOD_LABELS: Record<string, string> = {
  efectivo:      'Efectivo',
  transferencia: 'Transferencia',
  nequi:         'Nequi',
  daviplata:     'Daviplata',
  otro:          'Otro',
  mercadopago:   'MercadoPago',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function PurchaseRow({ purchase }: { purchase: PurchaseItem }) {
  const pCfg = purchaseStatusConfig[purchase.status] ?? purchaseStatusConfig.pending
  const methodLabel = METHOD_LABELS[purchase.payment_method ?? ''] ?? purchase.payment_method ?? 'Manual'

  return (
    <div className="px-5 py-4">
      {/* Header compra */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #0891b2, #6366f1)' }}
          >
            {purchase.buyer_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--dash-text)' }}>
              {purchase.buyer_name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="text-xs font-medium rounded px-1.5 py-0.5"
                style={{
                  backgroundColor: 'rgba(139,92,246,0.12)',
                  color: 'rgba(167,139,250,1)',
                  border: '1px solid rgba(139,92,246,0.2)',
                }}
              >
                {methodLabel}
              </span>
              <span className="text-xs" style={{ color: 'var(--dash-muted)' }}>{formatDate(purchase.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm" style={{ color: '#22d3ee' }}>
            ${purchase.total_amount.toLocaleString('es-CO')} COP
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1"
            style={{ color: pCfg.color, backgroundColor: pCfg.bg, border: `1px solid ${pCfg.border}` }}
          >
            {pCfg.icon === 'check' && <CheckCircle2 className="h-3 w-3" />}
            {pCfg.icon === 'clock' && <Clock className="h-3 w-3" />}
            {pCfg.icon === 'x'     && <XCircle className="h-3 w-3" />}
            {pCfg.label}
          </span>
        </div>
      </div>

      {/* Grid info comprador + números */}
      <div className="grid gap-4 sm:grid-cols-2 ml-12">
        {/* Datos comprador */}
        <div className="space-y-1.5">
          {purchase.buyer_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--dash-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--dash-text)' }}>{purchase.buyer_phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--dash-muted)' }} />
            <span className="text-sm truncate" style={{ color: 'var(--dash-text)' }}>
              {purchase.buyer_email.includes('@noemail.') ? '— sin email' : purchase.buyer_email}
            </span>
          </div>
        </div>

        {/* Números */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--dash-muted)' }}>
            Numeros ({purchase.sold_numbers?.length ?? 0})
          </p>
          {purchase.sold_numbers && purchase.sold_numbers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {purchase.sold_numbers.slice(0, 20).map((num) => (
                <span
                  key={num}
                  className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold"
                  style={{
                    backgroundColor: 'rgba(34,211,238,0.12)',
                    border: '1px solid rgba(34,211,238,0.3)',
                    color: '#22d3ee',
                  }}
                >
                  {num.toString().padStart(5, '0')}
                </span>
              ))}
              {(purchase.sold_numbers?.length ?? 0) > 20 && (
                <span
                  className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold"
                  style={{
                    backgroundColor: 'rgba(139,92,246,0.12)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    color: 'rgba(167,139,250,1)',
                  }}
                >
                  +{(purchase.sold_numbers?.length ?? 0) - 20} mas
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>Pago pendiente de confirmacion</p>
          )}
        </div>
      </div>
    </div>
  )
}

function PurchaseGroup({
  title,
  icon: Icon,
  purchases,
  accentColor,
  accentBg,
  accentBorder,
}: {
  title: string
  icon: React.ElementType
  purchases: PurchaseItem[]
  accentColor: string
  accentBg: string
  accentBorder: string
}) {
  if (purchases.length === 0) return null
  return (
    <div>
      <div
        className="flex items-center gap-2 px-5 py-2"
        style={{ backgroundColor: accentBg, borderBottom: `1px solid ${accentBorder}` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: accentColor }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: accentColor }}>
          {title}
        </span>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: accentBg, border: `1px solid ${accentBorder}`, color: accentColor }}
        >
          {purchases.length}
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--dash-border)' }}>
        {purchases.map((p) => <PurchaseRow key={p.id} purchase={p} />)}
      </div>
    </div>
  )
}

export function VendorRaffleCard({ raffle, purchases, publicUrl, fullPublicUrl }: VendorRaffleCardProps) {
  const [open, setOpen] = useState(false)
  const cfg = statusConfig[raffle.status] ?? statusConfig.draft

  const onlinePurchases = purchases.filter((p) => p.payment_method === 'mercadopago')
  const manualPurchases = purchases.filter((p) => !p.payment_method || MANUAL_METHODS.includes(p.payment_method))
  const salesCount = purchases.length

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: 'var(--dash-card)',
        border: '1px solid var(--dash-border)',
        boxShadow: 'var(--dash-shadow)',
      }}
    >
      {/* Barra de color superior */}
      <div
        className="h-0.5 w-full"
        style={{
          background:
            raffle.status === 'active'    ? 'linear-gradient(90deg, #34d399, #22d3ee)' :
            raffle.status === 'completed' ? 'linear-gradient(90deg, #22d3ee, #6366f1)' :
            'rgba(255,255,255,0.1)',
        }}
      />

      {/* Contenido principal */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-3">
            <h3 className="font-bold text-lg leading-tight line-clamp-1" style={{ color: 'var(--dash-text)' }}>
              {raffle.title}
            </h3>
            <p className="text-sm mt-0.5 line-clamp-1" style={{ color: 'var(--dash-muted)' }}>
              {raffle.prize_description}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            {cfg.label}
          </span>
        </div>

        {/* Progreso */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs" style={{ color: 'var(--dash-muted)' }}>
            <span>Progreso de venta</span>
            <span className="font-semibold" style={{ color: 'var(--dash-text)' }}>{raffle.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--dash-border)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${raffle.progress}%`,
                background: raffle.status === 'active'
                  ? 'linear-gradient(90deg, #34d399, #22d3ee)'
                  : 'linear-gradient(90deg, #22d3ee, #6366f1)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--dash-muted)' }}>{raffle.sold_count} / {raffle.total_numbers} numeros</span>
            <span className="font-bold" style={{ color: '#22d3ee' }}>
              ${raffle.price_per_number.toLocaleString('es-CO')} COP
            </span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          {/* Ver rifa */}
          {publicUrl && (
            <Link
              href={publicUrl}
              target="_blank"
              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all"
              style={{
                backgroundColor: 'var(--dash-border)',
                border: '1px solid var(--dash-border)',
                color: 'var(--dash-text)',
                flex: 1,
              }}
            >
              <Eye className="h-3.5 w-3.5" />
              Ver
            </Link>
          )}

          {/* Registrar venta manual */}
          <ManualSaleModal
            raffle={{
              id: raffle.id,
              title: raffle.title,
              price_per_number: raffle.price_per_number,
              currency: raffle.currency,
              number_range_start: raffle.number_range_start,
              number_range_end: raffle.number_range_end,
            }}
          />

          {/* Ventas toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all"
            style={{
              flex: 1,
              background: open ? 'linear-gradient(135deg, #059669, #34d399)' : 'rgba(52,211,153,0.12)',
              border: `1px solid ${open ? 'rgba(52,211,153,0.5)' : 'rgba(52,211,153,0.25)'}`,
              color: open ? '#fff' : 'rgba(52,211,153,1)',
              boxShadow: open ? '0 0 12px rgba(52,211,153,0.3)' : 'none',
            }}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Ventas ({salesCount})
            {open ? <ChevronUp className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
          </button>

          {/* Copiar enlace */}
          {fullPublicUrl && <CopyLinkButton url={fullPublicUrl} />}
        </div>
      </div>

      {/* Panel de ventas expandible */}
      {open && (
        <div style={{ borderTop: '1px solid var(--dash-border)' }}>
          {/* Cabecera del panel */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ backgroundColor: 'rgba(52,211,153,0.05)' }}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" style={{ color: '#34d399' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--dash-text)' }}>
                Ventas de esta rifa
              </span>
            </div>
            <div className="flex items-center gap-3">
              {onlinePurchases.length > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(34,211,238,0.8)' }}>
                  <Wifi className="h-3 w-3" /> {onlinePurchases.length} en linea
                </span>
              )}
              {manualPurchases.length > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(167,139,250,0.8)' }}>
                  <WifiOff className="h-3 w-3" /> {manualPurchases.length} manual
                </span>
              )}
            </div>
          </div>

          {/* Sin ventas */}
          {salesCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-5">
              <ShoppingCart className="h-8 w-8 mb-2" style={{ color: 'rgba(52,211,153,0.3)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--dash-text)' }}>Sin ventas aun</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--dash-muted)' }}>
                Usa el boton Registrar para agregar una venta manual
              </p>
            </div>
          ) : (
            <div>
              {/* Ventas en línea (MercadoPago) */}
              <PurchaseGroup
                title="En linea · MercadoPago"
                icon={Wifi}
                purchases={onlinePurchases}
                accentColor="rgba(34,211,238,1)"
                accentBg="rgba(34,211,238,0.05)"
                accentBorder="rgba(34,211,238,0.15)"
              />

              {/* Ventas manuales */}
              <PurchaseGroup
                title="Ventas manuales"
                icon={WifiOff}
                purchases={manualPurchases}
                accentColor="rgba(167,139,250,1)"
                accentBg="rgba(139,92,246,0.05)"
                accentBorder="rgba(139,92,246,0.15)"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}