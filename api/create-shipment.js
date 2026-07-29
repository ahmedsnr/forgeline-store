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

  console.log("Sending to World Express Ecotrack:", JSON.stringify(body));

  try {
    const response = await fetch(`${baseUrl}/api/v1/commandes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': token,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    console.log(`Response ${response.status}:`, text);

    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (response.ok) {
      return res.status(200).json({ success: true, data });
    } else {
      return res.status(response.status).json({ error: data });
    }
  } catch (error) {
    console.error('Server error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
