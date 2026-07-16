import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

const VARIANTS = {
  solid: 'bg-court-400 text-slate-950 hover:bg-court-300 border border-court-400',
  outline: 'bg-transparent text-white border border-slate-600 hover:border-court-400 hover:text-court-400',
  ghost: 'bg-transparent text-slate-400 hover:text-white',
}

const BASE =
  'inline-flex items-center gap-2 px-6 py-3 font-bold uppercase tracking-wide text-sm transition-colors active:scale-[0.98]'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS
}

export function Button({ variant = 'solid', className = '', ...props }: ButtonProps) {
  return <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />
}

interface ButtonLinkProps extends LinkProps {
  variant?: keyof typeof VARIANTS
}

export function ButtonLink({ variant = 'solid', className = '', ...props }: ButtonLinkProps) {
  return <Link className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />
}
