export default function Footer() {
  return (
    <footer className="border-t border-border/30 py-8">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Legens Xeno Launcher. Все права защищены.</p>
        <a
          href="https://github.com/Legens246/Legens-X-Launcher-Dowload"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          GitHub →
        </a>
      </div>
    </footer>
  );
}
