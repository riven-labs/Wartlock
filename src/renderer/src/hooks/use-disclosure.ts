import { useCallback, useState } from 'react'

export type Disclosure = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onOpenChange: (open: boolean) => void
  onToggle: () => void
}

export function useDisclosure(initial = false): Disclosure {
  const [isOpen, setIsOpen] = useState(initial)

  const onOpen = useCallback(() => setIsOpen(true), [])
  const onClose = useCallback(() => setIsOpen(false), [])
  const onToggle = useCallback(() => setIsOpen((v) => !v), [])
  const onOpenChange = useCallback((open: boolean) => setIsOpen(open), [])

  return { isOpen, onOpen, onClose, onOpenChange, onToggle }
}
