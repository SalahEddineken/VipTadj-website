import { Order } from './types';

export const ordersFixture: Order[] = [
  // 1. Pending Order (Awaiting telephone validation)
  {
    id: 'ord-001',
    orderNumber: 'VIP-2026-0001',
    customer: {
      fullName: 'Karim Benali',
      phone: '0550123456',
      wilaya: 'Alger',
      wilayaCode: 16,
      commune: 'Hydra',
      address: '14 Boulevard du 11 Décembre 1960, Résidence Les Pins',
      notes: 'Appeler avant livraison svp, disponible après 14h',
    },
    items: [
      {
        productId: 'prod-001',
        title: 'Costume Deux Pièces en Laine Super 130s',
        slug: 'costume-deux-pieces-laine-super-130s',
        price: 48500,
        quantity: 1,
        selectedSize: '50',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80',
      },
      {
        productId: 'prod-003',
        title: 'Chemise Formelle en Coton Égyptien Double Retors',
        slug: 'chemise-formelle-coton-egyptien',
        price: 12500,
        quantity: 1,
        selectedSize: '40',
        image: 'https://images.unsplash.com/photo-1620012253295-c15c429f66bf?auto=format&fit=crop&w=1000&q=80',
      },
    ],
    subtotal: 61000,
    deliveryFee: 400,
    total: 61400,
    paymentMethod: 'cod',
    status: 'pending',
    statusHistory: [
      {
        status: 'pending',
        timestamp: '2026-11-13T08:30:00.000Z',
        note: 'Commande passée en ligne (Paiement à la livraison)',
      },
    ],
    createdAt: '2026-11-13T08:30:00.000Z',
    updatedAt: '2026-11-13T08:30:00.000Z',
  },

  // 2. Confirmed Order (Telephone validated, packaging in progress)
  {
    id: 'ord-002',
    orderNumber: 'VIP-2026-0002',
    customer: {
      fullName: 'Yassine Mansouri',
      phone: '0661234567',
      wilaya: 'Oran',
      wilayaCode: 31,
      commune: 'Es Senia',
      address: 'Cité 200 Logements, Bâtiment B3, N° 12',
      notes: 'Livraison à domicile',
    },
    items: [
      {
        productId: 'prod-009',
        title: 'Richelieu One-Cut en Cuir de Veau Pleine Fleur',
        slug: 'richelieu-one-cut-cuir-veau',
        price: 32000,
        quantity: 1,
        selectedSize: '42',
        image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1000&q=80',
      },
      {
        productId: 'prod-014',
        title: 'Ceinture Réversible en Cuir Barénia Boucle Palladiée',
        slug: 'ceinture-reversible-cuir-barenia',
        price: 9500,
        quantity: 1,
        selectedSize: '95',
        image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1000&q=80',
      },
    ],
    subtotal: 41500,
    deliveryFee: 600,
    total: 42100,
    paymentMethod: 'cod',
    status: 'confirmed',
    statusHistory: [
      {
        status: 'pending',
        timestamp: '2026-11-12T14:10:00.000Z',
        note: 'Commande reçue',
      },
      {
        status: 'confirmed',
        timestamp: '2026-11-12T14:45:00.000Z',
        note: 'Validation téléphonique effectuée par admin',
        updatedBy: 'Admin Mehdi',
      },
    ],
    createdAt: '2026-11-12T14:10:00.000Z',
    updatedAt: '2026-11-12T14:45:00.000Z',
  },

  // 3. Shipped Order (Dispatched with Yalidine tracking)
  {
    id: 'ord-003',
    orderNumber: 'VIP-2026-0003',
    customer: {
      fullName: 'Sofiane Bouzid',
      phone: '0770987654',
      wilaya: 'Constantine',
      wilayaCode: 25,
      commune: 'El Khroub',
      address: 'Zone Industrielle Oued Hamimine, Villa 45',
    },
    items: [
      {
        productId: 'prod-002',
        title: 'Blazer Sartorial en Cachemire et Soie',
        slug: 'blazer-sartorial-cachemire-soie',
        price: 34000,
        quantity: 1,
        selectedSize: '52',
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80',
      },
    ],
    subtotal: 34000,
    deliveryFee: 600,
    total: 34600,
    paymentMethod: 'cod',
    status: 'shipped',
    statusHistory: [
      {
        status: 'pending',
        timestamp: '2026-11-11T09:20:00.000Z',
      },
      {
        status: 'confirmed',
        timestamp: '2026-11-11T10:00:00.000Z',
        note: 'Confirmé avec le client',
      },
      {
        status: 'shipped',
        timestamp: '2026-11-11T16:30:00.000Z',
        note: 'Colis expédié via Yalidine - Bordereau #YAL-8842109',
        updatedBy: 'Admin Mehdi',
      },
    ],
    createdAt: '2026-11-11T09:20:00.000Z',
    updatedAt: '2026-11-11T16:30:00.000Z',
  },

  // 4. Delivered Order (Successfully delivered and paid)
  {
    id: 'ord-004',
    orderNumber: 'VIP-2026-0004',
    customer: {
      fullName: 'Amine Khelifi',
      phone: '0555334455',
      wilaya: 'Sétif',
      wilayaCode: 19,
      commune: 'Sétif Centre',
      address: 'Rue des Frères Meslem, Bâtiment El Djenina',
    },
    items: [
      {
        productId: 'prod-011',
        title: 'Bottines Chelsea Cousu Goodyear Box-Calf',
        slug: 'bottines-chelsea-cousu-goodyear',
        price: 36000,
        quantity: 1,
        selectedSize: '43',
        image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=1000&q=80',
      },
    ],
    subtotal: 36000,
    deliveryFee: 600,
    total: 36600,
    paymentMethod: 'cod',
    status: 'delivered',
    statusHistory: [
      { status: 'pending', timestamp: '2026-11-09T11:00:00.000Z' },
      { status: 'confirmed', timestamp: '2026-11-09T11:30:00.000Z' },
      { status: 'shipped', timestamp: '2026-11-09T17:00:00.000Z' },
      { status: 'delivered', timestamp: '2026-11-11T13:15:00.000Z', note: 'Colis livré et fonds encaissés' },
    ],
    createdAt: '2026-11-09T11:00:00.000Z',
    updatedAt: '2026-11-11T13:15:00.000Z',
  },

  // 5. Cancelled Order (Customer unreachable or cancelled)
  {
    id: 'ord-005',
    orderNumber: 'VIP-2026-0005',
    customer: {
      fullName: 'Mehdi Taleb',
      phone: '0662998877',
      wilaya: 'Adrar',
      wilayaCode: 1,
      commune: 'Adrar Centre',
      address: 'Quartier Ouest, Lot 18',
    },
    items: [
      {
        productId: 'prod-016',
        title: 'Cravate en Soie Jacquard Sept Plis Roulottée Main',
        slug: 'cravate-soie-jacquard-sept-plis',
        price: 8500,
        quantity: 2,
        selectedSize: 'Unique',
        image: 'https://images.unsplash.com/photo-1589756823695-278bc923f962?auto=format&fit=crop&w=1000&q=80',
      },
    ],
    subtotal: 17000,
    deliveryFee: 900,
    total: 17900,
    paymentMethod: 'cod',
    status: 'cancelled',
    statusHistory: [
      { status: 'pending', timestamp: '2026-11-08T16:00:00.000Z' },
      {
        status: 'cancelled',
        timestamp: '2026-11-09T10:00:00.000Z',
        note: 'Client injoignable après 3 tentatives d’appel',
        updatedBy: 'Admin Mehdi',
      },
    ],
    createdAt: '2026-11-08T16:00:00.000Z',
    updatedAt: '2026-11-09T10:00:00.000Z',
  },
];
