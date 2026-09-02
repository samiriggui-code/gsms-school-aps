import { Phone, Mail, MessageCircle, Book, Shield } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@repo/ui/card';
import { toAbsoluteUrl } from '@/lib/helpers';
import { generalSettings } from '@/config/general.config';

export function HelpSection() {
  return (
    <>
      <style>
        {`
          .help-card-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2.png')}');
          }
          .dark .help-card-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2-dark.png')}');
          }
        `}
      </style>

      <Card className="border shadow-xs">
        <CardContent className="p-5 bg-cover bg-[length:80%] bg-no-repeat help-card-bg">
        <div className="grid gap-5 lg:gap-8">
          {/* Header with icon and avatars */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-5 lg:mb-8">
              <div className="p-3 rounded-xl bg-muted">
                <Shield className="size-8 text-muted-foreground" />
              </div>
              <div className="flex -space-x-3">
                <div className="w-12 h-12 rounded-full border-3 border-background overflow-hidden">
                  <img
                    src={toAbsoluteUrl('/media/avatars/300-1.png')}
                    alt="Support Agent 1"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-12 h-12 rounded-full border-3 border-background overflow-hidden">
                  <img
                    src={toAbsoluteUrl('/media/avatars/300-2.png')}
                    alt="Support Agent 2"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-12 h-12 rounded-full border-3 border-background overflow-hidden">
                  <img
                    src={toAbsoluteUrl('/media/avatars/300-3.png')}
                    alt="Support Agent 3"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-12 h-12 rounded-full border-3 border-background overflow-hidden">
                  <img
                    src={toAbsoluteUrl('/media/avatars/300-4.png')}
                    alt="Support Agent 4"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-12 h-12 rounded-full border-3 border-background overflow-hidden">
                  <img
                    src={toAbsoluteUrl('/media/avatars/300-5.png')}
                    alt="Support Agent 5"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
              Centre de Support <span className="text-primary">GSMS</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Notre équipe d'experts est là pour vous accompagner dans vos opérations de sécurité
            </p>
          </div>

          {/* Support options */}
          <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-8">
            {/* Téléphone */}
            <Card className="border shadow-xs hover:shadow-md transition-all duration-300">
              <CardContent className="p-5 lg:p-8 text-center bg-cover bg-[length:80%] bg-no-repeat help-card-bg">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Phone className="size-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2 text-lg text-foreground">Support Téléphonique</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  Assistance immédiate pour vos urgences
                </p>
              </CardContent>
              <CardFooter className="px-5 lg:px-8 py-4 flex items-center justify-center min-h-[60px]">
                <a
                  href="tel:+33123456789"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-all duration-300 text-center"
                >
                  📞 01 23 45 67 89
                </a>
              </CardFooter>
            </Card>

            {/* Email */}
            <Card className="border shadow-xs hover:shadow-md transition-all duration-300">
              <CardContent className="p-5 lg:p-8 text-center bg-cover bg-[length:80%] bg-no-repeat help-card-bg">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Mail className="size-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2 text-lg text-foreground">Support par Email</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  Réponses détaillées à vos questions
                </p>
              </CardContent>
              <CardFooter className="px-5 lg:px-8 py-4 flex items-center justify-center min-h-[60px]">
                <a
                  href="mailto:support@gsms.fr"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-all duration-300 text-center"
                >
                  ✉️ support@gsms.fr
                </a>
              </CardFooter>
            </Card>

            {/* Chat */}
            <Card className="border shadow-xs hover:shadow-md transition-all duration-300">
              <CardContent className="p-5 lg:p-8 text-center bg-cover bg-[length:80%] bg-no-repeat help-card-bg">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="size-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2 text-lg text-foreground">Chat en Ligne</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  Assistance instantanée en temps réel
                </p>
              </CardContent>
              <CardFooter className="px-5 lg:px-8 py-4 flex items-center justify-center min-h-[60px]">
                <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-all duration-300">
                  💬 Démarrer le chat
                </button>
              </CardFooter>
            </Card>

            {/* Documentation */}
            <Card className="border shadow-xs hover:shadow-md transition-all duration-300">
              <CardContent className="p-5 lg:p-8 text-center bg-cover bg-[length:80%] bg-no-repeat help-card-bg">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Book className="size-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2 text-lg text-foreground">Documentation</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  Guides complets et tutoriels
                </p>
              </CardContent>
              <CardFooter className="px-5 lg:px-8 py-4 flex items-center justify-center min-h-[60px]">
                <a
                  href={generalSettings.docsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-all duration-300 text-center"
                >
                  📚 Voir les guides
                </a>
              </CardFooter>
            </Card>
          </div>

          {/* Footer with availability */}
          <div className="text-center mt-8 pt-5 lg:pt-8 border-t border-border">
            <div className="inline-flex items-center gap-2 bg-muted/50 border rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-muted-foreground text-sm font-medium">
                🕒 Support disponible : Lun-Ven 8h-18h | Sam 9h-12h | Urgences 24h/7j
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
