import React from 'react'
import type { Metadata, Viewport } from "next";
import { I18nProvider } from '@/lib/i18n-context'
import { ToastProvider } from '@/components/Toast'
import { ThemeProvider } from '@/components/ThemeContext'
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#5B3FC8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "Vanty | Terapia ABA y Neurodivergencia en Pisco, Ica",
  description: "Centro especializado en terapia ABA y desarrollo infantil en Pisco, Ica. Atendemos niños con autismo, TEA, TDAH y neurodivergencia con metodología basada en evidencia e IA. +50 familias.",
  keywords: "terapeuta ABA Pisco, terapia autismo Ica, centro neurodivergencia Pisco, TEA Pisco, TDAH Pisco, desarrollo infantil Ica, terapia conductual niños Pisco",
  authors: [{ name: "Vanty" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vanty",
    startupImage: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
  verification: {
    google: 'TasBD1QvgPC7uYxtTQFVg-vl4WV2uVmGHgnb_yAZrE0',
  },
  openGraph: {
    title: "Vanty | Terapia ABA en Pisco, Ica",
    description: "Centro especializado en neurodivergencia. Terapia ABA con IA para niños en Pisco, Ica, Perú.",
    type: "website",
    locale: "es_PE",
    url: "https://jugandoaprendo.com",
    siteName: "Vanty",
    images: [{ url: "/images/hero-image.jpg", width: 1200, height: 630, alt: "Vanty - Terapia ABA Pisco" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vanty | Terapia ABA en Pisco, Ica",
    description: "Centro especializado en neurodivergencia. Terapia ABA + IA para niños.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://jugandoaprendo.com" },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* ── PWA: Manifest ── */}
        <link rel="manifest" href="/manifest.json" />

        {/* ── iOS / iPhone Safari PWA ── */}
        {/* Habilitar modo standalone (sin barra de Safari) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Nombre que aparece bajo el ícono en la pantalla de inicio */}
        <meta name="apple-mobile-web-app-title" content="Vanty" />

        {/* Barra de estado: default=blanca, black=negra, black-translucent=transparente sobre contenido */}
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Ícono en pantalla de inicio — Apple requiere estos específicamente */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />

        {/* Splash screens para iPhone (evita pantalla blanca al abrir) */}
        {/* iPhone SE, 6, 7, 8 */}
        <link rel="apple-touch-startup-image"
          media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
          href="/icons/icon-512x512.png" />
        {/* iPhone X, XS, 11 Pro, 12 mini, 13 mini */}
        <link rel="apple-touch-startup-image"
          media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
          href="/icons/icon-512x512.png" />
        {/* iPhone XR, 11 */}
        <link rel="apple-touch-startup-image"
          media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
          href="/icons/icon-512x512.png" />
        {/* iPhone 12, 13, 14 */}
        <link rel="apple-touch-startup-image"
          media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
          href="/icons/icon-512x512.png" />
        {/* iPhone 14 Plus, 15 Plus */}
        <link rel="apple-touch-startup-image"
          media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
          href="/icons/icon-512x512.png" />
        {/* iPhone 15 Pro, 15 Pro Max */}
        <link rel="apple-touch-startup-image"
          media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
          href="/icons/icon-512x512.png" />

        {/* Color de tema en Safari (barra de URL) */}
        <meta name="theme-color" content="#5B3FC8" />

        {/* Formato teléfono — evitar que Safari convierta números a links */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <ToastProvider>
            <I18nProvider>{children}</I18nProvider>
          </ToastProvider>
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(reg) { console.log('SW registrado:', reg.scope); })
                  .catch(function(err) { console.log('SW error:', err); });
              });
            }
          `
        }} />
      </body>
    </html>
  );
}
