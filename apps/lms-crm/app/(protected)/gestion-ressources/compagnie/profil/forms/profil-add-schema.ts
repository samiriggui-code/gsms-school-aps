import { z } from 'zod';

export const ProfilAddSchema = z.object({
  // Informations de l'entreprise
  type: z.enum(['PRESTATAIRE', 'SUBCONTRACTOR'], {
    message: "Le type de partenaire est requis.",
  }),
  name: z
    .string()
    .min(1, { message: "Le nom de l'entreprise est requis." })
    .min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  siret: z
    .string()
    .min(1, { message: "Le numéro SIRET est requis." })
    .length(14, { message: "Le SIRET doit contenir exactement 14 chiffres." }),
  
  // Responsable (pour Sous-traitants)
  representativeFirstName: z.string().optional(),
  representativeLastName: z.string().optional(),
  
  // Contact & Localisation
  email: z.string().email({
    message: "Veuillez entrer une adresse email de contact valide.",
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),

  // Spécificités Prestataire
  service: z.string().optional(), // ex: Nettoyage, Incendie, etc.
  specialty: z.string().optional(), // Spécialité technique

  // Spécificités Sous-traitant (Sécurité)
  agreementNumber: z.string().optional(), // Agrément CNAPS ou autre
  authorizationNumber: z.string().optional(),
  expiryDate: z.string().optional(),

  // Description & Notes
  description: z.string().optional(),

  // Documents
  documentAgreement: z.any().optional(),
  documentCnaps: z.any().optional(), // Nouveau champ pour sous-traitants
  documentInsurance: z.any().optional(),
  documentKbis: z.any().optional(),
  avatar: z.any().optional(), // Logo de l'entreprise

  // Accès (pour Sous-traitants uniquement)
  password: z.string().optional(),
});

export type ProfilAddSchemaType = z.infer<typeof ProfilAddSchema>;
