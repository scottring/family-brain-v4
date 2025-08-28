'use client'

import { memo } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from './ThemeProvider'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  showLabel?: boolean
}

const ThemeToggle = memo(function ThemeToggle({ 
  size = 'default', 
  variant = 'ghost',
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const themes = [
    {
      key: 'light' as const,
      label: 'Light',
      icon: Sun,
      description: 'Use light theme'
    },
    {
      key: 'dark' as const,
      label: 'Dark', 
      icon: Moon,
      description: 'Use dark theme'
    },
    {
      key: 'system' as const,
      label: 'System',
      icon: Monitor,
      description: 'Use system preference'
    }
  ]

  // Use proper PascalCase for React component
  const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'icon'}
          className={cn(
            'relative transition-colors',
            showLabel && 'pl-8'
          )}
          aria-label="Toggle theme"
        >
          <ThemeIcon 
            className={cn(
              'transition-transform duration-300 rotate-0 scale-100',
              'dark:rotate-90 dark:scale-0',
              size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
            )} 
          />
          {showLabel && (
            <span className="ml-2 text-sm font-medium">
              {themes.find(t => t.key === theme)?.label}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon
          const isActive = theme === themeOption.key
          
          return (
            <DropdownMenuItem
              key={themeOption.key}
              onClick={() => setTheme(themeOption.key)}
              className={cn(
                'flex items-center space-x-3 cursor-pointer',
                isActive && 'bg-accent text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">{themeOption.label}</div>
                <div className="text-xs text-muted-foreground">
                  {themeOption.description}
                </div>
              </div>
              {isActive && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

export { ThemeToggle }