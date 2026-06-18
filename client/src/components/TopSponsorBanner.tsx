import { motion } from "framer-motion";

export default function TopSponsorBanner() {
  return (
    <section className="border-b border-border bg-[#06111f] py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-6xl"
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Publicite Premium
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/80">
              Premier Rang
            </span>
          </div>

          <a
            href="https://www.fse.sn"
            target="_blank"
            rel="noreferrer"
            className="group block overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] transition-all hover:border-gold/45 hover:shadow-[0_28px_80px_rgba(0,0,0,0.34)]"
            aria-label="Ouvrir la publicite premium FSE"
          >
            <div className="relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-gold/80 to-transparent" />
              <img
                src="/media/fse-premium-ad.jpg"
                alt="Publicite premium FSE - Fonds Special de Soutien au Secteur de l'Energie"
                className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.01]"
                loading="eager"
              />
            </div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
