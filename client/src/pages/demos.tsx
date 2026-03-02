import { ExternalLink } from "lucide-react";

const demos = [
  {
    title: "Pressure Washing",
    description: "Square footage + height based pricing logic.",
    href: "https://mysite.autobidder.org/preview/19d655c0?t=176988756660",
  },
  {
    title: "Holiday Lighting",
    description: "Seasonal quoting with instant booking flows.",
    href: "https://mysite.autobidder.org/preview/cfa077a2?t=1769887566696",
  },
  {
    title: "Pest Control",
    description: "Service type + urgency based pricing logic.",
    href: "https://mysite.autobidder.org/preview/654c1998?t=1769887566590",
  },
  {
    title: "Epoxy Flooring",
    description: "Square footage + finish selection logic.",
    href: "https://mysite.autobidder.org/preview/cb7a5041?t=1769887566755",
  },
];

export default function DemosPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Live Demos</h1>
        <p className="text-zinc-400 mb-12">
          Same demo links currently featured on the main landing page.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {demos.map((demo) => (
            <a
              key={demo.title}
              href={demo.href}
              target="_blank"
              rel="noreferrer"
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 transition-colors"
            >
              <h2 className="text-2xl font-semibold mb-2">{demo.title}</h2>
              <p className="text-zinc-400 text-sm mb-5">{demo.description}</p>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-200">
                Open Demo <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
