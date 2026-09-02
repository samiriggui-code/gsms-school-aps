'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toAbsoluteUrl } from '@/lib/helpers';
import { I18N_LANGUAGES } from '@/i18n/config';
import { useLanguage } from '@/providers/i18n-provider';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Label } from '@repo/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { portalMuted } from '@/components/portal/layout/portal-ui';

export function AccountAppearanceSection() {
  const { theme, setTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Langue & affichage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label className="text-sm font-medium">Thème</Label>
            <p className={`text-xs ${portalMuted}`}>Clair ou sombre pour toute l’application.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="me-2 size-4" />
                Mode clair
              </>
            ) : (
              <>
                <Moon className="me-2 size-4" />
                Mode sombre
              </>
            )}
          </Button>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Langue</Label>
          <Select
            value={language.code}
            onValueChange={(code) => {
              const next = I18N_LANGUAGES.find((l) => l.code === code);
              if (next) changeLanguage(next.code);
            }}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {I18N_LANGUAGES.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  <span className="flex items-center gap-2">
                    <img
                      src={toAbsoluteUrl(item.flag)}
                      alt=""
                      className="size-4 rounded-full object-cover"
                    />
                    {item.shortName} — {item.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
