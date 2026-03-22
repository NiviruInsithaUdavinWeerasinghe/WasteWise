const fs = require('fs');

async function testUpload() {
  const formData = new FormData();
  
  // Create a dummy text file as a blob to upload
  const blob = new Blob(['hello world'], { type: 'text/plain' });
  formData.append('file', blob, 'test.txt');
  formData.append('upload_preset', 'wisewaste_preset');

  try {
    const response = await fetch('https://api.cloudinary.com/v1_1/delih4wkq/raw/upload', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    console.log("Cloudinary response:", result);
  } catch(e) {
    console.error("Fetch error:", e);
  }
}
testUpload();
