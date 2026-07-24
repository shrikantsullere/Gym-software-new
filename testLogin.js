import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'generaltrainer1@gym.com',
      password: '123'
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.log("Error:", err.response ? err.response.data : err.message);
  }
}

test();
