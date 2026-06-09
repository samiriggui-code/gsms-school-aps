'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SearchDialog } from '@/partials/dialogs/search/search-dialog';
import { ChatSheet } from '@/partials/topbar/chat-sheet';
import { NotificationsSheet } from '@/partials/topbar/notifications-sheet';
import { UserDropdownMenu } from '@/partials/topbar/user-dropdown-menu';
import { Bell, Menu, MessageCircleMore, Moon, Search, Sun } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { UserAvatar } from '@/components/common/user-avatar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { useTopbarSummary } from '@/hooks/use-topbar-summary';
import { useTranslation } from '@/hooks/useTranslation';
import { TopbarBadge } from '@/partials/topbar/topbar-badge';
import { I18N_LANGUAGES, Language } from '@/i18n/config';
import { useLanguage } from '@/providers/i18n-provider';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Container } from '@/components/common/container';
import { Breadcrumb } from './breadcrumb';
import { SidebarMenu } from './sidebar-menu';

export function Header() {
  const { t } = useTranslation();
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);

  const pathname = usePathname();
  const mobileMode = useIsMobile();
  const { data: session } = useSession();
  const { changeLanguage, language } = useLanguage();
  const { theme, setTheme } = useTheme();

  const scrollPosition = useScrollPosition();
  const headerSticky: boolean = scrollPosition > 0;
  const { data: topbarSummary } = useTopbarSummary();
  
  const handleLanguage = (lang: Language) => {
    changeLanguage(lang.code);
  };

  // Close sheet when route changes
  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-b border-border',
      )}
    >
      <Container className="flex justify-between items-stretch gap-2 lg:gap-4">
        {/* HeaderLogo : compact sur mobile, taille actuelle à partir de tablette (ce bloc disparaît ≥ lg). */}
        <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
          <Link href="/" className="min-w-0 shrink">
            <span className="dark:hidden">
              <img
                src={toAbsoluteUrl('/brand/formssi-logo-light.png')}
                className="h-8 w-auto max-w-[9rem] object-contain object-left sm:max-w-[11rem] md:h-[40px] md:max-w-[min(55vw,280px)]"
                alt="FORM'SSI"
              />
            </span>
            <span className="hidden dark:inline-block">
              <img
                src={toAbsoluteUrl('/brand/formssi-logo-full.png')}
                className="h-8 w-auto max-w-[9rem] object-contain object-left sm:max-w-[11rem] md:h-[44px] md:max-w-[min(55vw,280px)]"
                alt="FORM'SSI"
              />
            </span>
          </Link>
          <div className="flex shrink-0 items-center">
            {mobileMode && (
              <Sheet
                open={isSidebarSheetOpen}
                onOpenChange={setIsSidebarSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="ghost" mode="icon">
                    <Menu className="text-muted-foreground/70" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className="p-0 gap-0 w-[275px]"
                  side="left"
                  close={false}
                >
                  <SheetHeader className="p-0 space-y-0" />
                  <SheetBody className="p-0 overflow-y-auto">
                    <SidebarMenu />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {/* Main Content: always use app breadcrumb (desktop) */}
        {!mobileMode && <Breadcrumb />}

        {/* HeaderTopbar */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <>
            <SearchDialog
              trigger={
                <Button
                  variant="ghost"
                  mode="icon"
                  shape="circle"
                  className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"
                  aria-label={t('layout.search.title')}
                >
                  <Search className="size-4.5!" />
                </Button>
              }
            />
            <NotificationsSheet
              trigger={
                <Button
                  variant="ghost"
                  mode="icon"
                  shape="circle"
                  className="relative size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"
                >
                  <Bell className="size-4.5!" />
                  <TopbarBadge count={topbarSummary?.notificationUnread ?? 0} />
                </Button>
              }
            />
            <ChatSheet
              userAvatar={session?.user?.avatar}
              trigger={
                <Button
                  variant="ghost"
                  mode="icon"
                  shape="circle"
                  className="relative size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"
                >
                  <MessageCircleMore className="size-4.5!" />
                  <TopbarBadge count={topbarSummary?.chatUnread ?? 0} />
                </Button>
              }
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  mode="icon"
                  shape="circle"
                  className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"
                >
                  <img
                    src={toAbsoluteUrl(language.flag)}
                    alt={t('layout.flagAlt', { name: language.name })}
                    className="size-4.5 rounded-full object-cover"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44" side="bottom" align="end">
                <DropdownMenuRadioGroup
                  value={language.code}
                  onValueChange={(value) => {
                    const selected = I18N_LANGUAGES.find(
                      (item) => item.code === value,
                    );
                    if (selected) handleLanguage(selected);
                  }}
                >
                  {I18N_LANGUAGES.map((item) => (
                    <DropdownMenuRadioItem key={item.code} value={item.code}>
                      <span className="flex items-center gap-2">
                        <img
                          src={toAbsoluteUrl(item.flag)}
                          alt={t('layout.flagAlt', { name: item.name })}
                          className="size-4 rounded-full object-cover"
                        />
                        <span>
                          {item.shortName} - {item.name}
                        </span>
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              mode="icon"
              shape="circle"
              className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={t('layout.toggleTheme')}
            >
              {theme === 'dark' ? (
                <Sun className="size-4.5!" />
              ) : (
                <Moon className="size-4.5!" />
              )}
            </Button>
<UserDropdownMenu
              trigger={
                <div className="relative shrink-0 cursor-pointer">
                  <UserAvatar
                    avatar={session?.user?.avatar}
                    className="size-9 rounded-full border-2 border-border shrink-0"
                    alt="User Avatar"
                    fallback="/media/avatars/300-2.png"
                  />
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border-2 border-background" />
                </div>
              }
            />
          </>
        </div>
      </Container>
    </header>
  );
}
