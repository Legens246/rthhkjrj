import { useEffect } from "react";
import {
  Download,
  Gamepad2,
  Settings,
  FolderOpen,
  Package,
  UserCheck,
  Globe,
  RefreshCw,
  Monitor,
  Coffee,
  Server,
  Wifi,
  FileText,
  Layers,
} from "lucide-react";
import Layout from "@/components/Layout";
import DownloadButton from "@/components/DownloadButton";

const sections = [
  {
    icon: Download,
    title: "Загрузка и установка компонентов",
    items: [
      "Minecraft client/jar",
      "Forge, NeoForge, Fabric, Quilt, OptiFine",
      "Java (JRE/JDK) — встроенный менеджер",
      "Автоматическая установка зависимостей и библиотек",
    ],
  },
  {
    icon: FolderOpen,
    title: "Управление инстансами",
    items: [
      "Создание, дублирование, редактирование и удаление",
      "Отдельные настройки для каждого инстанса",
      "Изоляция модов, ресурсов и сохранений",
      "Мульти-инстансы с раздельными конфигами",
    ],
  },
  {
    icon: Package,
    title: "Управление ресурсами",
    items: [
      "Моды — установка, обновление, группировка",
      "Ресурс-паки и шейдер-паки",
      "Скриншоты и логи",
      "Данные серверов и миры/сейвы",
    ],
  },
  {
    icon: Layers,
    title: "Импорт/экспорт сборок",
    items: [
      "CurseForge и Modrinth модпаки",
      "Оффлайн-архивы",
      "Экспорт серверных паков",
      "Встроенный маркет контента",
    ],
  },
  {
    icon: UserCheck,
    title: "Авторизация и аккаунты",
    items: [
      "Microsoft / Mojang (официальная авторизация)",
      "Yggdrasil-серверы",
      "Ely.by и LittleSkin",
      "Оффлайн-профили",
      "Управление скинами и плащами",
    ],
  },
  {
    icon: Globe,
    title: "Сетевые возможности",
    items: [
      "Проверка статуса и пинга серверов",
      "P2P / LAN — играйте с друзьями напрямую",
      "Обмен инстансами между игроками",
    ],
  },
  {
    icon: RefreshCw,
    title: "Автообновление лаунчера",
    items: [
      "Electron-updater с GitHub Releases",
      "Поддержка prerelease-версий",
      "Автозагрузка и установка при закрытии",
      "Fallback на ручную загрузку .exe",
    ],
  },
  {
    icon: Gamepad2,
    title: "Запуск Minecraft",
    items: [
      "Расширенная генерация аргументов запуска",
      "Гибкие JVM-аргументы и настройки RAM",
      "Создание ярлыков для быстрого старта",
      "Мониторинг активных игровых процессов",
    ],
  },
  {
    icon: Coffee,
    title: "Java менеджер",
    items: [
      "Автоматический поиск и валидация Java",
      "Установка и удаление версий Java",
      "Выбор предпочтительной версии",
    ],
  },
  {
    icon: Monitor,
    title: "UI и десктоп",
    items: [
      "Скрытие/показ лаунчера во время игры",
      "Окно логов в реальном времени",
      "Трей, нотификации, кастомные иконки",
      "Глобальные и инстанс-темы",
    ],
  },
  {
    icon: FileText,
    title: "Логи и диагностика",
    items: [
      "Подробные логи запуска",
      "Диагностика проблем с компонентами",
      "Переустановка повреждённых файлов",
    ],
  },
  {
    icon: Server,
    title: "XUpdate — обновление файлов",
    items: [
      "Публикация манифестов инстансов",
      "Автоматическая проверка обновлений",
      "Синхронизация игровых файлов",
    ],
  },
];

export default function Description() {
  useEffect(() => {
    document.title = "Описание — Legens Xeno Launcher";
  }, []);

  return (
    <Layout>
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient">
            Описание Legens Xeno Launcher
          </h1>
          <p className="text-center text-muted-foreground mb-6 max-w-2xl mx-auto">
            Полнофункциональный Minecraft-лаунчер с поддержкой всех популярных
            загрузчиков, мультиаккаунтов, менеджера модов и P2P-игры.
          </p>
          <p className="text-center text-muted-foreground/70 mb-16 max-w-xl mx-auto text-sm">
            Основан на архитектуре xmcl с собственными доработками и
            автообновлением через GitHub Releases.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => (
              <div
                key={section.title}
                className="glass rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <section.icon className="w-8 h-8 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-lg">{section.title}</h3>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2"
                    >
                      <span className="text-primary mt-1 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center mt-20">
            <h2 className="text-2xl font-bold mb-6">Попробуйте сами</h2>
            <DownloadButton />
          </div>
        </div>
      </section>
    </Layout>
  );
}
