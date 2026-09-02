'use client';

import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@repo/ui/accordion';
import { CustomBadge } from '@/components/custom/badge';
import { CustomTitle } from '@/components/custom/title';
import { CustomSubtitle } from '@/components/custom/subtitle';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

const FAQ_IDS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

const FAQ = () => {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-background" id="faq">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex items-center justify-center flex-col text-center gap-5 mb-25"
        >
          <CustomBadge>{t('landing.faq.badge')}</CustomBadge>
          <CustomTitle>{t('landing.faq.title')}</CustomTitle>
          <CustomSubtitle>{t('landing.faq.subtitle')}</CustomSubtitle>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {FAQ_IDS.map((id, index) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <AccordionItem
                  value={`item-${id}`}
                  className="bg-background rounded-lg border! border-border px-6 hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-start font-semibold text-foreground hover:text-indigo-600 data-[state=open]:text-indigo-600 transition-colors cursor-pointer">
                    {t(`landing.faq.items.${id}.question`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground leading-relaxed">
                    {t(`landing.faq.items.${id}.answer`)}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex flex-col justify-center items-center gap-1.5 text-center mt-12"
        >
          <span className="text-muted-foreground">{t('landing.faq.footerLead')}</span>
          <Link href="#contact" className="text-indigo-600 hover:text-indigo-700 transition-colors hover:underline">
            {t('landing.faq.footerLink')}
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
