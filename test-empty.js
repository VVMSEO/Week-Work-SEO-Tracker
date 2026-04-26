import { distributeProjects } from './src/services/aiService.js';

async function run() {
  const payload = [
    { id: "123", name: "Test Project", minutes: 300 }
  ];
  console.log("Testing distributeProjects with normal payload...");
  try {
    const res = await distributeProjects(payload);
    console.log("distributeProjects result:", res);
  } catch (err) {
    console.error("Caught error:", err);
  }
}

run().catch(console.error);
