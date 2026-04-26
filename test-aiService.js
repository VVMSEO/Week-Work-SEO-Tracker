import { distributeProjects, improveText } from './src/services/aiService.js';

async function run() {
  const payload = [
    { projectId: "123", minutes: 300 },
    { projectId: "456", minutes: 120 }
  ];
  console.log("Testing distributeProjects...");
  const res = await distributeProjects(payload);
  console.log("distributeProjects result:", res);
  
  console.log("Testing improveText...");
  const res2 = await improveText("настроил robots.txt");
  console.log("improveText result:", res2);
}

run().catch(console.error);
