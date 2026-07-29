// Vercel Serverless Function - تخفي الـ Token وترسل للـ Ecotrack API
export default async function handler(req, res) {
  // نسمح فقط بـ POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order } = req.body;
  if (!order) {
    return res.status(400).json({ error: 'Missing order data' });
  }

  try {
    const response = await fetch('https://ecotrack.dz/api/v1/commandes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': process.env.ECOTRACK_TOKEN,
      },
      body: JSON.stringify({
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
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Ecotrack error:', data);
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({ success: true, tracking: data });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
