import https from 'https';
https.get('https://www.youtube.com/playlist?list=UUBJycsmduvYELg8GaZ5XC2g', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const match = data.match(/<title>(.*?)<\/title>/);
    console.log(match ? match[1] : 'Not found');
  });
});
