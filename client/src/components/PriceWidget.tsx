import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";

type PriceData = {
  name: string;
  price: number;
  change: number;
  unit: string;
};

const MARKET_ITEMS: PriceData[] = [
  { name: "PLATTS 10 PPM FUJ", price: 1102, change: 2.3, unit: "$/MT" },
  { name: "PLATTS 10 PPM CIF NEW", price: 1102, change: 1.2, unit: "$/MT" },
  { name: "CAC 40", price: 7850.25, change: 1.8, unit: "pts" },
  { name: "Gaz Naturel", price: 3.45, change: -3.1, unit: "USD/MMBtu" },
];

function formatPrice(value: number) {
  const hasDecimals = !Number.isInteger(value);

  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(value);
}

export default function PriceWidget() {
  return (
    <section className="border-b border-border bg-gradient-to-r from-primary/10 to-accent/10 py-6">
      <div className="container">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {MARKET_ITEMS.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-card"
            >
              <p className="mb-1 text-xs font-medium text-muted-foreground">{item.name}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">{formatPrice(item.price)}</span>
                <span className="text-xs text-muted-foreground">{item.unit}</span>
              </div>
              <div
                className={`mt-1 flex items-center gap-1 text-xs font-semibold ${
                  item.change >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {item.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {item.change >= 0 ? "+" : ""}
                {item.change.toFixed(1)}%
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
