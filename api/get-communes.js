export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { wilaya_id } = req.query;
  if (!wilaya_id) {
    return res.status(400).json({ error: 'Missing wilaya_id' });
  }

  const token = process.env.ECOTRACK_TOKEN;
  const baseUrl = 'https://world-express.ecotrack.dz';

  try {
    const response = await fetch(
      `${baseUrl}/api/v1/get/communes?wilaya_id=${wilaya_id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );

    const data = await response.json();
    console.log("Communes sample:", JSON.stringify(data[0] || {}));
    
    // Cache لمدة ساعة عشان نقلل قراءات API
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
