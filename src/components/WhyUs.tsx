import { Shield, Zap, Monitor } from "lucide-react";

const cards = [
  {
    icon: Shield,
    title: "Стабильность",
    desc: "Надёжная работа без вылетов и ошибок благодаря проверенной архитектуре.",
  },
  {
    icon: Zap,
    title: "Быстрые обновления",
    desc: "Автоматическая загрузка новых версий прямо с GitHub Releases.",
  },
  {
    icon: Monitor,
    title: "Удобный интерфейс",
    desc: "Чистый и интуитивный дизайн — ничего лишнего, всё под рукой.",
  },
];

export default function WhyUs() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Почему мы</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="glass rounded-2xl p-8 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              <card.icon className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
