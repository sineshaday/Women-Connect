import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "WomenConnect",
  description: "Empowering African women through storytelling",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
    <body>
      <AuthProvider>
        <main>{children}</main>
      </AuthProvider>
    </body>
  </html>
  );
}
