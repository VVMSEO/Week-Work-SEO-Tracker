const API_URL = "https://routerai.ru/api/v1/chat/completions";
const API_KEY = "sk-YZjmB_SuF7khId64RojYIaiZ6QxLdTmF";

export async function distributeProjects(projectsToPlan) {
  const systemPrompt = `Ты помощник SEO-специалиста. Твоя задача — распределить переданные проекты по рабочим дням недели (от 1 до 5, где 1=Понедельник, 5=Пятница).
Учти пожелание: в идеале нагрузка в день должна быть около 5-6 часов (300-360 минут). 
ОДНАКО, ты ограничен только тем временем (minutes), которое передано в проектах. Не выдумывай новые проекты и не пытайся искусственно добить время до 30 часов, если переданных минут меньше.
Если суммарное время всех проектов меньше идеального, просто распредели то, что есть, максимально равномерно по дням.
Если какой-то проект занимает много времени, ты МОЖЕШЬ разбить его на несколько дней (просто верни несколько объектов с этим projectId для разных дней). Программа сама разделит его время поровну между этими днями.
Верни ТОЛЬКО валидный JSON в формате:
{
  "schedule": [
    { "projectId": "строка", "day": число }
  ]
}
Никакого текста до или после JSON.`;

  const userPrompt = JSON.stringify(projectsToPlan);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Очищаем ответ от маркдауна, если ИИ его добавил
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(content);
  } catch (error) {
    console.error("AI Planning Error:", error);
    return null;
  }
}

export async function improveText(text) {
  if (!text.trim()) return text;
  
  const systemPrompt = `Ты профессиональный аккаунт-менеджер в SEO. Перепиши черновые заметки специалиста в вежливый, понятный и грамотный деловой текст для клиента. Сохрани всю суть, но сделай текст презентабельным. Пиши на русском языке. Верни только готовый текст без вводных слов.`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ]
      })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("AI Text Improvement Error:", error);
    return text;
  }
}
