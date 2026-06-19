import '../reports/report-print.css';

export default function ExportLayout({ children }: { children: React.ReactNode }) {
  return <div className="report-root min-h-screen bg-white">{children}</div>;
}
