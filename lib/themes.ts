export interface RaffleTheme {
  id: string
  name: string
  // ── Barra superior (negocio) ──────────────────────────────
  topBar: string
  topBarText: string
  // ── Sección título e información ─────────────────────────
  titleBg: string
  titleText: string
  accentText: string
  // ── Progreso y precio ────────────────────────────────────
  progressColor: string
  priceColor: string
  // ── Sistema de capas de página ───────────────────────────
  pageBg: string        // fondo general de la página
  surface: string       // tarjetas y contenedores
  surfaceAlt: string    // capa alternativa (carrusel, galería)
  borderSubtle: string  // borde sutil / track de barra de progreso
  // ── Gradiente premium ────────────────────────────────────
  gradient: string
  // ── Preview (muestra visual en selector) ─────────────────
  preview: string[]
}

export const RAFFLE_THEMES: RaffleTheme[] = [
  // ─────────────────────────────────────────────────────────
  // TEMAS CLÁSICOS (actualizados con tokens completos)
  // ─────────────────────────────────────────────────────────
  {
    id: 'default',
    name: 'Morado Clásico',
    topBar: '#2d1b69',
    topBarText: '#ffffff',
    titleBg: '#faf5ff',
    titleText: '#1e1b4b',
    accentText: '#7c3aed',
    progressColor: '#7c3aed',
    priceColor: '#7c3aed',
    pageBg: '#faf5ff',
    surface: '#ffffff',
    surfaceAlt: '#f3f0ff',
    borderSubtle: '#e9d5ff',
    gradient: 'linear-gradient(135deg, #2d1b69 0%, #7c3aed 100%)',
    preview: ['#7c3aed', '#2d1b69', '#faf5ff'],
  },
  {
    id: 'oceano',
    name: 'Océano Azul',
    topBar: '#0c4a6e',
    topBarText: '#ffffff',
    titleBg: '#f0f9ff',
    titleText: '#0c4a6e',
    accentText: '#0284c7',
    progressColor: '#0284c7',
    priceColor: '#0284c7',
    pageBg: '#f0f9ff',
    surface: '#ffffff',
    surfaceAlt: '#e0f2fe',
    borderSubtle: '#bae6fd',
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)',
    preview: ['#0284c7', '#0c4a6e', '#f0f9ff'],
  },
  {
    id: 'atardecer',
    name: 'Atardecer',
    topBar: '#431407',
    topBarText: '#ffffff',
    titleBg: '#fff7ed',
    titleText: '#431407',
    accentText: '#ea580c',
    progressColor: '#ea580c',
    priceColor: '#ea580c',
    pageBg: '#fff7ed',
    surface: '#ffffff',
    surfaceAlt: '#ffedd5',
    borderSubtle: '#fed7aa',
    gradient: 'linear-gradient(135deg, #431407 0%, #ea580c 100%)',
    preview: ['#ea580c', '#431407', '#fff7ed'],
  },
  {
    id: 'bosque',
    name: 'Bosque Verde',
    topBar: '#052e16',
    topBarText: '#ffffff',
    titleBg: '#f0fdf4',
    titleText: '#052e16',
    accentText: '#16a34a',
    progressColor: '#16a34a',
    priceColor: '#16a34a',
    pageBg: '#f0fdf4',
    surface: '#ffffff',
    surfaceAlt: '#dcfce7',
    borderSubtle: '#bbf7d0',
    gradient: 'linear-gradient(135deg, #052e16 0%, #16a34a 100%)',
    preview: ['#16a34a', '#052e16', '#f0fdf4'],
  },
  {
    id: 'dorado',
    name: 'Gold Premium',
    topBar: '#1c1917',
    topBarText: '#fbbf24',
    titleBg: '#fefce8',
    titleText: '#1c1917',
    accentText: '#ca8a04',
    progressColor: '#ca8a04',
    priceColor: '#ca8a04',
    pageBg: '#fefce8',
    surface: '#ffffff',
    surfaceAlt: '#fef9c3',
    borderSubtle: '#fde68a',
    gradient: 'linear-gradient(135deg, #1c1917 0%, #ca8a04 100%)',
    preview: ['#ca8a04', '#1c1917', '#fefce8'],
  },
  {
    id: 'rosa',
    name: 'Rosa',
    topBar: '#4c0519',
    topBarText: '#ffffff',
    titleBg: '#fff1f2',
    titleText: '#4c0519',
    accentText: '#e11d48',
    progressColor: '#e11d48',
    priceColor: '#e11d48',
    pageBg: '#fff1f2',
    surface: '#ffffff',
    surfaceAlt: '#ffe4e6',
    borderSubtle: '#fecdd3',
    gradient: 'linear-gradient(135deg, #4c0519 0%, #e11d48 100%)',
    preview: ['#e11d48', '#4c0519', '#fff1f2'],
  },
  {
    id: 'noche',
    name: 'Noche Oscura',
    topBar: '#09090b',
    topBarText: '#ffffff',
    titleBg: '#18181b',
    titleText: '#fafafa',
    accentText: '#818cf8',
    progressColor: '#6366f1',
    priceColor: '#818cf8',
    pageBg: '#18181b',
    surface: '#27272a',
    surfaceAlt: '#3f3f46',
    borderSubtle: '#52525b',
    gradient: 'linear-gradient(135deg, #09090b 0%, #6366f1 100%)',
    preview: ['#6366f1', '#09090b', '#18181b'],
  },
  {
    id: 'colombia',
    name: '🇨🇴 Colombia',
    topBar: '#003087',
    topBarText: '#fbbf24',
    titleBg: '#fbbf24',
    titleText: '#003087',
    accentText: '#dc2626',
    progressColor: '#dc2626',
    priceColor: '#003087',
    pageBg: '#fef3c7',
    surface: '#ffffff',
    surfaceAlt: '#fde68a',
    borderSubtle: '#fcd34d',
    gradient: 'linear-gradient(135deg, #003087 0%, #fbbf24 50%, #dc2626 100%)',
    preview: ['#fbbf24', '#003087', '#dc2626'],
  },

  // ─────────────────────────────────────────────────────────
  // TEMAS PREMIUM — SISTEMA DE COLOR AVANZADO
  // ─────────────────────────────────────────────────────────

  /**
   * ÍNDIGO SERENO
   * Mood: frío, sofisticado, premium tecnológico
   * Base: piedra cálida / acento: azul empolvado profundo
   */
  {
    id: 'indigo-sereno',
    name: '✦ Índigo Sereno',
    topBar: '#1E2B3C',
    topBarText: '#E4D9C4',
    titleBg: '#F2F0EE',
    titleText: '#1E2B3C',
    accentText: '#3A5F8A',
    progressColor: '#3A5F8A',
    priceColor: '#2C4D73',
    pageBg: '#F2F0EE',
    surface: '#F8F7F5',
    surfaceAlt: '#ECEAE7',
    borderSubtle: '#D5D0CA',
    gradient: 'linear-gradient(135deg, #1E2B3C 0%, #2C4D73 60%, #3A5F8A 100%)',
    preview: ['#3A5F8A', '#1E2B3C', '#F2F0EE'],
  },

  /**
   * COBRE ARCILLA
   * Mood: cálido, artesanal, terroso premium
   * Base: arena cálida / acento: cobre oxidado
   */
  {
    id: 'cobre-arcilla',
    name: '✦ Cobre Arcilla',
    topBar: '#3A1A0A',
    topBarText: '#F0D9B5',
    titleBg: '#F5EDE3',
    titleText: '#3A1A0A',
    accentText: '#B8531C',
    progressColor: '#B8531C',
    priceColor: '#9A3F10',
    pageBg: '#F5EDE3',
    surface: '#FAF5EF',
    surfaceAlt: '#EDE4D8',
    borderSubtle: '#D8CCBD',
    gradient: 'linear-gradient(135deg, #3A1A0A 0%, #7A2E0A 50%, #B8531C 100%)',
    preview: ['#B8531C', '#3A1A0A', '#F5EDE3'],
  },

  /**
   * JADE SILENCIOSO
   * Mood: natural, equilibrado, profundo
   * Base: salvia pálida / acento: jade bosque
   */
  {
    id: 'jade-silencioso',
    name: '✦ Jade Silencioso',
    topBar: '#162B1E',
    topBarText: '#C9DDD0',
    titleBg: '#EEF2EE',
    titleText: '#162B1E',
    accentText: '#2D7251',
    progressColor: '#2D7251',
    priceColor: '#225A40',
    pageBg: '#EEF2EE',
    surface: '#F5F8F4',
    surfaceAlt: '#E3EBE3',
    borderSubtle: '#C4D4C6',
    gradient: 'linear-gradient(135deg, #162B1E 0%, #1F5038 50%, #2D7251 100%)',
    preview: ['#2D7251', '#162B1E', '#EEF2EE'],
  },

  /**
   * VINO MINERAL
   * Mood: lujoso, cultural, profundo y elegante
   * Base: piedra cálida rosada / acento: vino oscuro
   */
  {
    id: 'vino-mineral',
    name: '✦ Vino Mineral',
    topBar: '#28121E',
    topBarText: '#E8D4D0',
    titleBg: '#F0ECEB',
    titleText: '#28121E',
    accentText: '#8A2040',
    progressColor: '#8A2040',
    priceColor: '#701830',
    pageBg: '#F0ECEB',
    surface: '#F7F4F3',
    surfaceAlt: '#E8E1DF',
    borderSubtle: '#D0C6C4',
    gradient: 'linear-gradient(135deg, #28121E 0%, #5C1632 50%, #8A2040 100%)',
    preview: ['#8A2040', '#28121E', '#F0ECEB'],
  },

  /**
   * CARBÓN ÁMBAR
   * Mood: nocturno, atmosférico, calor interior
   * Base: carbón cálido oscuro / acento: ámbar suave
   */
  {
    id: 'carbon-ambar',
    name: '✦ Carbón Ámbar',
    topBar: '#0E0D0C',
    topBarText: '#C8BFA8',
    titleBg: '#1B1916',
    titleText: '#E8E0CC',
    accentText: '#C49A35',
    progressColor: '#C49A35',
    priceColor: '#D4AA40',
    pageBg: '#1B1916',
    surface: '#252220',
    surfaceAlt: '#2E2A24',
    borderSubtle: '#3E3830',
    gradient: 'linear-gradient(135deg, #0E0D0C 0%, #3A2E1A 50%, #C49A35 100%)',
    preview: ['#C49A35', '#0E0D0C', '#1B1916'],
  },
]

export function getRaffleTheme(themeId?: string | null): RaffleTheme {
  return RAFFLE_THEMES.find((t) => t.id === themeId) ?? RAFFLE_THEMES[0]
}
