require('dotenv').config();
const migrate = require('../db/migrate');
const { server } = require('./app');

const PORT = process.env.PORT || 3001;

migrate()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Bally server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('[migrate] Fatal:', err.message);
    process.exit(1);
  });
