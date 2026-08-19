import type { Metadata, Viewport } from "next";
import { Almarai, DM_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const almarai = Almarai({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "700", "800"],
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
  themeColor: "#000000",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${almarai.variable} ${instrumentSerif.variable} ${dmMono.variable}`}
    >
      <body className="flex min-h-full flex-col bg-black text-[#e1e0cc] antialiased">
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}