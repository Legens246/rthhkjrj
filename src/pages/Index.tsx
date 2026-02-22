import { useEffect } from "react";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import WhyUs from "@/components/WhyUs";

export default function Index() {
  useEffect(() => {
    document.title = "Legens Xeno Launcher — Скачать Minecraft лаунчер";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        "Скачайте Legens Xeno Launcher — современный Minecraft лаунчер с автообновлением через GitHub."
      );
  }, []);

  return (
    <Layout>
      <HeroSection />
      <WhyUs />
    </Layout>
  );
}
