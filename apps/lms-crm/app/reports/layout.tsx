import './report-print.css';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <div className="report-root min-h-screen bg-white">{children}</div>;
}
