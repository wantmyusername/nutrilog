import { useEffect, useRef } from 'react'
import { Bold, Heading2, Italic, List, ListOrdered, Underline } from 'lucide-react'
import { cx } from './styles'

interface RichTextEditorProps {
  initialHtml: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ initialHtml, onChange, placeholder }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current && ref.current) {
      ref.current.innerHTML = initialHtml
      initialized.current = true
    }
  }, [initialHtml])

  function exec(command: string, value?: string) {
    ref.current?.focus()
    document.execCommand(command, false, value)
    onChange(ref.current?.innerHTML ?? '')
  }

  function block(tag: string) {
    exec('formatBlock', tag)
  }

  const tools: { icon: typeof Bold; label: string; action: () => void }[] = [
    { icon: Bold, label: 'Negrita', action: () => exec('bold') },
    { icon: Italic, label: 'Cursiva', action: () => exec('italic') },
    { icon: Underline, label: 'Subrayado', action: () => exec('underline') },
    { icon: Heading2, label: 'Título', action: () => block('<h3>') },
    { icon: List, label: 'Lista', action: () => exec('insertUnorderedList') },
    { icon: ListOrdered, label: 'Lista numerada', action: () => exec('insertOrderedList') },
  ]

  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-white shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-gray-50 px-2 py-1.5">
        {tools.map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            type="button"
            title={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={action}
            className="grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:bg-white hover:text-ink"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <button
          type="button"
          title="Párrafo normal"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => block('<p>')}
          className="ml-1 rounded-md px-2 py-1 text-xs font-semibold text-muted transition-colors hover:bg-white hover:text-ink"
        >
          Texto normal
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? '')}
        data-placeholder={placeholder}
        className={cx(
          'rich-content min-h-72 px-4 py-3 text-sm text-ink',
          'empty:before:pointer-events-none empty:before:text-faint empty:before:content-[attr(data-placeholder)]',
        )}
      />
    </div>
  )
}
