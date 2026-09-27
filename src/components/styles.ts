export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export const inputClass =
  'mt-1 block w-full rounded-md border border-line bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition-all placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/20'

export const textareaClass = cx(inputClass, 'min-h-20 resize-y')
