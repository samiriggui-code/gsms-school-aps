/**
 * Include Prisma commun pour les endpoints sessions formation (liste, détail, mutation).
 */
export const formationSessionRelationInclude = {
  formation: {
    select: {
      id: true,
      slug: true,
      name: true,
      track: true,
      parcoursSpecialite: true,
      tag: true,
      duration: true,
      description: true,
      presentationTitle: true,
      longDescription: true,
      logoUrl: true,
      cpfEligible: true,
      presentationBullets: true,
      complementaryDetails: true,
      rncpUrl: true,
      deliveryMode: true,
      providerName: true,
      providerEmail: true,
      providerPhone: true,
      providerAddress: true,
      nextSessionLabel: true,
      priceFrom: true,
      currency: true,
      successRate: true,
      catalogOffer: {
        select: {
          priceFromOverride: true,
          currencyOverride: true,
        },
      },
    },
  },
  participants: {
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  },
  venueRoom: { select: { id: true, name: true, imageUrl: true } },
} as const;
