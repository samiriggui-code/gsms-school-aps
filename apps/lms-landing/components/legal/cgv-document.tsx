import { getFormssiSiteHostLabel, getFormssiSiteUrl } from '@/lib/site-public';

type CgvDocumentProps = {
  /** Dans un sheet : pas de titre page dupliqué (déjà dans SheetHeader). */
  embedInSheet?: boolean;
};

/**
 * Conditions générales de vente — texte aligné sur le document « Conditions générales de vente.docx ».
 */
export function CgvDocument({ embedInSheet = false }: CgvDocumentProps) {
  return (
    <article
      className={
        embedInSheet
          ? 'max-w-none text-foreground'
          : 'mx-auto max-w-3xl text-foreground'
      }
    >
      {!embedInSheet ? (
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Conditions générales de vente
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Les présentes CGV s&apos;appliquent aux formations organisées par FORM&apos;SSI.
          </p>
        </header>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          Les présentes CGV s&apos;appliquent aux formations organisées par FORM&apos;SSI.
        </p>
      )}

      <div className="space-y-10 text-[15px] leading-relaxed md:text-base [&_h2]:scroll-mt-24">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Article 1 – Dispositions générales
          </h2>
          <p>
            Les inscriptions aux formations organisées par FORM&apos;SSI impliquent l&apos;adhésion
            pleine et entière du responsable de l&apos;inscription et du participant aux présentes
            conditions générales qui s&apos;appliquent de plein droit et prévalent sur tout autre
            document et sur toute autre condition, à l&apos;exception de celles prévues par la loi et de
            celles qui ont été acceptées expressément entre FORM&apos;SSI et le responsable de
            l&apos;inscription.
          </p>
          <p>
            Le fait que FORM&apos;SSI ne se prévale pas à un moment de l&apos;une des présentes
            conditions ne peut pas être interprété comme valant renonciation à se prévaloir
            ultérieurement des conditions générales de vente.
          </p>
          <p>
            De même, la nullité d&apos;une des stipulations n&apos;entraînerait pas l&apos;annulation des
            conditions générales de vente dans leur ensemble qui seraient maintenues dans
            tous leurs autres effets.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Article 2 – Inscription
          </h2>
          <p>
            Le responsable de l&apos;inscription peut procéder à l&apos;inscription : en suivant le processus
            d&apos;inscription et de validation avec notamment :
          </p>
          <ul className="list-disc space-y-2 ps-6 marker:text-sky-600">
            <li>
              le choix de la prestation sur le catalogue précisant l&apos;intitulé, la durée, les dates,
              le tarif ;
            </li>
            <li>
              la lecture et l&apos;acceptation des conditions générales de vente, étape
              indispensable pour pouvoir techniquement poursuivre l&apos;inscription en ligne ;
            </li>
            <li>la validation du contrat ou de la convention ;</li>
            <li>le respect des conditions de paiement ;</li>
          </ul>
          <p>
            soit en retournant le formulaire d&apos;inscription à jour remis par la voie postale à
            l&apos;adresse visée à l&apos;article 12, accompagné des documents spécifiés.
          </p>
          <p>
            À réception du dossier complet, sous réserve des places disponibles, FORM&apos;SSI
            adresse une confirmation d&apos;inscription ainsi qu&apos;un contrat ou une convention en deux
            exemplaires.
          </p>
          <p>
            Le processus d&apos;inscription en ligne ou l&apos;envoi du formulaire d&apos;inscription par la poste
            vaut commande ferme et définitive engageant le responsable de l&apos;inscription. Dans
            tous les cas, le responsable de l&apos;inscription doit retourner sans délai un exemplaire
            original du contrat ou de la convention dûment signé pour que la réservation de sa
            place soit assurée, sous réserve des disponibilités.
          </p>
          <p>
            Le contrat ou la convention peut faire l&apos;objet d&apos;un avenant uniquement s&apos;il est accepté
            par les parties. À ce titre, toute demande par le responsable de l&apos;inscription de
            changement du participant ne sera possible que sous réserve d&apos;acceptation
            expresse par FORM&apos;SSI.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Article 3 – Durée – Calendrier – Lieu d&apos;exécution
          </h2>
          <p>
            Le calendrier, la durée ainsi que le lieu de déroulement des formations, objet de
            l&apos;inscription sont précisés sur le site internet{' '}
            <a
              href={getFormssiSiteUrl()}
              className="font-medium text-sky-600 underline underline-offset-4 hover:text-sky-700 dark:text-sky-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              {getFormssiSiteHostLabel()}
            </a>{' '}
            ainsi que sur les documents de communication de FORM&apos;SSI et le contrat ou la convention visé(e) à
            l&apos;article 2.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Article 4 – Prix – Paiement
          </h2>
          <p>
            <strong>4.1</strong> — Le prix de chaque prestation est indiqué sur le formulaire d&apos;inscription à jour et il
            est exprimé en euros et net de taxes. Le prix est forfaitaire et correspond au coût de
            la formation.
          </p>
          <p>
            Sauf mention expresse sur le formulaire d&apos;inscription, le prix ne comprend que la
            prestation au titre de la formation. Tous les autres frais (tels que, à titre indicatif, frais
            de déplacement, d&apos;hébergement, de restauration) restent sous la responsabilité et à
            la charge du responsable de l&apos;inscription ou des participants.
          </p>
          <p>
            <strong>4.2</strong> — Les éventuelles offres commerciales ne s&apos;appliquent que sous réserve qu&apos;elles
            soient expressément précisées dans les documents de communication et d&apos;en
            respecter les conditions. Elles ne sont pas cumulables entre elles.
          </p>
          <p>
            <strong>4.3</strong> — Le responsable de l&apos;inscription ou, à défaut, le participant doit régler directement
            le prix de la prestation à FORM&apos;SSI, à charge pour lui de faire sous sa responsabilité
            les éventuelles démarches aux fins de prise en charge et de remboursement total ou
            partiel de la formation par un organisme.
          </p>
          <p>
            <strong>4.4</strong> — Sauf pour les formations souscrites et payées par le stagiaire participant dans
            les conditions des articles L6353-3 et suivants du code du travail, le paiement est
            intégralement dû à l&apos;inscription.
          </p>
          <p>
            <strong>4.5</strong> — Pour les formations souscrites et payées par le stagiaire participant dans les
            conditions des articles L6353-3 et suivants du code du travail, ce dernier ne devra
            verser aucun acompte avant l&apos;expiration du délai de 10 jours visé à l&apos;article 6.1. À
            l&apos;expiration de ce délai, le stagiaire participant procèdera au paiement d&apos;un acompte
            de 30&nbsp;% du montant total net de taxes de la prestation et remettra à titre de garantie
            un chèque correspondant au solde qui devra être réglé au fur et à mesure de
            l&apos;avancement des prestations et au plus tard le dernier jour de la formation.
          </p>
          <p>
            <strong>4.6</strong> — Le règlement est effectué par carte bleue ou par virement sur le compte suivant{' '}
            <span className="whitespace-nowrap font-mono text-sm">
              FR76 1820 6000 3765 0383 4165 507 / AGRIFRPP882
            </span>{' '}
            ou, faute de paiement du solde à l&apos;échéance dans le cas visé à l&apos;article 4.5, par encaissement du chèque de
            garantie.
          </p>
          <p>
            <strong>4.7</strong> — En cas de non-règlement aux échéances par un participant ou le responsable de
            l&apos;inscription, FORM&apos;SSI se réserve la possibilité de suspendre le suivi de sa
            prestation, l&apos;intégralité du prix restant dû. Toute somme non payée à l&apos;échéance
            donnera lieu au paiement de pénalités de retard au taux d&apos;intérêt légal en vigueur
            majoré de 10 points de pourcentage outre une indemnité forfaitaire de 40&nbsp;€ pour frais
            de recouvrement. Ces pénalités sont exigibles de plein droit.
          </p>
          <p>
            <strong>4.8</strong> — Toute prestation commandée est due en intégralité, à l&apos;exception des cas
            d&apos;application des conditions visées aux articles 5 et 6.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Article 5 – Annulation</h2>
          <p>
            <strong>5.1</strong> — L&apos;annulation d&apos;une inscription à une formation par le responsable de l&apos;inscription
            ou le participant n&apos;est possible et n&apos;entraîne aucun frais que sous réserve d&apos;être
            notifiée par lettre recommandée avec accusé de réception et d&apos;être reçue par
            FORM&apos;SSI au plus tard 21 jours avant le premier jour de la formation. Si l&apos;annulation
            de la formation intervient entre 21 et 15 jours avant le premier jour de la formation, il
            sera facturé 30&nbsp;% du montant total TTC de la formation.
          </p>
          <p>
            <strong>5.2</strong> — À défaut de respect de ces conditions propres aux formations, en cas d&apos;absence
            à la formation, de retard, de participation partielle, de cessation anticipée pour tout
            autre raison qu&apos;un motif impérieux pour le participant lié à un cas de force majeure
            dûment reconnu le contraignant à une suspension ou un arrêt du suivi de la
            prestation, le participant ou, à défaut, le responsable de l&apos;inscription sera redevable
            envers FORM&apos;SSI de l&apos;intégralité du montant de la prestation à plein tarif.
          </p>
          <p>
            <strong>5.3</strong> — FORM&apos;SSI se réserve la possibilité d&apos;annuler ou de reporter une prestation.
            Lorsque le report n&apos;est pas possible pour le participant, FORM&apos;SSI procède au
            remboursement de la totalité des frais d&apos;inscription, à l&apos;exclusion de tout autre coût. Si
            l&apos;annulation intervient sans report possible à moins de 8 jours du premier jour de la
            prestation, FORM&apos;SSI remboursera également les frais de transport du participant qui
            n&apos;aurait pu en obtenir le remboursement, sur production des justificatifs du titre de
            transport ainsi que de la demande et du refus de remboursement.
          </p>
          <p>
            <strong>5.4</strong> — Aucun remboursement ne sera productif d&apos;intérêts.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Article 6 – Cas particuliers de possibilité de rétractation
          </h2>
          <p>
            <strong>6.1 – Pour les formations.</strong>
          </p>
          <p>
            Pour les inscriptions à des formations souscrites et payées par le participant stagiaire
            dans les conditions des articles L6353-3 et suivants du code du travail, le participant
            dispose d&apos;un délai de rétractation sans frais de 10 jours calendaires à compter de la
            signature de la convention visée à l&apos;article 2. Cette faculté de rétractation devra être
            effectuée par lettre recommandée avec accusé de réception adressée à FORM&apos;SSI à
            l&apos;adresse visée à l&apos;article 12, reçue avant l&apos;expiration de ce délai.
          </p>
          <p>
            <strong>6.2 – Pour les inscriptions en ligne conclues avec un consommateur.</strong>
          </p>
          <p>
            Pour les inscriptions effectuées exclusivement en ligne via le site internet{' '}
            <a
              href={getFormssiSiteUrl()}
              className="font-medium text-sky-600 underline underline-offset-4 hover:text-sky-700 dark:text-sky-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              {getFormssiSiteHostLabel()}
            </a>{' '}
            et si le responsable de l&apos;inscription a le statut de consommateur,
            c&apos;est-à-dire s&apos;il est une personne physique qui agit à des fins qui n&apos;entrent pas dans
            le cadre de son activité commerciale, industrielle, artisanale, libérale ou agricole, il
            dispose d&apos;un délai de 14 jours calendaires à compter du lendemain de l&apos;inscription
            pour procéder à l&apos;annulation sans frais de son inscription.
          </p>
          <p>
            Cette faculté de rétractation devra être effectuée par lettre recommandée avec
            accusé de réception adressée à FORM&apos;SSI à l&apos;adresse visée à l&apos;article 12, reçue
            avant l&apos;expiration de ce délai et en tout état de cause avant le début de la formation.
          </p>
          <p>
            Le responsable de l&apos;inscription reconnaît expressément que le commencement du
            suivi des prestations diligentées par FORM&apos;SSI par le participant vaut renonciation au
            droit de rétractation conformément aux dispositions de l&apos;article L.&nbsp;221-25 du code de
            la consommation.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Article 7 – Attestation de participation
          </h2>
          <p>
            Une attestation de participation est remise à chaque participant, à l&apos;issue de
            l&apos;intégralité de la prestation, uniquement si le participant l&apos;a suivie dans son
            intégralité.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Article 8 – Données nominatives
          </h2>
          <p>
            En s&apos;inscrivant et en participant aux prestations organisées par FORM&apos;SSI, le
            responsable de l&apos;inscription et le participant donnent leur consentement exprès à la
            collecte par FORM&apos;SSI des données personnelles qu&apos;ils communiquent pour la seule
            finalité de la gestion de l&apos;inscription, du suivi et des suites de la prestation ainsi que
            de la communication de toute information en lien avec la prestation. Les données
            nominatives qui sont demandées nécessaires au traitement de la demande
            d&apos;inscription et au suivi de la prestation restent exclusivement destinées à un usage
            interne par FORM&apos;SSI. Le responsable de l&apos;inscription et le participant disposent d&apos;un
            droit d&apos;accès, de modification, de rectification et d&apos;opposition s&apos;agissant des
            informations les concernant, en formulant une demande écrite auprès de FORM&apos;SSI.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Article 9 – Droits de propriété intellectuelle – Confidentialité – Droit à l&apos;image
          </h2>
          <p>
            <strong>9.1</strong> — FORM&apos;SSI est seul titulaire des droits de propriété intellectuelle de l&apos;ensemble
            des formations qu&apos;il propose. Les contenus et/ou supports pédagogiques, quelle que
            soit leur forme, utilisés par FORM&apos;SSI dans le cadre de l&apos;exécution de ses prestations
            demeurent sa propriété exclusive. Leur transmission aux participants n&apos;emporte pas
            cession des droits de propriété intellectuelle y attachés. Une utilisation totale ou
            partielle sans droit de ces contenus et/ou supports sera de nature à engager la
            responsabilité du participant concerné. En particulier, le responsable de l&apos;inscription
            et le participant s&apos;interdisent d&apos;utiliser ces contenus pour exercer une prestation
            identique ou similaire à celle de FORM&apos;SSI.
          </p>
          <p>
            <strong>9.2</strong> — Toute information relative au savoir-faire exclusif de FORM&apos;SSI dont le
            participant aura été informé à l&apos;occasion de l&apos;exécution de la prestation et plus
            généralement tout document propre à FORM&apos;SSI sont strictement confidentiels et il
            est strictement interdit au participant de les divulguer.
          </p>
          <p>
            <strong>9.3</strong> — En s&apos;inscrivant et en participant aux prestations organisées par FORM&apos;SSI, le
            participant est informé qu&apos;il pourra être photographié au cours de la formation et il
            consent à ce que son image puisse être utilisée sur des supports d&apos;information relatif
            à l&apos;activité de FORM&apos;SSI.
          </p>
          <p>
            <strong>9.4</strong> — Il incombe au responsable de l&apos;inscription d&apos;avertir le participant des obligations
            visées au présent article et, plus généralement, de celles issues des présentes
            conditions générales de vente. Par conséquent, toute violation des présentes
            conditions générales engagerait la responsabilité du responsable de l&apos;inscription ainsi
            que celle du participant.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Article 10 – Sanctions disciplinaires
          </h2>
          <p>
            Les participants sont tenus de respecter le règlement intérieur de l&apos;établissement
            dans lequel se déroulent les prestations. Pour les formations, les participants sont en
            outre tenus de respecter le règlement intérieur de FORM&apos;SSI. Il se réserve le droit,
            sans indemnité de quelque nature que ce soit, d&apos;exclure à tout moment tout
            participant dont le comportement gênerait le bon déroulement de la prestation ou
            manquerait gravement au règlement intérieur applicable. Pour les formations, les
            éventuelles sanctions seront mises en œuvre dans les conditions visées au
            règlement intérieur de FORM&apos;SSI.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Article 11 – Responsabilité</h2>
          <p>
            FORM&apos;SSI ne saurait voir sa responsabilité engagée s&apos;agissant des sanctions
            résultant du comportement du participant concerné. Les obligations souscrites par
            FORM&apos;SSI dans le cadre de ses prestations sont des obligations de moyens et non
            des obligations de résultat. FORM&apos;SSI n&apos;est pas responsable des dommages subis
            par le participant du fait de sa responsabilité et de tout dommage subi sur les effets
            personnels qu&apos;il aura apportés et qui restent sous la responsabilité exclusive du
            participant. En toute hypothèse, toute indemnité sollicitée par le responsable de
            l&apos;inscription ou le participant ne pourra pas dépasser le montant de la prestation objet
            de l&apos;inscription.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Article 12 – Élection de domicile
          </h2>
          <p>
            En fonction du lieu d&apos;exécution de la prestation pour laquelle l&apos;inscription est
            effectuée, tous les envois de correspondance visés aux présentes conditions
            générales de vente devront être transmis à la société FORM&apos;SSI à l&apos;adresse suivante&nbsp;:
            9 avenue Alexandre Maistrasse, 92500 Rueil-Malmaison.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Article 13 – Litiges</h2>
          <p>
            Les présentes conditions générales de vente ainsi que les ventes effectuées par
            l&apos;intermédiaire de FORM&apos;SSI sont soumises au droit interne français. Toute
            contestation ou litige devra donner lieu à une recherche de solution amiable. À
            défaut, les litiges avec un responsable de l&apos;inscription professionnel relèveront de la
            compétence du Tribunal de commerce de Nanterre et les autres des juridictions françaises
            compétentes.
          </p>
        </section>
      </div>
    </article>
  );
}
