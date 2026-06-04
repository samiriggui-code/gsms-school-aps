'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Dossier servi par Next : `apps/lms-crm/public/media/images/600x600`.
 * On prend les 5 premiers fichiers image (tri nom) pour les 5 salles seed.
 */
const ROOM_IMAGES_DIR = path.resolve(__dirname, '../../../../apps/lms-crm/public/media/images/600x600');

function firstRoomImagePublicUrls(limit = 5) {
  try {
    if (!fs.existsSync(ROOM_IMAGES_DIR)) return [];
    const names = fs
      .readdirSync(ROOM_IMAGES_DIR)
      .filter((f) => /\.(jpe?g|jpeg|png|webp|gif)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    return names.slice(0, limit).map((f) => `/media/images/600x600/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}

const ROOM_IMAGE_URLS = firstRoomImagePublicUrls(5);

/**
 * Salles vitrine CRM : UUID stables pour upsert + nested connect depuis formations-seed.
 */
const FORMATION_VENUE_ROOMS = [
  {
    id: 'c1a00001-0000-4000-8000-000000000001',
    name: 'Salle Aurore',
    shortCode: 'AURORE',
    capacity: 16,
    floorLabel: 'Rez-de-chaussée',
    sortOrder: 1,
    imageUrl: ROOM_IMAGE_URLS[0] ?? null,
  },
  {
    id: 'c1a00002-0000-4000-8000-000000000002',
    name: 'Salle Hélios',
    shortCode: 'HELIOS',
    capacity: 20,
    floorLabel: 'Niveau 1',
    sortOrder: 2,
    imageUrl: ROOM_IMAGE_URLS[1] ?? null,
  },
  {
    id: 'c1a00003-0000-4000-8000-000000000003',
    name: 'Atelier Nébula',
    shortCode: 'NEBULA',
    capacity: 12,
    floorLabel: 'Niveau 1',
    sortOrder: 3,
    imageUrl: ROOM_IMAGE_URLS[2] ?? null,
  },
  {
    id: 'c1a00004-0000-4000-8000-000000000004',
    name: 'Studio Volta',
    shortCode: 'VOLTA',
    capacity: 10,
    floorLabel: 'Niveau 2',
    sortOrder: 4,
    imageUrl: ROOM_IMAGE_URLS[3] ?? null,
  },
  {
    id: 'c1a00005-0000-4000-8000-000000000005',
    name: 'Amphi Mercure',
    shortCode: 'MERCURE',
    capacity: 32,
    floorLabel: 'Niveau 2',
    sortOrder: 5,
    imageUrl: ROOM_IMAGE_URLS[4] ?? null,
  },
];

module.exports = { FORMATION_VENUE_ROOMS };
