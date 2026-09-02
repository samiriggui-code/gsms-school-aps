'use client';

import { useLanguage } from '@/providers/i18n-provider';
import { I18N_LANGUAGES } from '@/i18n/config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { Button } from '@repo/ui/button';

function FlagIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={20}
      height={20}
      className="size-5 shrink-0 rounded-full object-cover"
      loading="lazy"
    />
  );
}

export function LanguageSwitcher() {
  const { languageCode, changeLanguage } = useLanguage();
  const currentLanguage = I18N_LANGUAGES.find((l) => l.code === languageCode) || I18N_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 gap-1 rounded-full px-1.5"
          aria-label={currentLanguage.name}
        >
          <FlagIcon src={currentLanguage.flag} alt={currentLanguage.name} />
          <span className="sr-only">{currentLanguage.shortName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {I18N_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="flex items-center gap-2"
          >
            <FlagIcon src={lang.flag} alt={lang.name} />
            <span>{lang.name}</span>
            {lang.code === languageCode && (
              <span className="ms-auto text-xs text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
