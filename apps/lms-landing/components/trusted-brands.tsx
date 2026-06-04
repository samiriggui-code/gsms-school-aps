'use client';

import { motion } from 'framer-motion';
import Marquee from '@/components/ui/marquee';
import { useTranslation } from '@/hooks/useTranslation';

const CERT = '/images/certifications';

const partnerLogos = [
  { name: 'Qualiopi', src: `${CERT}/logo-qualiopi.png` },
  { name: 'CNAPS', src: `${CERT}/logo-cnaps.png` },
  { name: 'Mon Compte Formation', src: `${CERT}/logo-mon-compte-formation.png` },
  { name: 'France Travail', src: `${CERT}/logo-france-travail.png` },
  { name: 'OPCO', src: `${CERT}/logo-opco.png` },
  { name: 'SSIAP 1', src: `${CERT}/logo-ssiap-1.png` },
  { name: 'SSIAP 2', src: `${CERT}/logo-ssiap-2.png` },
  { name: 'SST', src: `${CERT}/logo-sst.png` },
  { name: 'Titre APS', src: `${CERT}/logo-titre-aps.png` },
  { name: 'MAC APS', src: `${CERT}/logo-mac-aps.png` },
];

const TrustedBrands = () => {
  const { t } = useTranslation();

  return (
    <section
      id="trusted-brands"
      className="overflow-hidden border-b border-border/50 bg-background pb-15 pt-10 md:pt-15"
    >
      <motion.div
        className="container mx-auto px-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <p className="mb-10 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('landing.trustedBrands.title')}
        </p>

        <div className="relative">
          <div className="pointer-events-none absolute start-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute end-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-background to-transparent" />

          <Marquee pauseOnHover>
            {partnerLogos.map((logo, index) => (
              <div
                key={`${logo.name}-${index}`}
                className="mx-6 flex h-12 w-24 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background p-2"
              >
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="max-h-8 max-w-full object-contain opacity-90"
                />
              </div>
            ))}
          </Marquee>
        </div>
      </motion.div>
    </section>
  );
};

export default TrustedBrands;
