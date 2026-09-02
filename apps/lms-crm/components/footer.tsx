'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Facebook, Github, X, Linkedin, Mail } from 'lucide-react';
import { Separator } from '@repo/ui/separator';
import Logo from '@/components/logo';
import { CgvSheet } from '@/components/cgv-sheet';
import { useTranslation } from '@/hooks/useTranslation';

const FOOTER_COLUMNS = [
  {
    id: 'formations',
    items: ['privateSecurity', 'fireSafety', 'recycling', 'certification'],
  },
  {
    id: 'school',
    items: ['about', 'trainers', 'partners', 'contact'],
  },
  {
    id: 'help',
    items: ['faq', 'funding', 'calendar', 'regulations'],
  },
] as const;

const Footer = () => {
  const { t } = useTranslation();
  const [cgvOpen, setCgvOpen] = useState(false);

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: X, href: '#', label: 'X (Twitter)' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: '#', label: 'Email' },
  ];

  return (
    <footer className="bg-background relative overflow-hidden">
      <div className="container px-6 mx-auto pt-14 pb-6 border-b border-border/50">
        <div className="flex flex-col lg:flex-row justify-between items-start">
          <div className="lg:w-1/3 mb-12 lg:mb-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-3">
                <Logo />
              </div>
              <p className="text-muted-foreground mb-6 max-w-sm">{t('landing.footer.description')}</p>
              <div className="flex flex-wrap items-center gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="size-9 border border-border/60 text-muted-foreground rounded-md flex items-center justify-center hover:text-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="size-4" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="w-full grow lg:w-auto lg:grow-0 lg:w-2/3 flex justify-end">
            <div className="w-full lg:w-auto flex justify-between flex-wrap lg:grid lg:grid-cols-3 gap-8 lg:gap-16">
              {FOOTER_COLUMNS.map((column, categoryIndex) => (
                <motion.div
                  key={column.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="font-medium text-base mb-4 text-muted-foreground/80">
                    {t(`landing.footer.columns.${column.id}.title`)}
                  </h3>
                  <ul className="text-base space-y-2">
                    {column.items.map((itemId) => (
                      <li key={itemId}>
                        <a
                          href="#"
                          className="text-accent-foreground hover:text-indigo-600 transition-colors hover:underline"
                        >
                          {t(`landing.footer.columns.${column.id}.${itemId}`)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-border/50" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">{t('landing.footer.copyright')}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <button
              type="button"
              onClick={() => setCgvOpen(true)}
              className="text-muted-foreground underline underline-offset-4 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {t('landing.footer.cgv')}
            </button>
            <span className="hidden text-border md:inline">|</span>
            <p className="text-muted-foreground md:text-right">{t('landing.footer.tagline')}</p>
          </div>
        </div>
      </div>
      <CgvSheet open={cgvOpen} onOpenChange={setCgvOpen} />
    </footer>
  );
};

export default Footer;
