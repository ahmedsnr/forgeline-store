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

  const sendOrder = async (stopDesk) => {
    const params = new URLSearchParams({
      reference: order.orderId || '',
      nom_client: order.name,
      telephone: order.phone.replace(/\s/g, '').replace('+213', '0'),
      adresse: order.commune,
      commune: order.commune,
      code_wilaya: order.wilayaCode,
      montant: order.total,
      produit: order.items,
      type: 1,
      stop_desk: stopDesk,
      remarque: order.notes || '',
      stock: 0,
      boutique: 'Abou El Massakine',
    });

    const response = await fetch(`${baseUrl}/api/v1/create/order?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return { status: response.status, data, ok: response.ok };
  };

  try {
    const stopDesk = order.deliveryType === 'home' ? 0 : 1;
    let result = await sendOrder(stopDesk);
    console.log(`Attempt 1 (stop_desk=${stopDesk}):`, result.status, JSON.stringify(result.data).slice(0, 200));

    // لو فشل بسبب stop_desk، نجرب بـ توصيل منزل
    if (!result.ok && result.data?.errors?.stop_desk) {
      console.log("stop_desk not available, retrying with home delivery...");
      result = await sendOrder(0);
      console.log(`Attempt 2 (stop_desk=0):`, result.status, JSON.stringify(result.data).slice(0, 200));
    }

    if (result.ok) {
      return res.status(200).json({ success: true, data: result.data });
    } else {
      return res.status(result.status).json({ error: result.data });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
