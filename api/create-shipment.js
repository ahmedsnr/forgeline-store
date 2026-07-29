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

  const params = new URLSearchParams({
    token: token, // Token في الـ params مباشرة
    reference: order.orderId || '',
    nom_client: order.name,
    telephone: order.phone.replace(/\s/g, '').replace('+213', '0'),
    adresse: order.commune,
    commune: order.commune,
    code_wilaya: order.wilayaCode,
    montant: order.total,
    produit: order.items,
    type: 1,
    stop_desk: order.deliveryType === 'home' ? 0 : 1,
    remarque: order.notes || '',
    stock: 0,
  });

  const url = `${baseUrl}/api/v1/create/order?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const text = await response.text();
    console.log(`Response ${response.status}:`, text.slice(0, 300));

    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (response.ok) {
      return res.status(200).json({ success: true, data });
    } else {
      return res.status(response.status).json({ error: data });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
