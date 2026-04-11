'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyLinkButtonProps {
  url: string
}

export function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback para navegadores sin clipboard API
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? '¡Copiado!' : 'Copiar enlace'}
      className="flex items-center justify-center rounded-xl px-3 py-2 transition-all"
      style={copied
        ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: 'rgba(52,211,153,1)' }
        : { backgroundColor: 'var(--dash-border)', border: '1px solid var(--dash-border)', color: 'var(--dash-muted)' }
      }
    >
      {copied
        ? <Check className="h-3.5 w-3.5" />
        : <Copy className="h-3.5 w-3.5" />
      }
    </button>
  )
}
