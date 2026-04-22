import {
  forwardRef,
  useId,
  useState,
  type ForwardedRef,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { LuX } from 'react-icons/lu'
import { cn } from '../../lib/cn'

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'onChange'
> & {
  label?: ReactNode
  description?: ReactNode
  errorMessage?: ReactNode
  isRequired?: boolean
  isInvalid?: boolean
  startContent?: ReactNode
  endContent?: ReactNode
  isClearable?: boolean
  onClear?: () => void
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onValueChange?: (value: string) => void
  validate?: (value: string) => string | undefined
  fullWidth?: boolean
}

const wrapperBase =
  'flex items-center gap-2 rounded-md border border-riven-border bg-transparent px-3 transition-colors data-[focused=true]:border-primary data-[hover=true]:border-riven-border-strong data-[invalid=true]:border-danger'
const inputBase =
  'peer h-9 w-full bg-transparent text-sm text-foreground placeholder:text-riven-muted/70 outline-none disabled:cursor-not-allowed disabled:opacity-50'

export const Input = forwardRef(function Input(
  {
    className,
    label,
    description,
    errorMessage,
    isRequired,
    isInvalid,
    isClearable,
    startContent,
    endContent,
    onClear,
    onChange,
    onValueChange,
    validate,
    value,
    fullWidth = true,
    id,
    type = 'text',
    ...props
  }: InputProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  const autoId = useId()
  const inputId = id || autoId
  const [focused, setFocused] = useState(false)
  const [hover, setHover] = useState(false)
  const [validationError, setValidationError] = useState<string | undefined>()

  const invalid = !!isInvalid || !!validationError
  // Only render the passed-in `errorMessage` when the field is actually
  // invalid (explicit isInvalid prop OR a validate() call returned a message).
  // Otherwise every static errorMessage would flash the moment the modal opened.
  const shownError = validationError || (invalid ? errorMessage : undefined)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange?.(e)
    onValueChange?.(e.target.value)
    if (validate) setValidationError(validate(e.target.value))
  }

  const showClear =
    isClearable && !!value && typeof value === 'string' && value.length > 0

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs uppercase tracking-wider text-riven-muted"
        >
          {label}
          {isRequired && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      <div
        data-focused={focused || undefined}
        data-hover={hover || undefined}
        data-invalid={invalid || undefined}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={cn(wrapperBase, className)}
      >
        {startContent}
        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          required={isRequired}
          aria-invalid={invalid || undefined}
          aria-describedby={shownError ? `${inputId}-err` : undefined}
          onChange={handleChange}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
          className={inputBase}
          {...props}
        />
        {showClear && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              onClear?.()
              onValueChange?.('')
            }}
            className="text-riven-muted hover:text-foreground"
            aria-label="Clear"
          >
            <LuX size={14} />
          </button>
        )}
        {endContent}
      </div>
      {description && !shownError && (
        <p className="text-xs text-riven-muted">{description}</p>
      )}
      {shownError && (
        <p id={`${inputId}-err`} className="text-xs text-danger">
          {shownError}
        </p>
      )}
    </div>
  )
})
