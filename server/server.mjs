import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/fetch-news', async (req, res) => {
  const { category } = req.body;
  console.log(`📨 Received request for category: ${category}`);

  // Create the prompt for the Gemini API
  const prompt = `Fetch the top indian 10 trending news articles in the category of ${category}. Provide the title, description, and source for each article.give us response in json formate inthis strcture {
        title: article.title || 'No title',
        description: article.description || 'No description',
        source: article.source || 'No source',
      }`;

  try {
    // Call the Gemini API with the appropriate payload
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAdonQ7MXhZmToca53KX0jXwq9g3rR3FCk", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log('Response from Gemini API:', data);
      res.status(200).json(data);
    } else {
      console.error('Error from Gemini API:', data);
      res.status(500).json({ message: 'Error fetching news from Gemini API' });
    }
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ message: 'Error fetching news' });
  }
});

const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
