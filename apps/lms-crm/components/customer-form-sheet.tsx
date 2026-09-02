'use client';

import { useState } from 'react';
import { X, User } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import { ScrollArea } from '@repo/ui/scroll-area';
import { cn } from '@/lib/utils';
import { VIE_SCOLAIRE_SHEET_AUTO } from '@/app/(protected)/gestion-academique/vie-scolaire/constants/sheet-shell-classes';
import {
  Command,
  CommandCheck,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@repo/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';

// Country data for phone number input
const countries = [
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", dialCode: "+32", flag: "🇧🇪" },
  { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭" },
  { code: "AT", name: "Austria", dialCode: "+43", flag: "🇦🇹" },
  { code: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norway", dialCode: "+47", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", dialCode: "+45", flag: "🇩🇰" },
  { code: "FI", name: "Finland", dialCode: "+358", flag: "🇫🇮" },
  { code: "PL", name: "Poland", dialCode: "+48", flag: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", dialCode: "+420", flag: "🇨🇿" },
  { code: "HU", name: "Hungary", dialCode: "+36", flag: "🇭🇺" },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
  { code: "GR", name: "Greece", dialCode: "+30", flag: "🇬🇷" },
  { code: "TR", name: "Turkey", dialCode: "+90", flag: "🇹🇷" },
  { code: "RU", name: "Russia", dialCode: "+7", flag: "🇷🇺" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷" },
  { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳" },
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { code: "HK", name: "Hong Kong", dialCode: "+852", flag: "🇭🇰" },
  { code: "TW", name: "Taiwan", dialCode: "+886", flag: "🇹🇼" },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
  { code: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭" },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭" },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩" },
  { code: "VN", name: "Vietnam", dialCode: "+84", flag: "🇻🇳" },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷" },
  { code: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴" },
  { code: "PE", name: "Peru", dialCode: "+51", flag: "🇵🇪" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬" },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪" },
  { code: "IL", name: "Israel", dialCode: "+972", flag: "🇮🇱" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
];

// Customer Avatar Upload Component
function CustomerAvatarUpload({ mode }: { mode: 'new' | 'edit' }) {
  const isNewMode = mode === 'new';
  const isEditMode = mode === 'edit';
  
  const [selectedImage, setSelectedImage] = useState<string | null>(
    isEditMode ? toAbsoluteUrl('/media/avatars/300-13.png') : null
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="w-full h-[200px] bg-accent/50 border border-border rounded-lg flex items-center justify-center">
          {selectedImage ? (
            <div className="relative flex items-center justify-center w-full h-full">
              <img
                src={selectedImage}
                alt="Customer Avatar"
                className="w-full h-full object-cover rounded-lg"
              />
              {isNewMode && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2 size-6"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="size-3" />
                </Button>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="customer-avatar-upload"
              />
              <label htmlFor="customer-avatar-upload" className="absolute bottom-3 right-3">
                <Button size="sm" variant="outline" asChild>
                  <span>{isEditMode ? 'Change' : 'Upload'}</span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <User className="size-[35px] text-muted-foreground" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="customer-avatar-upload"
              />
              <label htmlFor="customer-avatar-upload" className="absolute bottom-3 right-3">
                <Button size="sm" variant="outline" asChild>
                  <span>Upload</span>
                </Button>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Phone Number Input Component
function PhoneNumberInput({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void; 
}) {
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[8]); // Default to Netherlands

  // Handle phone number input change
  const handlePhoneChange = (inputValue: string) => {
    // Remove any non-digit characters except + at the start
    const cleanValue = inputValue.replace(/[^\d+]/g, "");

    // Check if user is typing a country code
    if (cleanValue.startsWith("+")) {
      const matchedCountry = countries.find((country) => cleanValue.startsWith(country.dialCode));

      if (matchedCountry && matchedCountry.code !== selectedCountry.code) {
        setSelectedCountry(matchedCountry);
        onChange(cleanValue.slice(matchedCountry.dialCode.length));
        return;
      }
    }

    onChange(cleanValue.startsWith("+") ? cleanValue : cleanValue);
  };

  // Handle country selection
  const handleCountrySelect = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      setOpen(false);
    }
  };

  return (
    <div className="flex items-center w-full">
      {/* Country Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-24 items-center justify-between rounded-e-none border-e-0 bg-transparent"
          >
            <span className="flex items-center gap-1.5">
              <span className="text-sm leading-none">{selectedCountry.flag}</span>
              <span className="text-xs leading-none">{selectedCountry.dialCode}</span>
            </span>
            <svg
              className="ml-2 h-4 w-4 shrink-0 opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
              <ScrollArea className="h-[300px]">
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={`${country.name} ${country.dialCode}`}
                      onSelect={() => handleCountrySelect(country.code)}
                    >
                      <span className="flex items-center gap-1.5 leading-none">
                        <span className="text-sm">{country.flag}</span>
                        <span className="text-sm text-foreground truncate">{country.name}</span>
                        <span className="text-sm text-muted-foreground">{country.dialCode}</span>
                      </span>
                      {selectedCountry.code === country.code && <CommandCheck />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Phone Number Input */}
      <Input
        type="tel"
        placeholder="Enter phone number"
        value={value.startsWith("+") ? value : value}
        onChange={(e) => handlePhoneChange(e.target.value)}
        className="rounded-l-none flex-1"
      />
    </div>
  );
}

export function CustomerFormSheet({
  mode,
  open,
  onOpenChange,
}: {
  mode: 'new' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isNewMode = mode === 'new';
  const isEditMode = mode === 'edit';

  // Form state
  const [fullName, setFullName] = useState(
    isEditMode ? 'Jeroen de Jong' : ''
  );
  const [email, setEmail] = useState(
    isEditMode ? 'jeroen.dejong@example.com' : ''
  );
  const [phoneNumber, setPhoneNumber] = useState(
    isEditMode ? '612345678' : ''
  );
  const [status, setStatus] = useState(
    isEditMode ? 'active' : ''
  );
  const [companyName, setCompanyName] = useState(
    isEditMode ? 'Acme Corporation' : ''
  );
  const [timeZone, setTimeZone] = useState(
    isEditMode ? 'europe/amsterdam' : ''
  );

  // Handle form actions
  const handleSave = () => {
    console.log(`${isNewMode ? 'Creating' : 'Saving'} customer:`, {
      fullName,
      email,
      phoneNumber,
      status,
      companyName,
      timeZone,
    });
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          VIE_SCOLAIRE_SHEET_AUTO,
          'lg:w-[820px]',
          'h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] min-h-0',
        )}
      >
        {/* Header */}
        <SheetHeader className="shrink-0 border-b border-border bg-background px-4 py-3.5 sm:px-5">
          <SheetTitle className="font-medium">
            {isNewMode ? 'New Customer' : 'Edit Customer'}
          </SheetTitle>
        </SheetHeader>

        {/* Body */}
        <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-0">
          <ScrollArea
            className="mx-1.5 flex min-h-0 flex-1 flex-col"
            viewportClassName="[&>div]:h-full [&>div>div]:h-full"
          >
            <div className="flex grow flex-wrap px-3.5 lg:flex-nowrap">
              {/* Left Section - Avatar Upload */}
              <div className="w-full shrink-0 space-y-4 py-5 lg:w-[280px] lg:pe-5">
                <CustomerAvatarUpload mode={mode} />
              </div>

              {/* Right Section - Form Fields */}
              <div className="min-w-0 grow space-y-5 border-border py-5 lg:border-s lg:ps-5">
                {/* Full Name */}
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                  <Label className="w-full shrink-0 text-xs font-medium sm:w-28">Full Name</Label>
                  <Input
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="min-w-0 flex-1"
                  />
                </div>

                {/* Email */}
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                  <Label className="w-full shrink-0 text-xs font-medium sm:w-28">Email</Label>
                  <Input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-w-0 flex-1"
                  />
                </div>

                {/* Phone Number */}
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
                  <Label className="w-full shrink-0 pt-2 text-xs font-medium sm:w-28">Phone Number</Label>
                  <div className="min-w-0 flex-1">
                    <PhoneNumberInput
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                  <Label className="w-full shrink-0 text-xs font-medium sm:w-28">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="min-w-0 flex-1">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Company Name */}
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                  <Label className="w-full shrink-0 text-xs font-medium sm:w-28">Company Name</Label>
                  <Input
                    placeholder="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="min-w-0 flex-1"
                  />
                </div>

                {/* Time Zone */}
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                  <Label className="w-full shrink-0 text-xs font-medium sm:w-28">Time Zone</Label>
                  <Select value={timeZone} onValueChange={setTimeZone}>
                    <SelectTrigger className="min-w-0 flex-1">
                      <SelectValue placeholder="Select Time Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe/amsterdam">Europe/Amsterdam</SelectItem>
                      <SelectItem value="america/new_york">America/New_York</SelectItem>
                      <SelectItem value="america/los_angeles">America/Los_Angeles</SelectItem>
                      <SelectItem value="europe/london">Europe/London</SelectItem>
                      <SelectItem value="asia/tokyo">Asia/Tokyo</SelectItem>
                      <SelectItem value="asia/singapore">Asia/Singapore</SelectItem>
                      <SelectItem value="australia/sydney">Australia/Sydney</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetBody>

        {/* Footer */}
        <SheetFooter className="flex shrink-0 flex-row flex-wrap items-center gap-2 border-t border-border bg-background p-4 pb-4 sm:p-5 sm:gap-2.5">
          <Button variant="ghost" className="shrink-0" onClick={handleClose}>
            Close
          </Button>
          <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2.5 [&::-webkit-scrollbar]:hidden">
            <Button variant="outline" className="shrink-0" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="mono" className="shrink-0" onClick={handleSave}>
              {isNewMode ? 'Create' : 'Save'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
