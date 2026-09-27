import { useEffect, useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

interface DeleteDialogProps {
  open: boolean
  title: string
  message?: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteDialog({ open, title, message, onConfirm, onCancel }: DeleteDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)

  useEffect(() => {
    if (!open) setStep(1)
  }, [open])

  return (
    <>
      <ConfirmDialog
        open={open && step === 1}
        title={title}
        message={message}
        confirmLabel="Continuar"
        danger
        onConfirm={() => setStep(2)}
        onCancel={onCancel}
      />
      <ConfirmDialog
        open={open && step === 2}
        title="Confirmar eliminación"
        message="Esta acción no se puede deshacer y la información no se podrá recuperar. ¿Eliminar definitivamente?"
        confirmLabel="Sí, eliminar definitivamente"
        cancelLabel="No, cancelar"
        danger
        onConfirm={() => {
          setStep(1)
          onConfirm()
        }}
        onCancel={onCancel}
      />
    </>
  )
}
