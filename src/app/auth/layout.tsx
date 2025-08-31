'use client'

import { ThemeProvider } from "@/components/common/ThemeProvider"
import { Toaster } from "sonner"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider defaultTheme="system">
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