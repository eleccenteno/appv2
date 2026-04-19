import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ThemeInitializer from "@/components/ThemeInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Electrónica Centeno - Mantenimiento Preventivo",
  description: "Sistema de gestión de mantenimiento preventivo para Electrónica Centeno. Gestión de inspecciones, servicios técnicos y preventivos.",
  keywords: ["Electrónica Centeno", "mantenimiento preventivo", "inspecciones eléctricas", "servicio técnico"],
  authors: [{ name: "Electrónica Centeno" }],
  icons: {
    icon: "/logo.svg",
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('app-theme') || 'oceano';
                  document.documentElement.setAttribute('data-theme', theme);
                  var darkMode = localStorage.getItem('app-dark-mode') === 'true';
                  if (darkMode) document.documentElement.classList.add('dark');
                  var fontSize = localStorage.getItem('app-font-size') || 'normal';
                  document.documentElement.classList.add('font-size-' + fontSize);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeInitializer />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
