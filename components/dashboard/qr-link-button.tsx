'use client'

import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { QrCode, Download, Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface QrLinkButtonProps {
  url: string
  /** Titulo del modal y base del nombre del archivo descargado (ej. nombre de la rifa) */
  title?: string
  /** Texto secundario, ej. el nombre del vendedor dueno del enlace */
  subtitle?: string
}

function toFileName(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'enlace'
}

export function QrLinkButton({ url, title = 'Código QR', subtitle }: QrLinkButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `qr-${toFileName(subtitle ? `${title}-${subtitle}` : title)}.png`
    link.click()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // sin clipboard API: el enlace queda visible para copiarlo a mano
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Ver código QR"
        className="flex items-center justify-center rounded-xl px-3 py-2 transition-all"
        style={{ backgroundColor: 'var(--dash-border)', border: '1px solid var(--dash-border)', color: 'var(--dash-muted)' }}
      >
        <QrCode className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {subtitle ? `${subtitle} · ` : ''}Escanea para abrir el enlace de venta
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            {/* Fondo blanco fijo: un QR sobre fondo oscuro no lo leen todas las cámaras */}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <QRCodeCanvas
                ref={canvasRef}
                value={url}
                size={1024}
                marginSize={2}
                level="M"
                style={{ width: 240, height: 240 }}
              />
            </div>

            <p className="w-full break-all rounded-lg bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground">
              {url}
            </p>

            <div className="grid w-full grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #0e7490 0%, #6366f1 100%)' }}
              >
                <Download className="h-4 w-4" />
                Descargar
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all hover:bg-muted/50"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado' : 'Copiar enlace'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
