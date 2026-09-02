'use client';

import { useState, useEffect } from 'react';
import { User as Conformite } from '@/app/models/user';
import { apiFetch } from '@/lib/api';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { ScrollArea } from '@repo/ui/scroll-area';
import { 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  Award, 
  Plus, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";

interface Document {
  id: string;
  type: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  fileUrl?: string;
}

interface Certification {
  id: string;
  type: string;
  level?: string;
  obtainedDate: string;
  expiryDate?: string;
  status: string;
  nextRecyclageDate?: string;
}

interface ComplianceCheck {
  status: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
  issues: any[];
  canBeAssigned: boolean;
}

export function ConformiteDetailsCompliance({ conformite }: { conformite: Conformite }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [compliance, setCompliance] = useState<ComplianceCheck | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchComplianceData();
  }, [conformite.id]);

  const fetchComplianceData = async () => {
    setIsLoading(true);
    try {
      const [docsRes, certsRes, compRes] = await Promise.all([
        apiFetch(`/api/sections/gestion-ressources/rh/documents?userId=${conformite.id}`),
        apiFetch(`/api/sections/gestion-ressources/rh/certifications?userId=${conformite.id}`),
        apiFetch(`/api/sections/gestion-ressources/rh/compliance/${conformite.id}`)
      ]);

      if (docsRes.ok) setDocuments(await docsRes.json());
      if (certsRes.ok) setCertifications(await certsRes.json());
      if (compRes.ok) setCompliance(await compRes.json());
    } catch (error) {
      console.error("Erreur lors du chargement des données de conformité:", error);
      toast.error("Impossible de charger les données de conformité");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
      case 'COMPLIANT':
        return <Badge className="bg-success/10 text-success border-success/20 font-bold">VALIDE</Badge>;
      case 'EXPIRING_SOON':
      case 'WARNING':
        return <Badge className="bg-warning/10 text-warning border-warning/20 font-bold">EXPIRE BIENTÔT</Badge>;
      case 'EXPIRED':
      case 'NON_COMPLIANT':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-bold">EXPIRÉ</Badge>;
      case 'RECYCLING_NEEDED':
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 font-bold">RECYCLAGE REQUIS</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Résumé de Conformité */}
      <Card className="border-border shadow-none bg-muted/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                ÉTAT GLOBAL DE CONFORMITÉ
              </CardTitle>
              <CardDescription className="text-xs">
                Vérification automatique des documents et certifications obligatoires.
              </CardDescription>
            </div>
            {compliance && getStatusBadge(compliance.status)}
          </div>
        </CardHeader>
        <CardContent>
          {!compliance?.canBeAssigned && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3 mb-4">
              <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-destructive">AFFECTATION BLOQUÉE</p>
                <p className="text-xs text-destructive/80 font-medium">
                  Cet agent ne peut pas être affecté à un planning tant que les documents critiques ne sont pas à jour.
                </p>
              </div>
            </div>
          )}
          
          {compliance?.issues && compliance.issues.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Anomalies détectées :</p>
              <div className="grid gap-2">
                {compliance.issues.map((issue: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-2sm bg-background border border-border rounded-md px-3 py-2">
                    {issue.severity === 'CRITICAL' ? (
                      <ShieldAlert className="size-3.5 text-destructive" />
                    ) : (
                      <AlertTriangle className="size-3.5 text-warning" />
                    )}
                    <span className="font-semibold text-foreground/80">{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-success font-bold text-sm">
              <CheckCircle2 className="size-4" />
              L'agent est 100% conforme aux exigences opérationnelles.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
        {/* Section Documents */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              DOCUMENTS LÉGAUX
            </h3>
            <Button size="sm" variant="outline" className="h-7 gap-1 font-bold text-[10px]">
              <Plus className="size-3" /> AJOUTER
            </Button>
          </div>
          
          <div className="space-y-3">
            {documents.length > 0 ? documents.map((doc) => (
              <div key={doc.id} className="group relative bg-background border border-border rounded-lg p-3 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground/90 uppercase">{doc.type.replace('_', ' ')}</p>
                    <p className="text-[11px] font-medium text-muted-foreground tracking-tight">N° {doc.number}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                        <Calendar className="size-3" />
                        Expire le {format(new Date(doc.expiryDate), 'dd/MM/yyyy')}
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {doc.fileUrl && (
                      <Button size="icon" variant="ghost" className="size-7" asChild>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3.5" />
                        </a>
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-7">
                          <MoreVertical className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-xs font-medium gap-2">
                          <Pencil className="size-3.5" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs font-medium gap-2 text-destructive">
                          <Trash2 className="size-3.5" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            )) : (
              <div className="border border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center">
                <FileText className="size-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs font-bold text-muted-foreground">Aucun document enregistré</p>
              </div>
            )}
          </div>
        </div>

        {/* Section Certifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Award className="size-4 text-muted-foreground" />
              CERTIFICATIONS PRO
            </h3>
            <Button size="sm" variant="outline" className="h-7 gap-1 font-bold text-[10px]">
              <Plus className="size-3" /> AJOUTER
            </Button>
          </div>

          <div className="space-y-3">
            {certifications.length > 0 ? certifications.map((cert) => (
              <div key={cert.id} className="bg-background border border-border rounded-lg p-3 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-foreground/90 uppercase">{cert.type}</p>
                      {cert.level && <Badge size="sm" variant="outline" className="text-[9px]">{cert.level}</Badge>}
                    </div>
                    
                    <div className="flex flex-col gap-1.5 mt-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <CheckCircle2 className="size-3 text-success" />
                        Obtenu le {format(new Date(cert.obtainedDate), 'dd/MM/yyyy')}
                      </div>
                      {cert.nextRecyclageDate && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Clock className="size-3 text-warning" />
                          Prochain recyclage : {format(new Date(cert.nextRecyclageDate), 'dd/MM/yyyy')}
                        </div>
                      )}
                      <div className="mt-1">
                        {getStatusBadge(cert.status)}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-7">
                        <MoreVertical className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-xs font-medium gap-2">
                        <Pencil className="size-3.5" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs font-medium gap-2 text-destructive">
                        <Trash2 className="size-3.5" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )) : (
              <div className="border border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center">
                <Award className="size-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs font-bold text-muted-foreground">Aucune certification enregistrée</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
