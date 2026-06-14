import { motion } from "framer-motion";

export default function TopSponsorBanner() {
  return (
    <section className="border-b border-border bg-card/20 py-6">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-6xl"
        >
          <div className="mb-3">
            <span className="inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold">
              Publicite
            </span>
          </div>

          <a
            href="https://www.emc-africa.com"
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-lg border border-border bg-white shadow-sm transition-all hover:border-gold hover:shadow-lg hover:shadow-gold/10"
          >
            <img
              src="/media/emc-africa-energy-ad.jpg"
              alt="Publicite EMC Africa Energy"
              className="w-full h-auto"
            />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
