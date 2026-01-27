/**
 * Done:
 * Layout raíz de la aplicación.
 *
 * Responsabilidades:
 * - Renderizar la estructura HTML base (<html>, <body>) y aplicar clases globales.
 * - Proveer `ThemeProvider` y `ActiveThemeProvider` para la gestión de temas.
 * - Leer la cookie `active_theme` para aplicar la clase de tema y la variante escalada.
 *
 * Contrato:
 * - Recibe `children: React.ReactNode` y no debe contener lógica pesada ni efectos
 *   persistentes (mantener la inicialización y la configuración en módulos/ providers).
 *
 * Extensiones:
 * - Añade providers globales (auth, i18n, etc.) envolviendo `children` aquí.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-providers";
import { ActiveThemeProvider } from "@/components/active-theme";
import { cookies } from "next/headers";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import SessionProvider from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ASUR",
  description: "Asociación de Sordos del Uruguay",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");

  return (
    <html lang="es">
      <body
        className={cn(
          "bg-background overscroll-none font-sans antialiased",
          activeThemeValue ? `theme-${activeThemeValue}` : "",
          isScaled ? "theme-scaled" : ""
        )}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <ActiveThemeProvider initialTheme={activeThemeValue}>
              {children}
              <Toaster position="top-center" richColors closeButton expand />
            </ActiveThemeProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
