export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order } = req.body;
  if (!order) {
    return res.status(400).json({ error: 'Missing order data' });
  }

  const token = process.env.ECOTRACK_TOKEN;

  // نجرب أكثر من رابط ممكن لـ Ecotrack
  const endpoints = [
    'https://ecotrack.dz/api/v1/commandes',
    'https://app.ecotrack.dz/api/v1/commandes',
    'https://api.ecotrack.dz/api/v1/commandes',
  ];

  const body = {
    tracking: order.orderId,
    nom: order.name,
    telephone: order.phone,
    wilaya: order.wilayaCode,
    commune: order.commune,
    adresse: order.commune,
    produit: order.items,
    montant: order.total,
    type_livraison: order.deliveryType === 'home' ? 1 : 2,
    note: order.notes || '',
  };

  console.log("Sending to Ecotrack:", JSON.stringify(body));
  console.log("Token exists:", !!token);

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': token,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();
      console.log(`${endpoint} → ${response.status}: ${text}`);

      if (response.ok) {
        return res.status(200).json({ success: true, data: JSON.parse(text) });
      }
    } catch (err) {
      console.log(`${endpoint} → Error: ${err.message}`);
    }
  }

  return res.status(500).json({ error: 'All Ecotrack endpoints failed — check logs' });
}
