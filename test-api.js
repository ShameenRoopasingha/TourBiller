async function test() {
  try {
    const res = await fetch('https://vigil-pos.vercel.app/api/driver/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'asanka@vigil.com',
        password: 'asanka123'
      })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
