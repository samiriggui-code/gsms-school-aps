import { Button } from '@repo/ui/button';
import { Card, CardContent } from '@repo/ui/card';

export function QualiopiClasseurErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="py-10 text-center text-sm">
        <p className="font-medium text-destructive">Impossible de charger le dossier Qualiopi.</p>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Réessayer
        </Button>
      </CardContent>
    </Card>
  );
}
