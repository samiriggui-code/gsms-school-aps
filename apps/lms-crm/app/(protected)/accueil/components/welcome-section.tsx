import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, Clock } from 'lucide-react';

interface WelcomeSectionProps {
  userName?: string;
}

export const WelcomeSection = ({ userName = "Utilisateur" }: WelcomeSectionProps) => {
  const currentTime = new Date().toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center size-16 rounded-full bg-muted/50 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors group">
              <Home className="size-8 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2">
                Bienvenue, {userName} !
              </h1>
              <p className="text-lg text-muted-foreground">
                Tableau de bord GSMS - Gestion de Sécurité et Maintenance
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="mb-2 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
              <Clock className="size-4 mr-2" />
              {currentTime}
            </Badge>
            <p className="text-sm text-muted-foreground capitalize">
              {currentDate}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
