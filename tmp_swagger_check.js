const app = require('./server');
const http = require('http');

const s = app.listen(0, () => {
  const port = s.address().port;
  http.get(`http://localhost:${port}/api-docs/`, (r) => {
    let d = '';
    r.on('data', (c) => (d += c));
    r.on('end', () => {
      console.log('status', r.statusCode, r.headers['content-type']);
      console.log(d.slice(0, 200));
      s.close();
      process.exit(0);
    });
  }).on('error', (e) => {
    console.log('error', e.message);
    process.exit(1);
  });
});
