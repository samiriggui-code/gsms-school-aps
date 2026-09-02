'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { UserRole } from '@/app/models/user';
import { useSchoolRoleSelectQuery } from '@/app/(protected)/securite-configuration/acces/roles/hooks/use-role-select-query';
import { useSubcontractorSelectQuery } from '../../../hooks/use-subcontractor-select-query';
import { CollaborateurAddSchema, CollaborateurAddSchemaType } from '../../../forms/collaborateur-add-schema';
import { buildAppLoginEmail } from '@/lib/app-login-email';
import { agrementMandatoryForCollaborator, agrementUiLabels, isFormateurRole } from '@/lib/rh-agrement';
import { combineQualificationFromParts } from '@/lib/rh-school-profile-fields';
import { useRhPositionSelectQuery } from '../../../../hooks/use-rh-position-select-query';
import { useRhQualificationSelectQuery } from '../../../../hooks/use-rh-qualification-select-query';
import {
  buildQualificationPresetCatalog,
  resolveRhMetierServiceFilter,
} from '@/lib/rh-metier-referential';

const DEFAULT_FORM_VALUES: CollaborateurAddSchemaType = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  proEmail: '',
  password: '',
  roleId: '',
  userCategory: 'INTERNAL',
  subcontractorId: '',
  schoolInternalService: undefined,
  jobFunction: '',
  jobPositionId: '',
  qualification: '',
  birthPlace: '',
  nationality: 'Française',
  socialSecurityNumber: '',
  cniNumber: '',
  address: '',
  city: '',
  postalCode: '',
  contractType: '',
  workTimeType: 'FULL_TIME',
  isSchedulable: true,
  carteProNumber: '',
  carteProExpiry: '',
  birthDate: '',
  residencePermitNumber: '',
  residencePermitExpiry: '',
  documentCni: '',
  documentAssurance: '',
  documentResidencePermit: '',
  documentCartePro: '',
  avatar: '',
};

