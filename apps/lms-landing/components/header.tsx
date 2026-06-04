'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { RainbowButton } from '@/components/magicui/rainbow-button';
import {
  Drawer,
  DrawerTitle,
  DrawerContent,
  DrawerTrigger,
  DrawerDescription,
} from '@/components/ui/drawer';
import Logo from '@/components/logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { cn } from '@/lib/utils';
import { isFormFieldFocused, useIsIOS } from '@/lib/platform';
import { navigateToPricingTab, type LandingPricingTab } from '@/lib/landing-pricing-navigation';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

type HeaderProps = {
  onSignupClick?: () => void;
};

const NAV_IDS = ['home', 'training', 'trainers', 'school', 'help'] as const;
type NavId = (typeof NAV_IDS)[number];

type SubNavItem =
  | { id: string; href: string }
  | { id: string; pricingTab: LandingPricingTab };

const SIDEBAR_SECTIONS: { id: Exclude<NavId, 'home'>; items: SubNavItem[] }[] = [
  {
    id: 'training',
    items: [
      { id: 'surete', pricingTab: 'surete' },
      { id: 'incendie', pricingTab: 'incendie' },
      { id: 'habilitation', pricingTab: 'habilitation' },
      { id: 'sst', pricingTab: 'sst' },
      { id: 'entreprise', pricingTab: 'entreprise' },
      { id: 'autres', pricingTab: 'autres' },
    ],
  },
  {
    id: 'trainers',
    items: [
      { id: 'experts', href: '#trainers' },
      { id: 'pedagogical', href: '#trainers-pedagogique' },
      { id: 'hr', href: '#trainers-rh' },
    ],
  },
  {
    id: 'school',
    items: [
      { id: 'about', href: '#features' },
      { id: 'method', href: '#how-it-works' },
      { id: 'partners', href: '#trusted-brands' },
      { id: 'contact', href: '#contact' },
    ],
  },
  {
    id: 'help',
    items: [
      { id: 'faq', href: '#faq' },
      { id: 'funding', href: '#pricing' },
    ],
  },
];

const ACTIVE_SECTION_BY_NAV: Record<NavId, string> = {
  home: 'home',
  training: 'pricing',
  trainers: 'trainers',
  school: 'features',
  help: 'faq',
};

