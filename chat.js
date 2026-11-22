export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается." });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "Владелец сайта ещё не добавил API-ключ в настройки хостинга." });
  try {
    const { messages = [], type = "story", length = "medium", context = {} } = req.body || {};
    if (!Array.isArray(messages) || messages.length > 80) return res.status(400).json({ error: "Слишком длинная переписка. Создай новую историю." });
    const sizes = { short: "примерно 150–300 слов", medium: "примерно 300–600 слов", long: "примерно 600–900 слов" };
    const modes = {
      story: "Пиши как соавтор фанфика: создавай живые сцены, естественные диалоги, действия и атмосферу.",
      au: "Помогай создавать альтернативную вселенную: продумывай её правила, отношения персонажей, детали мира и сюжет.",
      rp: "Веди текстовую ролевую сцену: описывай окружение, события и NPC, внимательно следи за ходом сцены и не повторяйся.",
      ideas: "Предлагай конкретные, разнообразные идеи, сюжетные повороты и сцены, избегая очевидных клише.",
      character: "Помогай создавать многогранных персонажей: характер, привычки, мотивацию, противоречия, прошлое и манеру речи."
    };
    const contextText = [
      context.fandom && `Фандом/вселенная: ${context.fandom}`,
      context.characters && `Персонажи: ${context.characters}`,
      context.notes && `Дополнительные детали: ${context.notes}`
    ].filter(Boolean).join("\n");
    const system = `Ты — внимательный творческий соавтор для фанфиков, АУ и текстовых ролевых сцен. ${modes[type] || modes.story}
Пиши естественно и выразительно, без шаблонных фраз, искусственной драматичности и повторов. Учитывай весь контекст переписки и не меняй характеры персонажей без причины. Объём: ${sizes[length] || sizes.medium}.
${contextText ? `Контекст от пользователя:\n${contextText}` : "Если контекста недостаточно, не выдумывай заданные пользователем факты."}
${context.writeUser ? "Пользователь разрешил при необходимости писать действия и реплики его персонажа, но не навязывай ему решения, которые противоречат заданному характеру или указаниям." : "Не пиши реплики, действия, мысли или чувства персонажа пользователя; оставляй для него пространство ответа."}
Соблюдай возрастную безопасность: не создавай сексуально откровенный контент с несовершеннолетними и не смакуй насилие. Романтические темы допустимы без сексуализации несовершеннолетних.`;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ model: "gpt-6.2-sol", instructions: system, input: messages, max_output_tokens: 1800 })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Ошибка OpenAI API." });
    return res.status(200).json({ text: data.output_text || "ИИ не вернул текст." });
  } catch (error) {
    return res.status(500).json({ error: "Ошибка сервера. Попробуй ещё раз." });
  }
}
