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

  // نجيب أول بلدية صحيحة من Ecotrack لهذه الولاية
  let commune = order.commune;
  try {
    const communesRes = await fetch(
      `${baseUrl}/api/v1/get/communes?wilaya_id=${order.wilayaCode}`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }
    );
    const communesData = await communesRes.json();
    console.log("Communes for wilaya", order.wilayaCode, ":", JSON.stringify(communesData).slice(0, 500));

    // نبحث عن أقرب بلدية لما كتبه الزبون
    if (communesData && Array.isArray(communesData)) {
      const customerCommune = order.commune.toLowerCase().trim();
      const match = communesData.find(c => {
        const name = (c.name || c.commune_name || c.nom || '').toLowerCase();
        return name.includes(customerCommune) || customerCommune.includes(name);
      });
      if (match) {
        commune = match.name || match.commune_name || match.nom;
        console.log("Matched commune:", commune);
      } else {
        // نستخدم أول بلدية في الولاية كـ fallback
        const first = communesData[0];
        commune = first.name || first.commune_name || first.nom || order.commune;
        console.log("No match, using first commune:", commune);
      }
    }
  } catch (e) {
    console.log("Could not fetch communes:", e.message);
  }

  const params = new URLSearchParams({
    reference: order.orderId || '',
    nom_client: order.name,
    telephone: order.phone.replace(/\s/g, '').replace('+213', '0'),
    adresse: order.commune,
    commune: commune,
    code_wilaya: order.wilayaCode,
    montant: order.total,
    produit: order.items,
    type: 1,
    stop_desk: order.deliveryType === 'home' ? 0 : 1,
    remarque: order.notes || '',
    stock: 0,
    boutique: 'Abou El Massakine',
  });

  const url = `${baseUrl}/api/v1/create/order?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const text = await response.text();
    console.log(`Response ${response.status}:`, text.slice(0, 500));

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
