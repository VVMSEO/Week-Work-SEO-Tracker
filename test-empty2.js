import { distributeProjects } from './src/services/aiService.js';

async function run() {
  const res = await distributeProjects([]);
  console.log("Empty result:", res);
}

run().catch(console.error);
