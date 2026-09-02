'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AppWindowMac,
  Bell,
  LoaderCircleIcon,
  MailWarning,
  UserPlus,
  Users,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/ui/card';
import { Checkbox } from '@repo/ui/checkbox';
import {
  Command,
  CommandCheck,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@repo/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form';
import { Input } from '@repo/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/popover';
import { ScrollArea } from '@repo/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/table';
import { useSettings } from '../settings-context';
import {
  NotificationSettingsSchema,
  NotificationSettingsSchemaType,
} from '../../forms/notification-settings-schema';
import { useTranslation } from '@/hooks/useTranslation';

const notificationSettings = [
  {
    id: 'stock',
    emailField: 'notifyStockEmail',
    webField: 'notifyStockWeb',
    roleIdsField: 'notifyStockRoleIds',
  },
  {
    id: 'newOrder',
    emailField: 'notifyNewOrderEmail',
    webField: 'notifyNewOrderWeb',
    roleIdsField: 'notifyNewOrderRoleIds',
  },
  {
    id: 'orderStatus',
    emailField: 'notifyOrderStatusUpdateEmail',
    webField: 'notifyOrderStatusUpdateWeb',
    roleIdsField: 'notifyOrderStatusUpdateRoleIds',
  },
  {
    id: 'paymentFailure',
    emailField: 'notifyPaymentFailureEmail',
    webField: 'notifyPaymentFailureWeb',
    roleIdsField: 'notifyPaymentFailureRoleIds',
  },
  {
    id: 'systemError',
    emailField: 'notifySystemErrorFailureEmail',
    webField: 'notifySystemErrorWeb',
    roleIdsField: 'notifySystemErrorRoleIds',
  },
] as const;

export function NotificationsSettingsSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { settings, roles } = useSettings();

  const form = useForm<NotificationSettingsSchemaType>({
    resolver: zodResolver(NotificationSettingsSchema),
    defaultValues: {
      ...notificationSettings.reduce<
        Partial<NotificationSettingsSchemaType>
      >(
        (defaults, { emailField, webField, roleIdsField }) => ({
          ...defaults,
          [emailField]:
            (settings as NotificationSettingsSchemaType)[
              emailField as keyof NotificationSettingsSchemaType
            ] ?? false,
          [webField]:
            (settings as NotificationSettingsSchemaType)[
              webField as keyof NotificationSettingsSchemaType
            ] ?? false,
          [roleIdsField]:
            (settings as NotificationSettingsSchemaType)[
              roleIdsField as keyof NotificationSettingsSchemaType
            ] ?? [],
        }),
        {},
      ),
      notifyStockThreshold:
        (settings as NotificationSettingsSchemaType).notifyStockThreshold ?? 10,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: NotificationSettingsSchemaType) => {
      const response = await apiFetch(
        '/api/sections/securite-configuration/parametres/settings/notifications',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{t('pages.settings.notifications.saveSuccess')}</AlertTitle>
          </Alert>
        ),
        {
          position: 'top-center',
        },
      );

      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: (error: Error) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{error.message}</AlertTitle>
          </Alert>
        ),
        {
          position: 'top-center',
        },
      );
    },
  });

  const handleSubmit = (values: NotificationSettingsSchemaType) => {
    mutation.mutate(values);
  };

  const handleReset = () => {
    form.reset();
  };

  const toggleRoleSelection = (
    field: keyof NotificationSettingsSchemaType,
    roleId: string,
  ) => {
    const currentValues = form.getValues()[field] as string[];
    const updatedValues = currentValues.includes(roleId)
      ? currentValues.filter((id) => id !== roleId)
      : [...currentValues, roleId];

    form.setValue(field, updatedValues, { shouldDirty: true });
  };

  const isProcessing = mutation.status === 'pending';

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <Form {...form}>
        <Card className="pb-2.5">
          <CardHeader>
            <CardTitle>{t('pages.settings.notifications.title')}</CardTitle>
            <FormField
              control={form.control}
              name="notifyStockThreshold"
              render={({ field }) => (
                <FormItem className="mt-3 max-w-xs">
                  <FormLabel className="text-sm font-normal text-muted-foreground">
                    {t('pages.settings.notifications.stockThreshold')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={9999}
                      className="h-9"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardHeader>
          <CardContent className="px-0 py-2.5">
            <Table>
              <TableHeader>
                <TableRow className="text-2sm">
                  <TableHead className="w-[400px] text-muted-foreground ps-6">
                    <div className="inline-flex items-center gap-1.5">
                      <Bell className="text-muted-foreground size-3.5" />
                      {t('pages.settings.notifications.columnNotification')}
                    </div>
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    <div className="inline-flex items-center gap-1.5">
                      <Users className="text-muted-foreground size-3.5" />
                      {t('pages.settings.notifications.columnUsers')}
                    </div>
                  </TableHead>
                  <TableHead className="w-36 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-1.5">
                      <MailWarning className="text-muted-foreground size-3.5" />
                      {t('pages.settings.notifications.columnEmail')}
                    </div>
                  </TableHead>
                  <TableHead className="w-36 text-center text-muted-foreground pe-6">
                    <div className="inline-flex items-center gap-1.5">
                      <AppWindowMac className="text-muted-foreground size-3.5" />
                      {t('pages.settings.notifications.columnWeb')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificationSettings.map(
                  ({
                    id,
                    emailField,
                    webField,
                    roleIdsField,
                  }) => (
                    <TableRow key={id}>
                      <TableCell className="ps-6">
                        <div className="space-y-1">
                          <div className="text-md font-semibold">
                            {t(`pages.settings.notifications.items.${id}.label`)}
                          </div>
                          <div className="text-muted-foreground font-2sm font-regular">
                            {t(`pages.settings.notifications.items.${id}.description`)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                mode="icon"
                                className="h-7! w-7!"
                              >
                                <UserPlus className="size-3.5!" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[200px] p-0"
                              align="start"
                              side="bottom"
                            >
                              <Command>
                                <CommandInput placeholder={t('pages.settings.notifications.searchRoles')} />
                                <CommandList>
                                  <CommandEmpty>{t('pages.settings.notifications.noRoles')}</CommandEmpty>
                                  <CommandGroup>
                                    <ScrollArea>
                                      {roles?.map((role) => {
                                        const isSelected = (
                                          form.watch(
                                            roleIdsField as keyof NotificationSettingsSchemaType,
                                          ) as string[]
                                        ).includes(role.id);
                                        return (
                                          <CommandItem
                                            key={role.id}
                                            onSelect={() =>
                                              toggleRoleSelection(
                                                roleIdsField as keyof NotificationSettingsSchemaType,
                                                role.id,
                                              )
                                            }
                                          >
                                            <span className="grow">
                                              {role.name}
                                            </span>
                                            {isSelected && <CommandCheck />}
                                          </CommandItem>
                                        );
                                      })}
                                    </ScrollArea>
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <div className="flex items-center flex-wrap gap-2">
                            {(
                              form.watch(
                                roleIdsField as keyof NotificationSettingsSchemaType,
                              ) as string[]
                            )?.length > 0 ? (
                              (
                                form.watch(
                                  roleIdsField as keyof NotificationSettingsSchemaType,
                                ) as string[]
                              ).map((roleId) => {
                                const role = roles.find((r) => r.id === roleId);
                                return (
                                  <Badge key={roleId} variant="secondary">
                                    {role?.name}
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-muted-foreground">
                                {t('pages.settings.common.notSet')}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center pe-2!">
                        <FormField
                          control={form.control}
                          name={
                            emailField as keyof NotificationSettingsSchemaType
                          }
                          render={({ field }) => (
                            <FormItem className="items-center">
                              <FormControl>
                                <Checkbox
                                  checked={Boolean(field.value)}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-center pe-6!">
                        <FormField
                          control={form.control}
                          name={
                            webField as keyof NotificationSettingsSchemaType
                          }
                          render={({ field }) => (
                            <FormItem className="items-center">
                              <FormControl>
                                <Checkbox
                                  checked={Boolean(field.value)}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-end gap-4 py-5 px-10">
            <Button type="button" variant="outline" onClick={handleReset}>
              {t('pages.settings.common.reset')}
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing && <LoaderCircleIcon className="animate-spin" />}
              {t('pages.settings.common.save')}
            </Button>
          </CardFooter>
        </Card>
      </Form>
    </form>
  );
}

