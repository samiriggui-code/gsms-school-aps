/**
 * Notifications in-app + conversation équipe CRM (header topbar).
 */
async function seedTopbarDemo(tx) {
  const users = await tx.user.findMany({
    where: { status: 'ACTIVE', isTrashed: false },
    select: { id: true, email: true, name: true, firstName: true, lastName: true, avatar: true },
    take: 8,
    orderBy: { createdAt: 'asc' },
  });

  if (users.length === 0) {
    console.log('Topbar seed skipped: no active users.');
    return;
  }

  const now = Date.now();
  const sampleNotifications = [
    {
      category: 'SYSTEM',
      title: 'Bienvenue sur le CRM',
      body: 'Votre espace FORM\'SSI est prêt. Consultez les paramètres système pour finaliser le profil établissement.',
      href: '/securite-configuration/parametres/settings',
    },
    {
      category: 'FINANCE',
      title: 'Nouveau devis en attente',
      body: 'Un prospect a demandé une plaquette de devis — vérifiez la file administration-facturation.',
      href: '/administration-facturation/finance/devis',
    },
    {
      category: 'ACADEMIC',
      title: 'Session formation à planifier',
      body: 'Une session SSIAP nécessite une salle et un formateur assigné.',
      href: '/gestion-academique/vie-scolaire/sessions',
    },
    {
      category: 'TICKET',
      title: 'Ticket support ouvert',
      body: 'Un ticket support priorité moyenne attend une prise en charge.',
      href: '/support-qualite/support/tickets',
    },
    {
      category: 'TEAM',
      title: 'Message équipe',
      body: 'L\'équipe pédagogique a publié une note sur le catalogue formations.',
      href: '/gestion-academique/vie-scolaire/formations',
    },
  ];

  for (const user of users) {
    const existing = await tx.inAppNotification.count({ where: { userId: user.id } });
    if (existing > 0) continue;

    const role = await tx.user.findUnique({
      where: { id: user.id },
      select: { role: { select: { slug: true } } },
    });
    const roleSlug = role?.role?.slug ?? 'collaborateur';

    const samples =
      roleSlug === 'formateur'
        ? [
            {
              category: 'ACADEMIC',
              title: 'Session à animer demain',
              body: 'Votre session TFP APS démarre à 8h — vérifiez la salle et la liste stagiaires.',
              href: '/formateur/sessions',
            },
            {
              category: 'TEAM',
              title: 'Message équipe pédagogique',
              body: 'Note interne sur le catalogue formations SSIAP.',
              href: '/formateur/annonces',
            },
            {
              category: 'TICKET',
              title: 'Demande chat stagiaire',
              body: 'Un stagiaire vous a contacté via le portail — réponse attendue.',
              href: '/formateur/stagiaires',
              metadata: { moduleKey: 'portal-candidat', eventType: 'learner.chat_request' },
            },
            {
              category: 'TICKET',
              title: 'Email stagiaire — pièce dossier',
              body: 'Notification mail : un candidat a déposé un document sur son dossier.',
              href: '/formateur/stagiaires',
              metadata: { moduleKey: 'portal-candidat', eventType: 'learner.mail' },
            },
            {
              category: 'ACADEMIC',
              title: 'Parcours e-learning mis à jour',
              body: 'Un module de votre formation a été publié.',
              href: '/formateur/parcours',
            },
          ]
        : roleSlug === 'candidat' || roleSlug === 'eleve'
          ? [
              {
                category: 'ACADEMIC',
                title: 'Convocation session',
                body: 'Votre session de formation est confirmée — consultez Mon dossier.',
                href: '/mon-dossier',
              },
              {
                category: 'TEAM',
                title: 'Message de l\'établissement',
                body: 'L\'équipe administrative a répondu à votre demande.',
                href: '/mon-dossier/notifications',
              },
              {
                category: 'TICKET',
                title: 'Demande support dossier',
                body: 'Votre ticket concernant les pièces CNAPS est en cours de traitement.',
                href: '/mon-dossier',
              },
            ]
          : sampleNotifications;

    for (let i = 0; i < samples.length; i += 1) {
      const sample = samples[i];
      const moduleKeyByCategory = {
        SYSTEM: 'securite-configuration',
        FINANCE: 'administration-facturation.finance',
        ACADEMIC: 'gestion-academique.vie-scolaire',
        TICKET: 'support-qualite.support',
        TEAM: 'gestion-academique.vie-scolaire',
      };
      const channelByCategory = {
        SYSTEM: 'ETABLISSEMENT',
        FINANCE: 'ETABLISSEMENT',
        ACADEMIC: 'PEDAGOGIE',
        TICKET: 'ETABLISSEMENT',
        TEAM: 'PEDAGOGIE',
      };
      const channel =
        sample.href?.startsWith('/mon-dossier') || sample.href?.startsWith('/e-formation')
          ? sample.href.startsWith('/mon-dossier')
            ? 'DOSSIER'
            : 'PEDAGOGIE'
          : channelByCategory[sample.category] ?? 'ETABLISSEMENT';
      await tx.inAppNotification.create({
        data: {
          userId: user.id,
          category: sample.category,
          channel,
          title: sample.title,
          body: sample.body,
          href: sample.href,
          metadata: sample.metadata ?? {
            moduleKey: moduleKeyByCategory[sample.category] ?? 'gestion-academique',
            eventType: 'seed.demo',
            severity: i < 2 ? 'WARNING' : 'INFO',
            entityImageUrl:
              {
                SYSTEM: '/media/app/mini-logo-circle-primary.svg',
                FINANCE: '/media/brand-logos/stripe.svg',
                ACADEMIC: '/media/brand-logos/google-webdev.svg',
                TICKET: '/media/brand-logos/zoom.svg',
                TEAM: '/media/avatars/300-14.png',
              }[sample.category] ?? '/media/app/mini-logo.svg',
            avatarKind: 'category_default',
          },
          readAt: i >= 3 ? null : new Date(now - (i + 1) * 3600000),
          createdAt: new Date(now - (samples.length - i) * 7200000),
        },
      });
    }
  }

  const existingConv = await tx.chatConversation.findFirst({
    where: { title: 'Équipe FORM\'SSI' },
    include: { participants: { select: { userId: true } } },
  });

  if (!existingConv) {
    const staffUsers = users;
    const creator = staffUsers[0];
    if (!creator) return;

    const rhTeam = await tx.rhTeam.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    });

    const conv = await tx.chatConversation.create({
      data: {
        type: 'GROUP',
        title: rhTeam?.name ? `Chat — ${rhTeam.name}` : 'Équipe FORM\'SSI',
        rhTeamId: rhTeam?.id ?? null,
        participants: {
          create: [{ userId: creator.id }],
        },
      },
    });

    const inviteeIds = users
      .slice(1, Math.min(5, users.length))
      .map((u) => u.id)
      .filter((id) => id !== creator.id);

    for (const inviteeUserId of inviteeIds) {
      const invitation = await tx.chatInvitation.create({
        data: {
          conversationId: conv.id,
          inviteeUserId,
          invitedById: creator.id,
          message: rhTeam
            ? `Invitation à rejoindre le canal de l'équipe ${rhTeam.name}.`
            : 'Invitation à rejoindre la discussion équipe CRM.',
        },
      });

      await tx.inAppNotification.create({
        data: {
          userId: inviteeUserId,
          category: 'TEAM',
          channel: 'PEDAGOGIE',
          title: `${creator.name ?? 'Équipe CRM'} vous invite au chat`,
          body: rhTeam
            ? `Rejoignez la conversation « Chat — ${rhTeam.name} ».`
            : 'Rejoignez la discussion équipe CRM.',
          metadata: {
            moduleKey: 'communication-contenu',
            eventType: 'chat.invitation',
            actionType: 'chat_invitation',
            invitationId: invitation.id,
            conversationId: conv.id,
            conversationTitle: rhTeam?.name ? `Chat — ${rhTeam.name}` : 'Équipe FORM\'SSI',
            teamName: rhTeam?.name ?? null,
            actorId: creator.id,
            actorName: creator.name ?? 'Équipe CRM',
            actorAvatar: creator.avatar ?? null,
            severity: 'INFO',
          },
        },
      });
    }

    const other = users[1] ?? creator;
    const messages = [
      { senderId: creator.id, body: 'Bonjour — point CRM de la semaine ?' },
      { senderId: other.id, body: 'Les inscriptions landing sont stables. Je prépare le rapport.' },
    ];

    for (let i = 0; i < messages.length; i += 1) {
      await tx.chatMessage.create({
        data: {
          conversationId: conv.id,
          senderId: messages[i].senderId,
          body: messages[i].body,
          createdAt: new Date(now - (messages.length - i) * 600000),
        },
      });

      if (i === 1 && inviteeIds.includes(other.id)) {
        await tx.chatParticipant.upsert({
          where: {
            conversationId_userId: {
              conversationId: conv.id,
              userId: other.id,
            },
          },
          create: { conversationId: conv.id, userId: other.id },
          update: {},
        });
        await tx.chatInvitation.updateMany({
          where: { conversationId: conv.id, inviteeUserId: other.id },
          data: { status: 'ACCEPTED', respondedAt: new Date() },
        });
      }
    }

    await tx.chatConversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    });

    const mentionActor = users[1] ?? creator;
    const mentionTarget = users[2] ?? users[0];
    if (mentionTarget && mentionActor) {
      await tx.inAppNotification.create({
        data: {
          userId: mentionTarget.id,
          category: 'ACADEMIC',
          title: `${mentionActor.name ?? mentionActor.email} vous a mentionné`,
          body: 'Répondez directement depuis la notification.',
          href: '/gestion-academique/vie-scolaire/formations',
          metadata: {
            moduleKey: 'gestion-academique.vie-scolaire',
            eventType: 'chat.mention',
            actionType: 'mention',
            actorId: mentionActor.id,
            actorName: mentionActor.name ?? mentionActor.email,
            actorAvatar: mentionActor.avatar ?? null,
            mentionTopic: 'Catalogue formations',
            mentionTopicHref: '/gestion-academique/vie-scolaire/formations',
            mentionQuote: `@${mentionTarget.name?.split(' ')[0] ?? 'équipe'} Point sur le catalogue SSIAP — vos retours ?`,
            contextLabel: 'Vie scolaire',
            conversationId: conv.id,
            severity: 'INFO',
          },
        },
      });
    }
  }

  console.log('Topbar notifications & chat seeded.');
}

module.exports = { seedTopbarDemo };
