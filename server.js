const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000; // or any port you want

// ✅ Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Example route to serve your homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
