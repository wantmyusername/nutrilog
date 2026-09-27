function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function isHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text)
}

/** Convierte texto plano (con saltos de línea) a HTML simple. */
export function plainToHtml(text: string): string {
  const escaped = escapeHtml(text)
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('')
  return paragraphs || ''
}

/** Normaliza el plan guardado (texto plano viejo o HTML) a HTML seguro. */
export function planToHtml(text: string | null | undefined): string {
  if (!text) return ''
  return isHtml(text) ? text : plainToHtml(text)
}
