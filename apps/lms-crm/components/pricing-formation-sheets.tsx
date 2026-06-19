'use client';

import { CustomerDetailsSheet } from '@/components/customer-details-sheet';
import { CATALOG_SLUG } from '@/lib/catalog-formation-slugs';
import { MacApsDetailsSheet } from '@/components/mac-aps-details-sheet';
import { AsraDetailsSheet } from '@/components/asra-details-sheet';
import { OvtDetailsSheet } from '@/components/ovt-details-sheet';
import { MacOvtDetailsSheet } from '@/components/mac-ovt-details-sheet';
import { CynophileDetailsSheet } from '@/components/cynophile-details-sheet';
import { SsiapDetailsSheet } from '@/components/ssiap-details-sheet';
import { HabilitationDetailsSheet } from '@/components/habilitation-details-sheet';
import { SstDetailsSheet } from '@/components/sst-details-sheet';
import { EntrepriseDetailsSheet } from '@/components/entreprise-details-sheet';
import { AutresDetailsSheet } from '@/components/autres-details-sheet';

export type PricingFormationSheetsProps = {
  isDetailsOpen: boolean;
  setIsDetailsOpen: (open: boolean) => void;
  isMacApsDetailsOpen: boolean;
  setIsMacApsDetailsOpen: (open: boolean) => void;
  isAsraDetailsOpen: boolean;
  setIsAsraDetailsOpen: (open: boolean) => void;
  isOvtDetailsOpen: boolean;
  setIsOvtDetailsOpen: (open: boolean) => void;
  isMacOvtDetailsOpen: boolean;
  setIsMacOvtDetailsOpen: (open: boolean) => void;
  isAscCynophileOpen: boolean;
  setIsAscCynophileOpen: (open: boolean) => void;
  isH0B0Open: boolean;
  setIsH0B0Open: (open: boolean) => void;
  isBrOpen: boolean;
  setIsBrOpen: (open: boolean) => void;
  isBsBeOpen: boolean;
  setIsBsBeOpen: (open: boolean) => void;
  isSstInitialOpen: boolean;
  setIsSstInitialOpen: (open: boolean) => void;
  isMacSstOpen: boolean;
  setIsMacSstOpen: (open: boolean) => void;
  isStuOpen: boolean;
  setIsStuOpen: (open: boolean) => void;
  isSstEntrepriseOpen: boolean;
  setIsSstEntrepriseOpen: (open: boolean) => void;
  isSsiap1InitialOpen: boolean;
  setIsSsiap1InitialOpen: (open: boolean) => void;
  isSsiap1RecyclageOpen: boolean;
  setIsSsiap1RecyclageOpen: (open: boolean) => void;
  isSsiap1RanOpen: boolean;
  setIsSsiap1RanOpen: (open: boolean) => void;
  isSsiap2InitialOpen: boolean;
  setIsSsiap2InitialOpen: (open: boolean) => void;
  isSsiap2RecyclageOpen: boolean;
  setIsSsiap2RecyclageOpen: (open: boolean) => void;
  isSsiap2RanOpen: boolean;
  setIsSsiap2RanOpen: (open: boolean) => void;
  isSsiap3InitialOpen: boolean;
  setIsSsiap3InitialOpen: (open: boolean) => void;
  isSsiap3RecyclageOpen: boolean;
  setIsSsiap3RecyclageOpen: (open: boolean) => void;
  isSsiap3RanOpen: boolean;
  setIsSsiap3RanOpen: (open: boolean) => void;
  isGuideFileOpen: boolean;
  setIsGuideFileOpen: (open: boolean) => void;
  isAriOpen: boolean;
  setIsAriOpen: (open: boolean) => void;
  isManipulationExtincteurOpen: boolean;
  setIsManipulationExtincteurOpen: (open: boolean) => void;
  isEsiOpen: boolean;
  setIsEsiOpen: (open: boolean) => void;
  isSsiOpen: boolean;
  setIsSsiOpen: (open: boolean) => void;
  isCssiOpen: boolean;
  setIsCssiOpen: (open: boolean) => void;
  isEvacuationIncendieOpen: boolean;
  setIsEvacuationIncendieOpen: (open: boolean) => void;
  isEpiOpen: boolean;
  setIsEpiOpen: (open: boolean) => void;
  isCommissionSecuriteOpen: boolean;
  setIsCommissionSecuriteOpen: (open: boolean) => void;
  isIntraEntrepriseOpen: boolean;
  setIsIntraEntrepriseOpen: (open: boolean) => void;
};

