import { useEffect } from "react";
import {
  RefreshCw,
  Rocket,
  Puzzle,
  Users,
  RotateCcw,
  Settings,
  FileText,
  FolderSync,
} from "lucide-react";
import Layout from "@/components/Layout";
import DownloadButton from "@/components/DownloadButton";

const features = [
  {
    icon: RefreshCw,
    title: "Auto Update",
    desc: "Автоматическое обновление через GitHub Releases — всегда актуальная версия.",
  },
  {
    icon: Rocket,
    title: "Оптимизированный запуск",
    desc: "Быстрый и стабильный запуск Minecraft с минимальными задержками.",
  },
  {
    icon: Puzzle,
    title: "Поддержка модов",
    desc: "Легко устанавливайте и управляйте модами прямо из лаунчера.",
  },
  {
    icon: Users,
    title: "Профили версий",
    desc: "Создавайте профили для разных версий и конфигураций игры.",
  },
  {
    icon: RotateCcw,
    title: "Быстрое восстановление",
    desc: "Восстановление повреждённого клиента в один клик.",
  },
  {
    icon: Settings,
    title: "Настройки производительности",
    desc: "Гибкие настройки RAM, JVM-аргументов и оптимизации.",
  },
  {
    icon: FileText,
    title: "Логи и диагностика",
    desc: "Подробные логи запуска для быстрого поиска и устранения проблем.",
  },
  {
    icon: FolderSync,
    title: "Обновление файлов",
    desc: "Удобная система синхронизации и обновления игровых файлов.",
  },
];

export default function Features() {
  useEffect(() => {
    document.title = "Функции — Legens Xeno Launcher";
  }, []);

  return (
    <Layout>
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient">
            Функции Legens Xeno Launcher
          </h1>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            Всё, что нужно для комфортной игры — в одном лаунчере.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group"
              >
                <f.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-20">
            <h2 className="text-2xl font-bold mb-6">Готовы начать?</h2>
            <DownloadButton />
          </div>
        </div>
      </section>
    </Layout>
  );
}
