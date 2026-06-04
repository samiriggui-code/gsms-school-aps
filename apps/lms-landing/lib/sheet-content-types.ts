export type SheetProgramModule = {
  id: string;
  title: string;
  details: string[];
};

export type SheetPrerequisiteRow = {
  item: string;
  detail: string;
  importance: string;
};

export type SheetCertStep = {
  title: string;
  description: string;
  badge: string;
};

export type SheetPresentation = {
  title: string;
  intro: string;
  suffix?: string;
  bullets: string[];
  badge: string;
};
