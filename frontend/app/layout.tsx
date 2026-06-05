import type React from "react"
import "@/app/globals.css"

export const metadata = {
  title: "Python Interview Assessment",
  description: "AI Powered Technical Evaluation Dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className="min-h-screen bg-[#06070a] text-white antialiased" 
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}