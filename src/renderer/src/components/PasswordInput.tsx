import { forwardRef, useState, type ForwardedRef } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { Input, type InputProps } from './ui/input'

export const PasswordInput = forwardRef(function PasswordInput(
  { label = 'Password', ...props }: InputProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <Input
      {...props}
      ref={ref}
      label={label}
      type={isVisible ? 'text' : 'password'}
      endContent={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsVisible((v) => !v)}
          className="text-riven-muted hover:text-foreground"
          aria-label="Toggle password visibility"
        >
          {isVisible ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
        </button>
      }
    />
  )
})
