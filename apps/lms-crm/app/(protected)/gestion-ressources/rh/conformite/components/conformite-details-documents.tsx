
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ExternalLink, Loader2, ShieldCheck, Printer, X } from 'lucide-react';
import { User as Conformite } from '@/app/models/user';
import { formatDateTime, toAbsoluteUrl, getAvatarUrl, getInitials } from '@/lib/helpers';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConformiteDetailsDocumentsProps {
  conformite: Conformite;
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

const ConformiteContractTemplate = ({
  conformite,
  companyProfile,
  signatureDateOverride,
}: {
  conformite: Conformite;
  companyProfile: any;
  signatureDateOverride?: string;
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
    <div className="contract-doc contract-print w-full bg-white" style={{ width: '100%', margin: 0 }}>
      {/* En-tête Style Partenaire */}
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
            <strong className="text-xs font-bold text-slate-900 uppercase tracking-tighter">CTR-{conformite.id.substring(0, 8)}</strong>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-slate-400">Date d'édition</span>
            <strong className="text-xs font-bold text-slate-900">{signatureDate}</strong>
          </div>
        </div>
      </div>

      <div className="px-10 pb-12 space-y-6 text-justify text-[13px] leading-relaxed text-slate-800">
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
                  <span className="font-bold text-slate-900 uppercase">{renderValue(`${conformite.firstName} ${conformite.lastName}`)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 uppercase text-[9px]">Date naiss.</span>
                  <span className="font-bold text-slate-900">{formatDateFr(conformite.birthDate)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 uppercase text-[9px]">Adresse</span>
                  <span className="font-bold text-slate-900 text-[11px] leading-tight">{renderValue(`${conformite.address} ${conformite.postalCode} ${conformite.city}`)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 uppercase text-[9px]">Nationalité</span>
                  <span className="font-bold text-slate-900 uppercase">{renderValue(conformite.nationality)}</span>
                </div>
              </div>
              <div className="pt-2 text-[10px] font-bold italic text-slate-400">Ci-après dénommé(e) « le salarié »</div>
            </div>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-1">Article 1 : Objet du contrat</h2>
          <p>
            « Le salarié / la salariée » est recruté(e) par l’entreprise en qualité de {renderValue(conformite.jobFunction)} 
            au coefficient hiérarchique {renderValue(conformite.qualification)} de la 
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
            Le présent contrat prend effet le {renderValue(formatDateFr(conformite.contractStartDate))} et est conclu pour une durée indéterminée.
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
            Le salarié travaillera à {conformite.workTimeType === 'FULL_TIME' ? <strong>TEMPS COMPLET</strong> : <strong>TEMPS PARTIEL</strong>}. 
            La durée hebdomadaire est fixée à {renderValue(conformite.workTimeType === 'FULL_TIME' ? '35' : null)} heures.
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

export const ConformiteDetailsDocuments = ({ conformite, companyProfile }: ConformiteDetailsDocumentsProps) => {
  const { t } = useTranslation();
  const [signatureDateOverride, setSignatureDateOverride] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const queryClient = useQueryClient();

  // On récupère le contrat dans les documents du conformite
  const contractDoc = (conformite as any).documents?.find((doc: any) => doc.type === 'CONTRAT_TRAVAIL');
  const contractDocUrl = contractDoc?.fileUrl;
  const contractDocName = contractDocUrl ? contractDocUrl.split('/').pop() : 'Contrat_Travail_Signe.pdf';

  const handleOpenPreview = () => {
    setIsPreviewOpen(true);
  };

  const handlePrint = () => {
    if (!printFrameRef.current) return;

    const frame = printFrameRef.current;
    const contentWindow = frame.contentWindow;
    if (!contentWindow) return;

    const contentDocument = frame.contentDocument || frame.contentWindow?.document;
    if (!contentDocument) return;

    // Récupérer les styles Tailwind
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('');

    contentDocument.open();
    contentDocument.write(`
      <html>
        <head>
          <title>Contrat - ${conformite.firstName} ${conformite.lastName}</title>
          ${styles}
          <style>
            @page { 
              size: A4; 
              margin: 16mm 18mm 20mm 18mm; 
            }
            body { 
              margin: 0; 
              padding: 0; 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .contract-print { 
              width: 100%;
            }
            .contract-doc section {
              break-inside: auto;
              page-break-inside: auto;
              margin-top: 20px;
            }
            .contract-doc h2 {
              break-after: avoid;
              page-break-after: avoid;
            }
            .mt-12, section {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            @media print {
              .contract-print { width: 100%; }
            }
          </style>
        </head>
        <body>
          <div id="print-root"></div>
        </body>
      </html>
    `);
    contentDocument.close();

    // On utilise un petit hack pour rendre le composant React dans l'iframe
    // Mais ici on va juste copier le HTML pour plus de simplicité
    const root = contentDocument.getElementById('print-root');
    if (root) {
      const templateElement = document.getElementById('conformite-contract-template-hidden');
      if (templateElement) {
        root.innerHTML = templateElement.innerHTML;
        setTimeout(() => {
          contentWindow.focus();
          contentWindow.print();
        }, 500);
      }
    }
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
    formData.append('userId', conformite.id);
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
      queryClient.invalidateQueries({ queryKey: ['conformite-equipements'] });
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
              <Button variant="outline" className="gap-2" onClick={handleOpenPreview}>
                <ExternalLink className="size-4" />
                Consulter
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

      {/* Dialogue de preview plein écran */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-slate-100 border-none shadow-2xl">
          <DialogHeader className="bg-white border-b px-6 py-3 flex flex-row items-center justify-between shrink-0 space-y-0">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileText className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Aperçu du contrat de travail</DialogTitle>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                  {conformite.firstName} {conformite.lastName} • Réf: CTR-{conformite.id.substring(0, 8)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handlePrint} className="gap-2 font-bold shadow-sm">
                <Printer className="size-4" />
                Imprimer le contrat
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsPreviewOpen(false)} className="rounded-full size-9">
                <X className="size-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-8 bg-slate-200/50">
            <div className="mx-auto shadow-2xl bg-white min-h-[297mm] w-full max-w-[210mm] overflow-hidden rounded-sm transition-all duration-300 ring-1 ring-slate-300/50 hover:ring-slate-400/50">
              <div id="conformite-contract-preview-target">
                <ConformiteContractTemplate 
                  conformite={conformite} 
                  companyProfile={companyProfile}
                  signatureDateOverride={signatureDateOverride}
                />
              </div>
            </div>
            <div className="h-12" />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Hidden template for printing */}
      <div id="conformite-contract-template-hidden" className="hidden">
        <ConformiteContractTemplate 
          conformite={conformite} 
          companyProfile={companyProfile}
          signatureDateOverride={signatureDateOverride}
        />
      </div>

      {/* Iframe for printing */}
      <iframe ref={printFrameRef} className="hidden" title="Print Frame" />

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
