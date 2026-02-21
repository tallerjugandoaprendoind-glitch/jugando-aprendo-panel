import type { Metadata } from "next";
import { ToastProvider } from '@/components/Toast'
import { ThemeProvider } from '@/components/ThemeContext'
import "./globals.css";

export const metadata: Metadata = {
  title: "Jugando Aprendo | Terapia ABA y Neurodivergencia en Pisco, Ica",
  description: "Centro especializado en terapia ABA y desarrollo infantil en Pisco, Ica. Atendemos niños con autismo, TEA, TDAH y neurodivergencia con metodología basada en evidencia e IA. +50 familias.",
  keywords: "terapeuta ABA Pisco, terapia autismo Ica, centro neurodivergencia Pisco, TEA Pisco, TDAH Pisco, desarrollo infantil Ica, terapia conductual niños Pisco",
  authors: [{ name: "Jugando Aprendo" }],
  openGraph: {
    title: "Jugando Aprendo | Terapia ABA en Pisco, Ica",
    description: "Centro especializado en neurodivergencia. Terapia ABA con IA para niños en Pisco, Ica, Perú.",
    type: "website",
    locale: "es_PE",
    url: "https://jugandoaprendo.com",
    siteName: "Jugando Aprendo",
    images: [{ url: "/images/hero-image.jpg", width: 1200, height: 630, alt: "Jugando Aprendo - Terapia ABA Pisco" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jugando Aprendo | Terapia ABA en Pisco, Ica",
    description: "Centro especializado en neurodivergencia. Terapia ABA + IA para niños.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://jugandoaprendo.com" },
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
