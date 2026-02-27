import https from 'https';
https.get('https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYELg8GaZ5XC2g', (res) => {
  console.log(res.statusCode);
});
