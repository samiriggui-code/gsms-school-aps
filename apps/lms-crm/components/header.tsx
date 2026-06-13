'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, Moon, Phone, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

const LANDING_PHONE_HREF = 'tel:+33171113963';

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

const pillOutlineClass =
  'h-9 rounded-full border border-border/70 bg-background/50 px-3.5 text-sm font-medium text-foreground shadow-none hover:bg-muted/60';

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

        setIsScrolled(window.scrollY > 24);

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
          className="block w-full text-left text-sm text-foreground/90 hover:text-primary"
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
        className="block w-full text-left text-sm text-foreground/90 hover:text-primary"
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
        'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter,border-color] duration-300',
        showSolidBar
          ? 'border-b border-border/60 bg-background/90 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-background/75'
          : 'border-b border-transparent bg-background/70 backdrop-blur-md dark:bg-background/50',
      )}
    >
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        {/* Gauche : logo + navigation (pattern Limova) */}
        <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-8">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex" aria-label={t('landing.a11y.navTitle')}>
            {NAV_IDS.map((navId) => (
              <div key={navId} className="group relative">
                <button
                  type="button"
                  onClick={() => handleNavClick(navId)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    isActiveItem(navId)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  )}
                >
                  {t(`landing.nav.${navId}`)}
                </button>

                {navId !== 'home' && (
                  <div className="invisible absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-border/70 bg-background/95 p-3 opacity-0 shadow-lg backdrop-blur-md transition-all group-hover:visible group-hover:opacity-100">
                    <ul className="space-y-2">
                      {SIDEBAR_SECTIONS.find((section) => section.id === navId)?.items.map((subItem) => (
                        <li key={`${navId}-${subItem.id}`}>{renderSubNavItem(navId, subItem)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Droite : langue, thème, téléphone, CTAs */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher variant="pill" className="hidden sm:inline-flex" />

          {mounted && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              aria-label={resolvedTheme === 'dark' ? t('layout.lightMode') : t('layout.darkMode')}
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          )}

          <Button variant="outline" className={cn(pillOutlineClass, 'hidden xl:inline-flex gap-2')} asChild>
            <a href={LANDING_PHONE_HREF}>
              <Phone className="size-3.5 shrink-0" />
              <span className="tabular-nums">{t('landing.header.phoneDisplay')}</span>
            </a>
          </Button>

          <Button variant="outline" className={cn(pillOutlineClass, 'hidden md:inline-flex')} asChild>
            <Link href="/signin">{t('landing.header.signIn')}</Link>
          </Button>

          <Button
            variant="primary"
            className="hidden h-9 rounded-full px-4 text-sm font-semibold shadow-[0_0_24px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_32px_hsl(var(--primary)/0.45)] md:inline-flex"
            onClick={onSignupClick}
          >
            {t('landing.cta.signup')}
          </Button>

          <div className="flex items-center lg:hidden">
            <Drawer open={isOpen} onOpenChange={setIsOpen} shouldScaleBackground={!ios}>
              <DrawerTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0 rounded-full border-border/70"
                  aria-label={t('landing.a11y.openMenu')}
                >
                  <Menu className="size-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="px-6 pb-8">
                <DrawerTitle className="sr-only">{t('landing.a11y.navTitle')}</DrawerTitle>
                <DrawerDescription className="sr-only">
                  {t('landing.a11y.navDescription')}
                </DrawerDescription>

                <div className="mt-4 flex items-center justify-between gap-3 border-b border-border/60 pb-4">
                  <LanguageSwitcher variant="pill" />
                  {mounted && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                    >
                      {resolvedTheme === 'dark' ? t('layout.lightMode') : t('layout.darkMode')}
                    </Button>
                  )}
                </div>

                <nav className="mt-4 flex flex-wrap gap-2 border-b border-border/60 pb-4">
                  {NAV_IDS.map((navId) => (
                    <button
                      key={navId}
                      type="button"
                      onClick={() => handleNavClick(navId)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                        isActiveItem(navId)
                          ? 'bg-primary/10 text-primary'
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

                <div className="mt-6 space-y-3 border-t border-border/60 pt-4">
                  <Button variant="outline" className="h-10 w-full rounded-full" asChild>
                    <a href={LANDING_PHONE_HREF}>
                      <Phone className="size-4" />
                      {t('landing.header.phoneDisplay')}
                    </a>
                  </Button>
                  <Button variant="outline" className="h-10 w-full rounded-full" asChild>
                    <Link href="/signin" onClick={() => setIsOpen(false)}>
                      {t('landing.header.signIn')}
                    </Link>
                  </Button>
                  <Button
                    variant="primary"
                    className="h-10 w-full rounded-full font-semibold"
                    onClick={() => {
                      setIsOpen(false);
                      onSignupClick?.();
                    }}
                  >
                    {t('landing.cta.signup')}
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
