const API_URL = "https://routerai.ru/api/v1/chat/completions";
const API_KEY = "sk-qbf6ACgy2tmghGMBdty2uA3lWSHY98w7";

export async function distributeProjects(projectsToPlan) {
  const systemPrompt = `Ты помощник SEO-специалиста. Твоя задача — распределить переданные проекты по 5 рабочим дням недели (от 1 до 5, где 1=Понедельник, 5=Пятница).

ГЛАВНЫЙ ПРИОРИТЕТ: Максимально равномерное распределение нагрузки. Суммарное запланированное время (minutes) на каждый из 5 дней должно быть примерно одинаковым.

ПРАВИЛА:
1. Ты строго ограничен переданным временем (minutes) в проектах. Не выдумывай новые проекты и не меняй общее время.
2. Если проект большой или нужно выровнять дни, ты МОЖЕШЬ и ДОЛЖЕН разбивать его на несколько дней (просто верни несколько объектов с этим projectId для разных дней). Программа сама разделит его время поровну между этими днями.
3. Чтобы достичь равномерности, мысленно сложи все минуты, раздели на 5 дней и постарайся скомпоновать проекты так, чтобы каждый день был максимально близок к этому среднему значению.

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
        model: "anthropic/claude-sonnet-4.6",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    let content = data.choices[0].message.content;
    
    try {
      // Очищаем ответ от возможных текстов до или после JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }
      return JSON.parse(content);
    } catch (parseError) {
      console.error("AI Planning Parse Error:", parseError, "Raw response:", data.choices[0].message.content);
      return null;
    }
  } catch (error) {
    console.error("AI Planning Global Error:", error);
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
        model: "anthropic/claude-sonnet-4.6",
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