export function useCollaborateurAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('identity');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [qualPresetHits, setQualPresetHits] = useState<string[]>([]);

  const { data: roleList } = useSchoolRoleSelectQuery();
  const { data: subcontractorList } = useSubcontractorSelectQuery();

  const form = useForm<CollaborateurAddSchemaType>({
    resolver: zodResolver(CollaborateurAddSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onChange',
  });

  const { watch, setValue, reset } = form;
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const fullName = `${firstName} ${lastName}`.trim();
  const email = watch('email');
  const phone = watch('phone');
  const roleId = watch('roleId');
  const password = watch('password');
  const jobFunction = watch('jobFunction');
  const qualification = watch('qualification');
  const contractType = watch('contractType');
  const cniNumber = watch('cniNumber');
  const socialSecurityNumber = watch('socialSecurityNumber');
  const carteProNumber = watch('carteProNumber');
  const carteProExpiry = watch('carteProExpiry');
  const documentCni = watch('documentCni');
  const documentAssurance = watch('documentAssurance');
  const documentCartePro = watch('documentCartePro');
  const selectedCategory = watch('userCategory');
  const schoolInternalService = watch('schoolInternalService');
  const proEmail = watch('proEmail');
  const workTimeType = watch('workTimeType');

  const selectedRoleSlug = useMemo(
    () =>
      (roleList || []).find((r: UserRole | { id: string; slug?: string }) => r.id === roleId)?.slug as
        | string
        | undefined,
    [roleList, roleId],
  );

  const agr = agrementUiLabels(selectedRoleSlug);
  const requireDirectorAgrement = agrementMandatoryForCollaborator(selectedRoleSlug);

  const filteredRoles = (roleList || []).filter(
    (role: { targetCategory?: string }) =>
      !role.targetCategory || role.targetCategory === selectedCategory,
  );

  const metierServiceFilter = useMemo(
    () => resolveRhMetierServiceFilter(schoolInternalService, selectedRoleSlug, selectedCategory),
    [schoolInternalService, selectedRoleSlug, selectedCategory],
  );

  const { data: positionList } = useRhPositionSelectQuery(metierServiceFilter);
  const { data: qualificationList } = useRhQualificationSelectQuery(metierServiceFilter);

  const presetCatalog = useMemo(
    () =>
      buildQualificationPresetCatalog(
        qualificationList?.map((q) => q.label),
        selectedRoleSlug,
        metierServiceFilter,
      ),
    [qualificationList, selectedRoleSlug, metierServiceFilter],
  );

  const catalogKey = useMemo(() => presetCatalog.join('|'), [presetCatalog]);

  useEffect(() => {
    const allowed = new Set(presetCatalog);
    setQualPresetHits((hits) => hits.filter((h) => allowed.has(h)));
  }, [catalogKey, presetCatalog]);

  const prevSlugRef = useRef<string | null>(null);
  useEffect(() => {
    const slug = selectedRoleSlug ?? '';
    const became =
      slug === 'formateur' &&
      prevSlugRef.current !== null &&
      prevSlugRef.current !== 'formateur';
    prevSlugRef.current = slug || null;
    const jf = String(jobFunction || '').trim();
    if (became && !jf) {
      setValue('jobFunction', 'Formateur', { shouldValidate: true });
    }
  }, [selectedRoleSlug, jobFunction, setValue]);

  useEffect(() => {
    if (firstName && lastName) {
      setValue('proEmail', buildAppLoginEmail(firstName, lastName));
    }
  }, [firstName, lastName, setValue]);

  useEffect(() => {
    if (!open) {
      setActiveTab('identity');
      setAvatarPreview(null);
      setQualPresetHits([]);
      setShowPassword(false);
    }
  }, [open]);

  const togglePreset = (label: string, checked: boolean) => {
    setQualPresetHits((hits) => {
      const ns = new Set(hits);
      if (checked) ns.add(label);
      else ns.delete(label);
      return presetCatalog.filter((p) => ns.has(p));
    });
  };

  const completion = {
    identity: Boolean(firstName && lastName && email && phone),
    account: Boolean(roleId && password && proEmail),
    profile: Boolean(jobFunction && (Boolean(qualification?.trim()) || qualPresetHits.length > 0)),
    contract: Boolean(contractType && workTimeType),
    compliance: Boolean(
      Boolean(cniNumber?.trim()) &&
        Boolean(socialSecurityNumber?.trim()) &&
        (!requireDirectorAgrement || (Boolean(carteProNumber?.trim()) && Boolean(carteProExpiry))),
    ),
    documents: Boolean(documentCni || documentAssurance || documentCartePro),
  };

  const completedBlocks = Object.values(completion).filter(Boolean).length;
  const totalBlocks = Object.keys(completion).length;

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let next = '';
    for (let i = 0; i < 14; i++) {
      next += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('password', next, { shouldValidate: true });
    setShowPassword(true);
  };

  const handleAvatarFileChange = (file: File) => {
    setValue('avatar', file as CollaborateurAddSchemaType['avatar']);
    const reader = new FileReader();
    reader.onload = (event) => setAvatarPreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    setValue('avatar', '');
    setAvatarPreview(null);
  };

  const mutation = useMutation({
    mutationFn: async (values: CollaborateurAddSchemaType) => {
      const slug = (roleList || []).find((r: UserRole) => r.id === values.roleId)?.slug ?? '';
      const mergedQual = combineQualificationFromParts(qualPresetHits, values.qualification || '');
      const payload = { ...values, qualification: mergedQual };
      const formData = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value);
          } else if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else {
            formData.append(key, String(value));
          }
        }
      });

      if (isFormateurRole(slug)) {
        formData.append('specialties', JSON.stringify(qualPresetHits));
      }

      const response = await apiFetch('/api/sections/gestion-ressources/rh/collaborateurs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Collaborateur ajouté et accès créés</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );

      void queryClient.invalidateQueries({ queryKey: ['rh-collaborators'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats', 'rh'] });
      void queryClient.invalidateQueries({ queryKey: ['structure-staff'] });
      void queryClient.invalidateQueries({ queryKey: ['structure-equipe'] });
      onOpenChange(false);
      reset(DEFAULT_FORM_VALUES);
      setQualPresetHits([]);
      setActiveTab('identity');
      setAvatarPreview(null);
    },
    onError: (error: Error) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{error.message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
    },
  });

  const submit = form.handleSubmit((values) => mutation.mutate(values));

  return {
    form,
    showPassword,
    setShowPassword,
    activeTab,
    setActiveTab,
    avatarPreview,
    roleList,
    subcontractorList,
    filteredRoles,
    selectedRoleSlug,
    agr,
    requireDirectorAgrement,
    positionList,
    qualificationList,
    presetCatalog,
    qualPresetHits,
    togglePreset,
    completion,
    completedBlocks,
    totalBlocks,
    fullName,
    generatePassword,
    handleAvatarFileChange,
    clearAvatar,
    mutation,
    submit,
    watch,
    setValue,
    selectedCategory,
  };
}