const Header = ({ onSignupClick }: HeaderProps) => {
  const { t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [mounted, setMounted] = useState(false);
  const activeSectionRef = useRef(activeSection);
  const ios = useIsIOS();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        if (isFormFieldFocused()) {
          ticking = false;
          return;
        }

        setIsScrolled(window.scrollY > 50);

        if (window.scrollY < 50) {
          if (activeSectionRef.current !== 'home') {
            activeSectionRef.current = 'home';
            setActiveSection('home');
          }
          ticking = false;
          return;
        }

        const sections = ['how-it-works', 'features', 'trainers', 'pricing', 'faq', 'contact'];
        const scrollPosition = window.scrollY + 200;
        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const { offsetTop, offsetHeight } = element;
            if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
              if (activeSectionRef.current !== section) {
                activeSectionRef.current = section;
                setActiveSection(section);
              }
              ticking = false;
              return;
            }
          }
        }

        ticking = false;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollBehavior = ios ? 'auto' : 'smooth';

  const handlePricingTabClick = (tab: LandingPricingTab) => {
    setIsOpen(false);
    if (pathname !== '/') {
      router.push(`/?tab=${tab}`);
      return;
    }
    navigateToPricingTab(tab);
  };

  const renderSubNavItem = (sectionId: Exclude<NavId, 'home'>, subItem: SubNavItem) => {
    const label = t(`landing.sidebar.${sectionId}.${subItem.id}`);

    if ('pricingTab' in subItem) {
      return (
        <button
          key={subItem.id}
          type="button"
          onClick={() => handlePricingTabClick(subItem.pricingTab)}
          className="block w-full text-left text-sm text-foreground/90 hover:text-indigo-600"
        >
          {label}
        </button>
      );
    }

    return (
      <Link
        key={subItem.id}
        href={subItem.href}
        prefetch={false}
        onClick={() => setIsOpen(false)}
        className="block w-full text-left text-sm text-foreground/90 hover:text-indigo-600"
      >
        {label}
      </Link>
    );
  };

  const handleNavClick = (navId: NavId) => {
    setIsOpen(false);
    if (navId === 'home') {
      router.push('/');
      window.scrollTo({ top: 0, behavior: scrollBehavior });
      return;
    }

    const targetByNav: Record<Exclude<NavId, 'home'>, string> = {
      training: 'pricing',
      trainers: 'trainers',
      school: 'features',
      help: 'faq',
    };

    const element = document.getElementById(targetByNav[navId]);
    if (element) {
      element.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    }
  };

  const isActiveItem = (navId: NavId) => activeSection === ACTIVE_SECTION_BY_NAV[navId];

  const showSolidBar = isScrolled || pathname !== '/';

  return (
    <header
      data-gsms-header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300',
        showSolidBar
          ? 'border-b border-border/40 bg-background/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/80 dark:bg-background/90'
          : 'border-b border-border/30 bg-background/95 backdrop-blur-md lg:border-transparent lg:bg-transparent lg:backdrop-blur-none',
      )}
    >
      <div className={cn('container mx-auto flex items-center justify-between gap-3 px-6 py-4')}>
        <div className="min-w-0 flex-1">
          <Logo />
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <nav className="hidden md:flex items-center space-x-8">
            {NAV_IDS.map((navId, index) => (
              <motion.div
                key={navId}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 2) * 0.1 }}
                className="relative group"
              >
                <button
                  onClick={() => handleNavClick(navId)}
                  className={cn(
                    'cursor-pointer transition-colors relative',
                    isActiveItem(navId)
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-accent-foreground hover:text-indigo-600 dark:hover:text-indigo-400',
                  )}
                >
                  {t(`landing.nav.${navId}`)}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 transition-all ${
                      isActiveItem(navId) ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  ></span>
                </button>

                {navId !== 'home' && (
                  <div className="invisible absolute left-1/2 top-full z-50 mt-4 w-56 -translate-x-1/2 rounded-lg border border-border bg-background p-3 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                    <ul className="space-y-2">
                      {SIDEBAR_SECTIONS.find((section) => section.id === navId)?.items.map((subItem) => (
                        <li key={`${navId}-${subItem.id}`}>
                          {renderSubNavItem(navId, subItem)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))}

            <Button variant="primary" onClick={onSignupClick}>
              {t('landing.cta.signup')}
            </Button>
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            <Drawer open={isOpen} onOpenChange={setIsOpen} shouldScaleBackground={!ios}>
              <DrawerTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-10 shrink-0 border-border/60 bg-background/80 text-foreground shadow-sm"
                  aria-label={t('landing.a11y.openMenu')}
                >
                  <Menu className="size-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="px-6 pb-8">
                <DrawerTitle className="sr-only">{t('landing.a11y.navTitle')}</DrawerTitle>
                <DrawerDescription className="sr-only">
                  {t('landing.a11y.navDescription')}
                </DrawerDescription>
                <nav className="mt-4 flex flex-wrap gap-2 border-b border-border/60 pb-4">
                  {NAV_IDS.map((navId) => (
                    <button
                      key={navId}
                      type="button"
                      onClick={() => handleNavClick(navId)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                        isActiveItem(navId)
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-muted text-foreground hover:bg-muted/80',
                      )}
                    >
                      {t(`landing.nav.${navId}`)}
                    </button>
                  ))}
                </nav>
                <nav className="mt-6 grid grid-cols-1 gap-5">
                  {SIDEBAR_SECTIONS.map((section) => (
                    <div key={section.id} className="space-y-2">
                      <div className="text-sm font-semibold text-foreground">
                        {t(`landing.nav.${section.id}`)}
                      </div>
                      <ul className="space-y-1">
                        {section.items.map((item) => (
                          <li key={`${section.id}-${item.id}`} className="text-sm text-muted-foreground">
                            {renderSubNavItem(section.id, item)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </nav>
                <div className="mt-6 border-t border-border/60 pt-4">
                  <div className="pt-4">
                    <RainbowButton
                      className="w-full"
                      onClick={() => {
                        setIsOpen(false);
                        onSignupClick?.();
                      }}
                    >
                      {t('landing.cta.signup')}
                    </RainbowButton>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          <LanguageSwitcher />

          {mounted && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0 border-border/60 bg-background/80 text-foreground shadow-sm md:border-transparent md:bg-transparent md:shadow-none"
              aria-label={resolvedTheme === 'dark' ? t('layout.lightMode') : t('layout.darkMode')}
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
