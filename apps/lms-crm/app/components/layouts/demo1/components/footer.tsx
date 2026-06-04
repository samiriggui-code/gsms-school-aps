'use client';

import { generalSettings } from '@/config/general.config';
import { Container } from '@/components/common/container';
import { useTranslation } from '@/hooks/useTranslation';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-3 py-5">
          <div className="order-2 flex gap-2 font-normal text-sm md:order-1">
            <span className="text-muted-foreground">
              {t('footer.copyright', { year: currentYear })}
            </span>
          </div>
          <nav className="order-1 flex flex-wrap justify-center gap-4 font-normal text-sm text-muted-foreground md:order-2 md:justify-end">
            <a
              href={generalSettings.docsLink}
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary"
            >
              {t('footer.documentation')}
            </a>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
