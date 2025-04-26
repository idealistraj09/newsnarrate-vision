// pages/api/fetch-news.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { category } = req.body;

  console.log(`📨 Received request for category: ${category}`);

  const dummyNews = Array.from({ length: 10 }, (_, i) => ({
    title: `Dummy News Title ${i + 1} - ${category}`,
    description: `This is a dummy description for article ${i + 1} in category ${category}.`,
    source: { name: `Dummy Source ${i + 1}` }
  }));
  

  return res.status(200).json({ articles: dummyNews });
}
