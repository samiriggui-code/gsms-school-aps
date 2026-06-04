'use client';

import { useLanguage } from '@/providers/i18n-provider';
import { I18N_LANGUAGES, type Language } from '@repo/i18n/config';
import { toAbsoluteUrl } from '@/lib/helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { languageCode, changeLanguage, language } = useLanguage();

  const handleLanguage = (lang: Language) => {
    void changeLanguage(lang.code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 border-border/60 bg-background/80 shadow-sm"
          aria-label={language.name}
        >
          <img
            src={toAbsoluteUrl(language.flag)}
            alt={language.name}
            width={20}
            height={20}
            className="size-5 rounded-full object-cover"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44" align="end">
        <DropdownMenuRadioGroup
          value={languageCode}
          onValueChange={(value) => {
            const selected = I18N_LANGUAGES.find((item) => item.code === value);
            if (selected) handleLanguage(selected);
          }}
        >
          {I18N_LANGUAGES.map((item) => (
            <DropdownMenuRadioItem key={item.code} value={item.code}>
              <span className="flex items-center gap-2">
                <img
                  src={toAbsoluteUrl(item.flag)}
                  alt={item.name}
                  width={20}
                  height={20}
                  className="size-4 rounded-full object-cover"
                />
                <span>{item.name}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
