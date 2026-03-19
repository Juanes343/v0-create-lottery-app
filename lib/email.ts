import nodemailer from 'nodemailer'
import { resolve4 } from 'dns/promises'

interface SendConfirmationEmailParams {
  to: string
  buyerName: string
  raffleName: string
  numbers: number[]
  totalAmount: number
  currency: string
  rafflePath: string
  businessName: string
}

export async function sendPurchaseConfirmationEmail({
  to,
  buyerName,
  raffleName,
  numbers,
  totalAmount,
  currency,
  rafflePath,
  businessName,
}: SendConfirmationEmailParams) {
  const numberDigits = Math.max(...numbers).toString().length
  const formattedNumbers = numbers
    .sort((a, b) => a - b)
    .map((n) => n.toString().padStart(numberDigits, '0'))

  const numbersHtml = formattedNumbers
    .map(
      (n) =>
        `<span style="display:inline-block;background:#16a34a;color:#fff;font-family:monospace;font-weight:700;font-size:14px;padding:4px 10px;border-radius:8px;margin:3px">${n}</span>`,
    )
    .join('')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://v0-create-lottery-app.vercel.app'
  const raffleUrl = `${siteUrl}${rafflePath}`

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:#16a34a;padding:28px 32px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px">🎉</div>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800">¡Pago confirmado!</h1>
            <p style="margin:6px 0 0;color:#bbf7d0;font-size:14px">${businessName}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:16px;color:#111827">Hola, <strong>${buyerName}</strong> 👋</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280">Tu compra en la rifa <strong style="color:#111827">${raffleName}</strong> fue registrada exitosamente.</p>

            <!-- Números -->
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#15803d">Tus números</p>
              <div>${numbersHtml}</div>
            </div>

            <!-- Total -->
            <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
              <table width="100%">
                <tr>
                  <td style="font-size:13px;color:#6b7280">Cantidad de números</td>
                  <td align="right" style="font-size:13px;font-weight:600;color:#111827">${numbers.length}</td>
                </tr>
                <tr>
                  <td style="font-size:15px;font-weight:700;color:#111827;padding-top:8px">Total pagado</td>
                  <td align="right" style="font-size:15px;font-weight:800;color:#16a34a;padding-top:8px">$${totalAmount.toLocaleString('es-CO')} ${currency}</td>
                </tr>
              </table>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${raffleUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;">
                Ver la rifa
              </a>
            </div>

            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
              Guarda este correo como comprobante de tu compra.<br/>¡Mucha suerte! 🍀
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:11px;color:#9ca3af">${businessName} · Powered by BonoriFa</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Email error: GMAIL_USER o GMAIL_APP_PASSWORD no están configurados en las variables de entorno')
    throw new Error('Gmail credentials not configured')
  }

  // Resolver smtp.gmail.com a IPv4 para evitar ECONNREFUSED con IPv6
  const [smtpIp] = await resolve4('smtp.gmail.com')
  console.log(`Conectando a SMTP Gmail via IPv4: ${smtpIp}`)

  const transporter = nodemailer.createTransport({
    host: smtpIp,
    port: 465,
    secure: true,
    tls: { servername: 'smtp.gmail.com', rejectUnauthorized: false },
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: `"${businessName}" <${process.env.GMAIL_USER}>`,
    to,
    subject: `✅ Confirmación de compra — ${raffleName}`,
    html,
  })

  console.log(`Email de confirmación enviado a ${to}`)
}
