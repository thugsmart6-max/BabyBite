import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Fraunces, Nunito_Sans, Outfit } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import "./globals.css";
import "./landing/landing.css";

/** Display — hero headlines */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Serif — logo and section titles */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Sans — body copy */
const nunitoSans = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Label — captions, buttons, small caps */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "BabyBite — Indian Meal Plans for Mothers of Kids 4–12",
    template: "%s | BabyBite",
  },
  description:
    "Personalized Indian nutrition meal plans made for mothers of children aged 4–12. Daily, weekly, and 30-day menus with PDF delivery.",
  keywords: [
    "child nutrition",
    "meal plan for kids 4-12",
    "Indian kids food",
    "picky eater",
    "protein for kids",
    "meal plan for moms",
  ],
  authors: [{ name: "BabyBite" }],
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "BabyBite",
    description: "Personalized Indian meal plans for mothers of children aged 4–12",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6D326",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${cormorant.variable} ${nunitoSans.variable} ${outfit.variable} h-full light`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=document.documentElement;r.classList.remove("dark");r.classList.add("light");r.style.colorScheme="light";localStorage.setItem("babybite-theme","light");}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-background antialiased font-sans text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
