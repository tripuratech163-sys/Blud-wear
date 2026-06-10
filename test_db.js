const url = 'https://pkfdvlpegeasnvtqllkz.supabase.co/rest/v1/order_items?select=*';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZmR2bHBlZ2Vhc252dHFsbGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NjY3MDEsImV4cCI6MjA5NjI0MjcwMX0.FjFUFsszbosMF__OEdahchD6xXhyOGN6Gh8aIoeO4V0';

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
