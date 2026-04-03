const url = 'https://corsproxy.io/?' + encodeURIComponent('https://www.reddit.com/search.json?q=test');
fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
  }
}).then(async res => {
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text.substring(0, 200));
}).catch(console.error);
