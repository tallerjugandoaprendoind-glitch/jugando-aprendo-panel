import type { Metadata } from "next";
import { ToastProvider } from '@/components/Toast'
import { ThemeProvider } from '@/components/ThemeContext'
import "./globals.css";

export const metadata: Metadata = {
  title: "Jugando Aprendo - Centro de Desarrollo Infantil",
  description: "Sistema profesional de gestión terapéutica y desarrollo infantil",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
