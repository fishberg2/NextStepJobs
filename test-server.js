import express from 'express';
import path from 'path';

const app = express();
app.use(express.static(path.join(process.cwd(), 'dist')));
app.listen(3001, () => {
  console.log('Test server running on port 3001');
});
