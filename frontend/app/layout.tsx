import "./globals.css";
import NavBar from "./components/NavBar";
import { AuthProvider } from "./lib/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
