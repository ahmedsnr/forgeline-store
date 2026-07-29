export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order } = req.body;
  if (!order) {
    return res.status(400).json({ error: 'Missing order data' });
  }

  const token = process.env.ECOTRACK_TOKEN;
  const url = 'https://world-express.ecotrack.dz/api/v1/commandes';

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

  // نجرب 3 طرق مختلفة للـ Token
  const headerOptions = [
    { 'X-Authorization': token },
    { 'Authorization': `Bearer ${token}` },
    { 'Authorization': token },
  ];

  for (const headers of headerOptions) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    console.log(`Headers ${JSON.stringify(Object.keys(headers))} → ${response.status}: ${text.slice(0, 200)}`);

    if (response.status !== 403 && response.status !== 401) {
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      return res.status(response.ok ? 200 : response.status).json({ success: response.ok, data });
    }
  }

  return res.status(403).json({ error: 'Authentication failed — check token' });
}
