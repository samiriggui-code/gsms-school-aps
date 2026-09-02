'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Badge } from '@repo/ui/badge';
import { FileText, Download, ExternalLink, Loader2, ShieldCheck, Printer } from 'lucide-react';
import { User as Collaborateur } from '@/app/models/user';
import { formatDateTime, toAbsoluteUrl, getAvatarUrl, getInitials } from '@/lib/helpers';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useOfficialDocumentPreview } from '@/hooks/use-official-document-preview';

interface CollaborateurDetailsDocumentsProps {
  collaborateur: Collaborateur;
  companyProfile: any;
}

const formatDateFr = (date: Date | string | null | undefined) => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '-';
  }
};

export const CollaborateurContractTemplate = ({
  collaborateur,
  companyProfile,
  signatureDateOverride,
  embedded = false,
}: {
  collaborateur: Collaborateur;
  companyProfile: any;
  signatureDateOverride?: string;
  embedded?: boolean;
}) => {
  const companyLogo = companyProfile?.companyProfile?.logo || toAbsoluteUrl('/media/app/default-logo.svg');
  const companyName = companyProfile?.companyProfile?.companyName || companyProfile?.tenant?.name || 'LMS';
  const companyAddress = companyProfile?.companyProfile?.companyAddress || '';
  const companyZip = companyProfile?.companyProfile?.companyPostalCode || '';
  const companyCity = companyProfile?.companyProfile?.companyCity || '';
  const companySiret = companyProfile?.companyProfile?.siret || '';
  const companyDirector = companyProfile?.companyProfile?.directorFullName || '';

  const signatureDate = signatureDateOverride 
    ? new Date(signatureDateOverride).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const renderValue = (value?: string | number | null, placeholder = '................................') => {
    if (value === null || value === undefined) {
      return <span className="contract-doc__placeholder text-slate-400 italic font-normal">{placeholder}</span>;
    }
    const text = String(value).trim();
    if (!text) {
      return <span className="contract-doc__placeholder text-slate-400 italic font-normal">{placeholder}</span>;
    }
    return <strong className="text-slate-900 font-bold">{text}</strong>;
  };

  return (
    <div className={`contract-doc ${embedded ? '' : 'contract-print'} w-full bg-white`} style={{ width: '100%', margin: 0 }}>
      {!embedded ? (
      <div className="contract-doc__header contract-section p-8 pb-4 border-b-2 border-slate-900 flex justify-between items-start mb-6">
        <div className="contract-doc__brand flex items-center gap-4">
          <div className="contract-doc__logo w-16 h-16 border border-slate-200 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
             {companyLogo && <img src={companyLogo} alt="Logo" className="max-w-full max-h-full object-contain" />}
          </div>
          <div>
            <div className="contract-doc__eyebrow text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Contrat de Travail</div>
            <div className="contract-doc__title text-xl font-bold text-slate-900 tracking-tight">CONTRAT À DURÉE INDÉTERMINÉE</div>
            <div className="contract-doc__subtitle text-[10px] uppercase tracking-widest text-slate-400 font-medium">Accord entre l'entreprise et le salarié</div>
          </div>
        </div>
        <div className="contract-doc__meta text-right space-y-1">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-slate-400">Référence</span>
            <strong className="text-xs font-bold text-slate-900 uppercase tracking-tighter">CTR-{collaborateur.id.substring(0, 8)}</strong>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-slate-400">Date d'édition</span>
            <strong className="text-xs font-bold text-slate-900">{signatureDate}</strong>
          </div>
        </div>
      </div>
      ) : null}

      <div className={embedded ? 'space-y-6 text-justify text-[13px] leading-relaxed text-slate-800' : 'px-10 pb-12 space-y-6 text-justify text-[13px] leading-relaxed text-slate-800'}>
        <div className="contract-doc__section pt-4">
          <div className="contract-doc__section-title border-b border-slate-200 pb-2 mb-4 text-[11px] font-black uppercase tracking-widest text-slate-900">Entre les soussignés</div>
          <div className="grid grid-cols-2 gap-8">
            <div className="contract-doc__party-card bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">L'entreprise</div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 uppercase text-[9px]">Dénomination</span>
                  <span className="font-bold text-slate-900">{renderValue(companyName)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 uppercase text-[9px]">SIRET</span>
                  <span className="font-bold text-slate-900">{renderValue(companySiret)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 uppercase text-[9px]">Adresse</span>
                  <span className="font-bold text-slate-900 text-[11px] leading-tight">{renderValue(`${companyAddress} ${companyZip} ${companyCity}`)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 uppercase text-[9px]">Représenté par</span>
                  <span className="font-bold text-slate-900">{renderValue(companyDirector)}</span>
                </div>
              </div>
              <div className="pt-2 text-[10px] font-bold italic text-slate-400">Ci-après dénommée « l’entreprise »</div>
            </div>

            <div className="contract-doc__party-card bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Le salarié</div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 uppercase text-[9px]">Prénom & Nom</span>
                  <span className="font-bold text-slate-900 uppercase">{renderValue(`${collaborateur.firstName} ${collaborateur.lastName}`)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 uppercase text-[9px]">Date naiss.</span>
                  <span className="font-bold text-slate-900">{formatDateFr(collaborateur.birthDate)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 uppercase text-[9px]">Adresse</span>
                  <span className="font-bold text-slate-900 text-[11px] leading-tight">{renderValue(`${collaborateur.address} ${collaborateur.postalCode} ${collaborateur.city}`)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 uppercase text-[9px]">Nationalité</span>
                  <span className="font-bold text-slate-900 uppercase">{renderValue(collaborateur.nationality)}</span>
                </div>
              </div>
              <div className="pt-2 text-[10px] font-bold italic text-slate-400">Ci-après dénommé(e) « le salarié »</div>
            </div>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-1">Article 1 : Objet du contrat</h2>
          <p>
            « Le salarié / la salariée » est recruté(e) par l’entreprise en qualité de {renderValue(collaborateur.jobFunction)} 
            au coefficient hiérarchique {renderValue(collaborateur.qualification)} de la 
            convention collective {renderValue(null, 'nationale des entreprises de prévention et de sécurité')}.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-1">Article 2 : Lieu de travail</h2>
          <p>
            « Le salarié / la salariée » exercera ses fonctions principalement au siège de la société ou sur les sites d'exploitation situés en région. 
            En fonction des nécessités de service, « le salarié / la salariée » pourra être amené(e) à se déplacer.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-1">Article 3 : Date d’embauche</h2>
          <p>
            Le présent contrat prend effet le {renderValue(formatDateFr(collaborateur.contractStartDate))} et est conclu pour une durée indéterminée.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-1">Article 4 : Période d'essai</h2>
          <p>
            Le présent contrat prévoit une période d’essai d’une durée de {renderValue(null, 'deux mois')}. Cette période d’essai peut être reconduite 
            pour une durée maximum de {renderValue(null, 'quatre mois')}.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-1">Article 5 : Durée du travail</h2>
          <p>
            Le salarié travaillera à {collaborateur.workTimeType === 'FULL_TIME' ? <strong>TEMPS COMPLET</strong> : <strong>TEMPS PARTIEL</strong>}. 
            La durée hebdomadaire est fixée à {renderValue(collaborateur.workTimeType === 'FULL_TIME' ? '35' : null)} heures.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-1">Article 6 : Rémunération</h2>
          <p>
            Le salarié percevra une rémunération mensuelle brute de {renderValue(null, '................')} euros pour un horaire mensuel de 151,67 heures.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-1">Article 7 : Congés payés</h2>
          <p>
            Le salarié bénéficiera de congés payés selon les conditions fixées par les dispositions légales et conventionnelles.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-1">Article 8 : Prévoyance</h2>
          <p>
            Le salarié bénéficiera du régime de prévoyance et de retraite complémentaire en vigueur dans l’entreprise.
          </p>
        </section>

        <div className="mt-8 pt-8 border-t-2 border-slate-900">
          <div className="flex justify-between items-center mb-8">
            <div className="text-xs font-bold text-slate-400">
              FAIT À <span className="text-slate-900 uppercase">{renderValue(companyCity)}</span>, LE <span className="text-slate-900">{signatureDate}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10">
            <div className="contract-doc__signature-box border border-slate-200 rounded-2xl p-6 min-h-[160px] flex flex-col justify-between bg-slate-50/30">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cachet de l'entreprise</div>
              <div className="text-center italic text-slate-300 text-[10px]">Espace réservé au cachet et signature</div>
            </div>
            <div className="contract-doc__signature-box border border-slate-200 rounded-2xl p-6 min-h-[160px] flex flex-col justify-between bg-slate-50/30">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Signature du salarié</div>
              <div className="text-center italic text-slate-400 text-[10px]">Précédée de la mention "Lu et approuvé"</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CollaborateurDetailsDocuments = ({ collaborateur, companyProfile }: CollaborateurDetailsDocumentsProps) => {
  const { t } = useTranslation();
  const [signatureDateOverride, setSignatureDateOverride] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { openPreview, isOpening } = useOfficialDocumentPreview();

  // On récupère le contrat dans les documents du collaborateur
  const contractDoc = (collaborateur as any).documents?.find((doc: any) => doc.type === 'CONTRAT_TRAVAIL');
  const contractDocUrl = contractDoc?.fileUrl;
  const contractDocName = contractDocUrl ? contractDocUrl.split('/').pop() : 'Contrat_Travail_Signe.pdf';

  const handleOpenPreview = () => {
    void openPreview({
      templateKey: 'rh.contrat-travail',
      userId: collaborateur.id,
      options: { signatureDate: signatureDateOverride },
      autoPrint: false,
    });
  };

  const handlePrint = () => {
    void openPreview({
      templateKey: 'rh.contrat-travail',
      userId: collaborateur.id,
      options: { signatureDate: signatureDateOverride },
      autoPrint: true,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Veuillez sélectionner un fichier PDF.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', collaborateur.id);
    formData.append('documentType', 'CONTRAT_TRAVAIL');

    try {
      const response = await apiFetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Échec du chargement du document.');
      }

      toast.success(t('documents.uploadSuccess'));
      queryClient.invalidateQueries({ queryKey: ['collaborateurs'] });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Erreur lors du chargement');
      toast.error('Erreur lors du chargement');
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-none">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="size-4" />
              CONTRAT TYPE GÉNÉRÉ
            </div>
            <div className="text-sm text-muted-foreground">
              Modèle type de contrat de travail, généré automatiquement pour chaque organisation.
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  DATE DE GÉNÉRATION
                </span>
                <Input
                  type="date"
                  value={signatureDateOverride}
                  onChange={(event) => setSignatureDateOverride(event.target.value)}
                  className="w-[190px]"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setSignatureDateOverride(new Date().toISOString().slice(0, 10))}
              >
                Aujourd'hui
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2" onClick={handleOpenPreview} disabled={isOpening}>
                <ExternalLink className="size-4" />
                Consulter
              </Button>
              <Button className="gap-2" onClick={handlePrint} disabled={isOpening}>
                <Printer className="size-4" />
                Imprimer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-none">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="size-4" />
              DOCUMENT SIGNÉ (PDF)
            </div>
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 p-4 space-y-3">
              <div className="text-sm text-muted-foreground">
                {contractDocUrl ? 'Un PDF signé est déjà chargé.' : 'Aucun document signé n\'a été chargé.'}
              </div>
              {contractDocUrl ? (
                <div className="text-xs text-muted-foreground truncate" title={contractDocName}>
                  Fichier actuel: {contractDocName}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading
                    ? 'Chargement...'
                    : contractDocUrl
                      ? 'Remplacer le PDF signé'
                      : 'Charger le PDF signé'}
                </Button>
                {contractDocUrl ? (
                  <>
                    <Button asChild variant="ghost" className="gap-2">
                      <a href={contractDocUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" />
                        Ouvrir
                      </a>
                    </Button>
                    <Button asChild variant="ghost" className="gap-2">
                      <a href={contractDocUrl} download>
                        <Download className="size-4" />
                        Télécharger
                      </a>
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
            {uploadError ? (
              <div className="text-xs text-destructive">{uploadError}</div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
          </CardContent>
        </Card>
      </div>

      {contractDocUrl && (
        <div className="flex justify-end pt-4">
          <Button asChild className="gap-2 font-bold shadow-md bg-[#009ef7] hover:bg-[#009ef7]/90 text-white border-none px-6">
            <a href={contractDocUrl} download>
              <Download className="size-4" />
              Télécharger le PDF signé
            </a>
          </Button>
        </div>
      )}

      <style jsx global>{`
        .contract-doc {
          font-family: "Georgia", "Times New Roman", serif;
          font-size: 14px;
          line-height: 1.6;
          color: #0f172a;
          background: #ffffff;
          box-sizing: border-box;
        }
        .contract-doc__placeholder {
          color: #94a3b8;
          font-style: italic;
          border-bottom: 1px dotted #cbd5f5;
          padding: 0 2px;
        }
        .contract-doc__signature-box {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          min-height: 120px;
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
};
