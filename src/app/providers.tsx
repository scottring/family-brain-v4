'use client'

import { ThemeProvider } from "@/components/common/ThemeProvider"
import { AppInitializer } from "@/components/common/AppInitializer"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <AppInitializer />
      {children}
      <Toaster 
        position="top-right"
        richColors
        closeButton
        theme="system"
      />
    </ThemeProvider>
  )
}