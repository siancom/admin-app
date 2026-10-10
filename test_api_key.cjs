const https = require('https');

const apiKey = "AIzaSyBS3zKEA6zosmy8tLRTyJ38BPLlUQS30gU";
const projectId = "iris-clinic-app";
const database = "iris-care";

const options = {
  hostname: 'firestore.googleapis.com',
  port: 443,
  path: `/v1/projects/${projectId}/databases/${database}/documents/products?key=${apiKey}`,
  method: 'GET',
  headers: {
    'Referer': 'https://iris-clinic-admin.web.app/'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    console.log("Body:", data.substring(0, 200));
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();
