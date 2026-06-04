import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";

interface PriceData {
  name: string;
  price: number;
  change: number;
  unit: string;
}

export default function PriceWidget() {
  const [prices, setPrices] = useState<PriceData[]>([
    { name: "Pétrole (Brent)", price: 85.42, change: 2.3, unit: "USD/bbl" },
    { name: "Or", price: 2350.50, change: -1.2, unit: "USD/oz" },
    { name: "CAC 40", price: 7850.25, change: 1.8, unit: "pts" },
    { name: "Gaz Naturel", price: 3.45, change: -3.1, unit: "USD/MMBtu" },
  ]);

  return (
    <section className="py-6 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {prices.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-3 border border-border rounded-lg bg-card/50 hover:bg-card transition-colors"
            >
              <p className="text-xs text-muted-foreground font-medium mb-1">{item.name}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">{item.price.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">{item.unit}</span>
              </div>
              <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${item.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                {item.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {item.change >= 0 ? "+" : ""}{item.change.toFixed(1)}%
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
