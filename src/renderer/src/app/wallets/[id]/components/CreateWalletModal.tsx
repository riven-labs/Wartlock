import {
  addToast,
  Button,
  Code,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@heroui/react'
import { GoPlus } from 'react-icons/go'

type ReceiveWartModalProps = {
  address: string | undefined
}

export const ReceiveWartModal = ({ address }: ReceiveWartModalProps) => {
  const { isOpen, onClose, onOpen } = useDisclosure()

  const handleCopy = async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    addToast({
      title: 'Copied',
      description: 'Address copied to clipboard',
      color: 'success',
    })
  }

  return (
    <>
      <Button
        onPress={onOpen}
        className="px-7"
        startContent={<GoPlus size={20} />}
        color="default"
        variant="light"
      >
        Receive WART
      </Button>

      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        className="bg-default-100"
      >
        <ModalContent>
          <div className="space-y-12 px-12 py-12">
            <ModalHeader className="block space-y-6 text-center">
              <h3 className="text-[28px]">Receive WART</h3>
              <p className="text-lg font-normal text-default-400">
                Receive WART tokens to your wallet
              </p>
            </ModalHeader>

            <ModalBody>
              <div className="flex items-center gap-3">
                <Code className="w-[500px] text-wrap break-words text-base">
                  {address}
                </Code>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
              <Button color="default" onPress={handleCopy}>
                Copy
              </Button>
            </ModalFooter>
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}
