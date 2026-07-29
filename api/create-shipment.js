export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order } = req.body;
  if (!order) {
    return res.status(400).json({ error: 'Missing order data' });
  }

  const token = process.env.ECOTRACK_TOKEN;
  const baseUrl = 'https://world-express.ecotrack.dz';

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

  // نجرب كل المسارات الممكنة
  const paths = [
    '/api/v1/commandes',
    '/api/commandes',
    '/v1/commandes',
    '/commandes',
    '/api/v1/orders',
    '/api/orders',
  ];

  for (const path of paths) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': token,
        },
        body: JSON.stringify(body),
      });

      console.log(`${path} → ${response.status}`);

      if (response.status !== 404) {
        const text = await response.text();
        console.log(`Response:`, text);
        let data;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }
        return res.status(response.ok ? 200 : response.status).json({ path, status: response.status, data });
      }
    } catch (err) {
      console.log(`${path} → Error: ${err.message}`);
    }
  }

  return res.status(404).json({ error: 'No valid endpoint found', tried: paths });
}