export function PricingFormationSheets(props: PricingFormationSheetsProps) {
  return (
    <>
      <CustomerDetailsSheet
        open={props.isDetailsOpen}
        onOpenChange={props.setIsDetailsOpen}
        formationName="TFP APS"
        catalogSlug={CATALOG_SLUG.TFP_APS}
      />
      <MacApsDetailsSheet
        open={props.isMacApsDetailsOpen}
        onOpenChange={props.setIsMacApsDetailsOpen}
      />
      <AsraDetailsSheet open={props.isAsraDetailsOpen} onOpenChange={props.setIsAsraDetailsOpen} />
      <OvtDetailsSheet open={props.isOvtDetailsOpen} onOpenChange={props.setIsOvtDetailsOpen} />
      <MacOvtDetailsSheet
        open={props.isMacOvtDetailsOpen}
        onOpenChange={props.setIsMacOvtDetailsOpen}
      />
      <CynophileDetailsSheet
        open={props.isAscCynophileOpen}
        onOpenChange={props.setIsAscCynophileOpen}
      />
      <HabilitationDetailsSheet type="H0/B0" open={props.isH0B0Open} onOpenChange={props.setIsH0B0Open} />
      <HabilitationDetailsSheet
        type="BS / BE Manoeuvre"
        open={props.isBsBeOpen}
        onOpenChange={props.setIsBsBeOpen}
      />
      <HabilitationDetailsSheet type="BR" open={props.isBrOpen} onOpenChange={props.setIsBrOpen} />
      <SstDetailsSheet
        type="SST Initial"
        open={props.isSstInitialOpen}
        onOpenChange={props.setIsSstInitialOpen}
      />
      <SstDetailsSheet type="MAC SST" open={props.isMacSstOpen} onOpenChange={props.setIsMacSstOpen} />
      <SstDetailsSheet type="STU" open={props.isStuOpen} onOpenChange={props.setIsStuOpen} />
      <SstDetailsSheet
        type="SST Entreprise"
        open={props.isSstEntrepriseOpen}
        onOpenChange={props.setIsSstEntrepriseOpen}
      />
      <SsiapDetailsSheet
        level={1}
        type="initial"
        open={props.isSsiap1InitialOpen}
        onOpenChange={props.setIsSsiap1InitialOpen}
      />
      <SsiapDetailsSheet
        level={1}
        type="recyclage"
        open={props.isSsiap1RecyclageOpen}
        onOpenChange={props.setIsSsiap1RecyclageOpen}
      />
      <SsiapDetailsSheet
        level={1}
        type="ran"
        open={props.isSsiap1RanOpen}
        onOpenChange={props.setIsSsiap1RanOpen}
      />
      <SsiapDetailsSheet
        level={2}
        type="initial"
        open={props.isSsiap2InitialOpen}
        onOpenChange={props.setIsSsiap2InitialOpen}
      />
      <SsiapDetailsSheet
        level={2}
        type="recyclage"
        open={props.isSsiap2RecyclageOpen}
        onOpenChange={props.setIsSsiap2RecyclageOpen}
      />
      <SsiapDetailsSheet
        level={2}
        type="ran"
        open={props.isSsiap2RanOpen}
        onOpenChange={props.setIsSsiap2RanOpen}
      />
      <SsiapDetailsSheet
        level={3}
        type="initial"
        open={props.isSsiap3InitialOpen}
        onOpenChange={props.setIsSsiap3InitialOpen}
      />
      <SsiapDetailsSheet
        level={3}
        type="recyclage"
        open={props.isSsiap3RecyclageOpen}
        onOpenChange={props.setIsSsiap3RecyclageOpen}
      />
      <SsiapDetailsSheet
        level={3}
        type="ran"
        open={props.isSsiap3RanOpen}
        onOpenChange={props.setIsSsiap3RanOpen}
      />
      <EntrepriseDetailsSheet
        type="Guide File / Serre File"
        open={props.isGuideFileOpen}
        onOpenChange={props.setIsGuideFileOpen}
      />
      <EntrepriseDetailsSheet type="ARI" open={props.isAriOpen} onOpenChange={props.setIsAriOpen} />
      <EntrepriseDetailsSheet
        type="Manipulation Extincteur"
        open={props.isManipulationExtincteurOpen}
        onOpenChange={props.setIsManipulationExtincteurOpen}
      />
      <EntrepriseDetailsSheet type="ESI" open={props.isEsiOpen} onOpenChange={props.setIsEsiOpen} />
      <EntrepriseDetailsSheet type="SSI" open={props.isSsiOpen} onOpenChange={props.setIsSsiOpen} />
      <EntrepriseDetailsSheet type="CSSI" open={props.isCssiOpen} onOpenChange={props.setIsCssiOpen} />
      <EntrepriseDetailsSheet
        type="Evacuation Incendie"
        open={props.isEvacuationIncendieOpen}
        onOpenChange={props.setIsEvacuationIncendieOpen}
      />
      <EntrepriseDetailsSheet type="EPI" open={props.isEpiOpen} onOpenChange={props.setIsEpiOpen} />
      <AutresDetailsSheet
        type="Commission de securite"
        open={props.isCommissionSecuriteOpen}
        onOpenChange={props.setIsCommissionSecuriteOpen}
      />
      <AutresDetailsSheet
        type="Formation intra-entreprise securite"
        open={props.isIntraEntrepriseOpen}
        onOpenChange={props.setIsIntraEntrepriseOpen}
      />
    </>
  );
}
