import type { Metadata, Viewport } from "next";
import { DM_Mono, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "The Coding Company",
    template: "%s · The Coding Company",
  },
  description:
    "Recruitment assessment platform by The Coding Company — communication, aptitude and vibe check.",
  icons: {
    icon: [{ url: "/tcc-logo.png", sizes: "600x600", type: "image/png" }],
    apple: "/tcc-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#050505",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} ${instrumentSerif.variable} ${dmMono.variable}`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased">
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}