import DownloadButton from "./DownloadButton";

export default function HeroSection() {
  return (
    <section className="relative flex items-center justify-center min-h-screen pt-16">
      <div className="container mx-auto px-4 text-center relative z-10">
        <h1 className="text-5xl md:text-7xl font-black mb-6 glow-text text-gradient">
          Legens Xeno Launcher
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Мощный Minecraft лаунчер с удобным интерфейсом и автообновлением
        </p>
        <DownloadButton />
        <p className="mt-4 text-sm text-muted-foreground">
          Актуальная версия загружается автоматически с GitHub Releases
        </p>
      </div>
    </section>
  );
}
