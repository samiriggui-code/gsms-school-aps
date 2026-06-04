/**
 * Notifications in-app + conversation équipe CRM (header topbar).
 */
async function seedTopbarDemo(tx) {
  const users = await tx.user.findMany({
    where: { status: 'ACTIVE', isTrashed: false },
    select: { id: true, email: true, name: true, firstName: true, lastName: true },
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

    for (let i = 0; i < sampleNotifications.length; i += 1) {
      const sample = sampleNotifications[i];
      const moduleKeyByCategory = {
        SYSTEM: 'securite-configuration',
        FINANCE: 'administration-facturation.finance',
        ACADEMIC: 'gestion-academique.vie-scolaire',
        TICKET: 'support-qualite.support',
        TEAM: 'gestion-academique.vie-scolaire',
      };
      await tx.inAppNotification.create({
        data: {
          userId: user.id,
          category: sample.category,
          title: sample.title,
          body: sample.body,
          href: sample.href,
          metadata: {
            moduleKey: moduleKeyByCategory[sample.category] ?? 'gestion-academique',
            eventType: 'seed.demo',
            severity: i < 2 ? 'WARNING' : 'INFO',
          },
          readAt: i >= 3 ? null : new Date(now - (i + 1) * 3600000),
          createdAt: new Date(now - (sampleNotifications.length - i) * 7200000),
        },
      });
    }
  }

  const existingConv = await tx.chatConversation.findFirst({
    where: { title: 'Équipe FORM\'SSI' },
  });

  if (!existingConv) {
    const participantIds = users.slice(0, Math.min(5, users.length)).map((u) => u.id);
    const conv = await tx.chatConversation.create({
      data: {
        type: 'GROUP',
        title: 'Équipe FORM\'SSI',
        participants: {
          create: participantIds.map((userId) => ({ userId })),
        },
      },
    });

    const sender = users[0];
    const other = users[1] ?? users[0];
    const messages = [
      { senderId: sender.id, body: 'Bonjour à tous — point CRM de la semaine ?' },
      { senderId: other.id, body: 'Oui, les inscriptions landing sont stables. Je prépare le rapport.' },
      {
        senderId: sender.id,
        body: 'Parfait. Pensez à valider les paramètres établissement dans Sécurité & configuration.',
      },
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
    }

    await tx.chatConversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    });
  }

  console.log('Topbar notifications & chat seeded.');
}

module.exports = { seedTopbarDemo };
