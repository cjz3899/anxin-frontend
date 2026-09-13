import Button, { type ButtonProps } from '@nutui/nutui-react-taro/dist/es/packages/button'

export interface AppButtonProps extends Omit<
  Partial<ButtonProps>,
  'type' | 'fill' | 'color' | 'shape' | 'size'
> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

const buttonAppearance = {
  primary: { type: 'primary', fill: 'solid' },
  secondary: { type: 'primary', fill: 'outline' },
  ghost: { type: 'default', fill: 'none' },
  danger: { type: 'danger', fill: 'solid' },
} as const

export default function AppButton({
  variant = 'primary',
  className = '',
  block = true,
  ...props
}: AppButtonProps) {
  const appearance = buttonAppearance[variant]

  return (
    <Button
      {...props}
      block={block}
      className={`app-button app-button--${variant} ${className}`.trim()}
      fill={appearance.fill}
      shape="square"
      size="large"
      type={appearance.type}
    />
  )
}
