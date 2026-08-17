'use strict';

/**
 * Affectation fixe du matériel plateau examen aux salles dédiées.
 * ORION = PCS · PHOENIX = plateau incendie · ATLAS = parcours ronde
 */

const ROOM_IDS = {
  ORION: 'c1a00006-0000-4000-8000-000000000006',
  PHOENIX: 'c1a00007-0000-4000-8000-000000000007',
  ATLAS: 'c1a00008-0000-4000-8000-000000000008',
};

/** Préfixes serialNumber → salle (1 unité par lien fixe). */
const FIXED_BY_SERIAL_PREFIX = [
  // PCS Orion
  { prefix: 'PCS-', roomId: ROOM_IDS.ORION },
  { prefix: 'SSI-PED-', roomId: ROOM_IDS.ORION },
  { prefix: 'VSS-PED-', roomId: ROOM_IDS.ORION },
  { prefix: 'ALARM-INTR-', roomId: ROOM_IDS.ORION },
  { prefix: 'RADIO-ER-', roomId: ROOM_IDS.ORION },
  { prefix: 'ARM-CLES-', roomId: ROOM_IDS.ORION },
  { prefix: 'REG-CONS-', roomId: ROOM_IDS.ORION },
  { prefix: 'QCM-EXAM-', roomId: ROOM_IDS.ORION },
  { prefix: 'PC-MC-', roomId: ROOM_IDS.ORION },
  { prefix: 'VIDEOPROJ-', roomId: ROOM_IDS.ORION, optional: true },
  // Plateau Phoenix (incendie) — RIA/EXT fixes si présents
  { prefix: 'SSI-CAT-A-', roomId: ROOM_IDS.PHOENIX },
  { prefix: 'SSIAP-RONDE-', roomId: ROOM_IDS.PHOENIX },
  { prefix: 'SIM-FEU-', roomId: ROOM_IDS.PHOENIX },
  { prefix: 'RIA-', roomId: ROOM_IDS.PHOENIX, maxUnits: 1 },
  { prefix: 'EXT-CO2-', roomId: ROOM_IDS.PHOENIX, maxUnits: 2 },
  { prefix: 'EXT-EAU-', roomId: ROOM_IDS.PHOENIX, maxUnits: 1 },
  // Parcours Atlas
  { prefix: 'RONDE-PARC-', roomId: ROOM_IDS.ATLAS },
];

/**
 * @param {import('@repo/database').Prisma.TransactionClient} tx
 * @param {Map<string, string>} equipmentBySerial serial → equipmentId
 */
async function seedVenueRoomExamFixedEquipment(tx, equipmentBySerial) {
  let linked = 0;

  for (const rule of FIXED_BY_SERIAL_PREFIX) {
    let count = 0;
    for (const [serial, equipmentId] of equipmentBySerial.entries()) {
      if (!serial.startsWith(rule.prefix)) continue;
      if (rule.maxUnits != null && count >= rule.maxUnits) break;
      if (!equipmentId) continue;

      const existing = await tx.venueRoomFixedEquipment.findUnique({
        where: { equipmentId },
      });
      if (existing) continue;

      await tx.venueRoomFixedEquipment.create({
        data: {
          venueRoomId: rule.roomId,
          equipmentId,
          quantity: 1,
          installedAt: new Date('2024-10-01'),
          notes: 'Install fixe plateau examen — seed',
        },
      });
      linked += 1;
      count += 1;
    }
  }

  return linked;
}

module.exports = { seedVenueRoomExamFixedEquipment, ROOM_IDS };
