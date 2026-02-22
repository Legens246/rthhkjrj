import { ReactNode } from "react";
import bgPurple from "@/assets/bg-purple.jpg";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgPurple})` }}
      />
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
