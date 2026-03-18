export interface RaffleTheme {
  id: string
  name: string
  topBar: string       // fondo barra superior (negocio)
  topBarText: string   // texto barra superior
  titleBg: string      // fondo sección título
  titleText: string    // color título
  accentText: string   // color texto de premio/descripción
  progressColor: string // color barra de progreso
  priceColor: string   // color precio por número
  preview: string[]    // 3 colores para la muestra visual [principal, oscuro, claro]
}

export const RAFFLE_THEMES: RaffleTheme[] = [
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
    preview: ['#fbbf24', '#003087', '#dc2626'],
  },
]

export function getRaffleTheme(themeId?: string | null): RaffleTheme {
  return RAFFLE_THEMES.find((t) => t.id === themeId) ?? RAFFLE_THEMES[0]
}
