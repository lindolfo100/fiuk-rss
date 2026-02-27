import https from 'https';
https.get('https://www.youtube.com/channel/UCG7J20LhUeLl6y_Emi7OJrA', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const match = data.match(/<title>(.*?)<\/title>/);
    console.log(match ? match[1] : 'Not found');
  });
});
