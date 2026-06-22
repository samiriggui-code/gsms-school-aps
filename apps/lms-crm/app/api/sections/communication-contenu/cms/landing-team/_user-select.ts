export const landingTeamUserSelect = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  avatar: true,
  jobFunction: true,
  qualification: true,
  landingPresentation: true,
  formateurProfile: {
    select: {
      schoolInternalService: true,
      speciality: true,
      specialties: true,
      certifications: true,
      yearsOfExperience: true,
      metadata: true,
    },
  },
  collaborateurProfile: {
    select: {
      schoolInternalService: true,
      jobFunction: true,
      qualification: true,
    },
  },
} as const;
