const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../apps/lms-crm/app/(protected)');
const needle = '/api/sections/gestion-ressources/rh/collaborateurs/stats';

const sectionByPath = (rel) => {
  const p = rel.replace(/\\/g, '/');
  if (p.includes('communication-contenu/seo')) return 'seo';
  if (p.includes('communication-contenu/marketing')) return 'marketing';
  if (p.includes('communication-contenu/cms')) return 'cms';
  if (p.includes('administration-facturation/finance')) return 'finance';
  if (p.includes('support-qualite')) return 'support';
  if (p.includes('securite-configuration')) return 'securite';
  if (p.includes('gestion-ressources/compagnie')) return 'compagnie';
  return null;
};

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.name.endsWith('.tsx')) acc.push(full);
  }
  return acc;
}

let n = 0;
for (const file of walk(root)) {
  const rel = path.relative(root, file);
  if (rel.includes('gestion-ressources/rh/')) continue;
  if (rel.includes('rh/collaborateurs')) continue;
  if (rel.includes('rh/formateurs')) continue;

  let c = fs.readFileSync(file, 'utf8');
  if (!c.includes(needle)) continue;

  const section = sectionByPath(rel);
  if (!section) continue;

  const isEvolution = c.includes('monthlyEvolution');
  const isDistribution = c.includes('categoryDistribution');

  if (!c.includes('section-hub-stats-client') && !c.includes('use-section-hub-stats')) {
    if (isEvolution || isDistribution) {
      const imp =
        "import { fetchSectionHubMonthlyEvolution, fetchSectionHubDistribution } from '@/lib/section-hub-stats-client';\n";
      if (!c.includes("from '@/lib/section-hub-stats-client'")) {
        c = c.replace(
          /import \{ apiFetch \} from '@\/lib\/api';\n/,
          imp,
        );
      }
    } else if (c.includes('useQuery')) {
      c = c.replace(
        /import \{ useQuery \} from '@tanstack\/react-query';\nimport \{ apiFetch \} from '@\/lib\/api';\n/,
        "import { useSectionHubStats } from '@/hooks/use-section-hub-stats';\n",
      );
      c = c.replace(
        /import \{ useQuery \} from '@tanstack\/react-query';\n/,
        "import { useSectionHubStats } from '@/hooks/use-section-hub-stats';\n",
      );
    }
  }

  if (isEvolution) {
    c = c.replace(
      /queryKey:\s*\[[^\]]*\],\s*queryFn:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?monthlyEvolution[\s\S]*?\},\s*/m,
      `queryKey: ['section-hub-evolution', '${section}', selectedPeriod],\n      queryFn: () => fetchSectionHubMonthlyEvolution('${section}', selectedPeriod),\n      `,
    );
  } else if (isDistribution) {
    c = c.replace(
      /queryFn:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?collaborateurs\/stats[\s\S]*?\},/m,
      `queryFn: () => fetchSectionHubDistribution('${section}', 12),`,
    );
    c = c.replace(
      /queryKey:\s*\['rh-distribution-stats'\]/,
      `queryKey: ['section-hub-distribution', '${section}']`,
    );
  } else {
    c = c.replace(
      /const \{ data[^}]*\} = useQuery\(\{[\s\S]*?staleTime:[^}]*\}\);/m,
      `const { data: statsApi = {} } = useSectionHubStats('${section}', 12);`,
    );
    c = c.replace(/const statsApi[^=]*= data\?\.data \|\| \{\};/g, '');
    c = c.replace(/const statsApi[^=]*= data\?\.data \|\| \{\} as [^;]+;/g, '');
  }

  if (c.includes(needle)) {
    console.warn('still has needle', rel);
    continue;
  }

  fs.writeFileSync(file, c);
  n++;
  console.log(section, rel);
}
console.log('updated', n);
