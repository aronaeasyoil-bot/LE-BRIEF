import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface CountUpStatProps {
  value: string;
  label: string;
  delay?: number;
}

export default function CountUpStat({ value, label, delay = 0 }: CountUpStatProps) {
  // Extract numeric part and suffix (K, +, %, etc.)
  const match = value.match(/^(\d+)(.*)$/);
  const numericValue = match ? parseInt(match[1]) : 0;
  const suffix = match ? match[2] : "";

  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, numericValue, {
      duration: 2,
      delay,
    });
    return () => controls.stop();
  }, [count, numericValue, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="text-center group"
    >
      <motion.div 
        className="text-3xl md:text-4xl font-bold text-gold mb-2"
        whileHover={{ scale: 1.1 }}
      >
        <motion.span className="inline-block">{rounded}</motion.span>
        <span className="inline-block">{suffix}</span>
      </motion.div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}
