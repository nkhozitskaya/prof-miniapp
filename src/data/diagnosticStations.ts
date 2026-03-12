/**
 * 11 станций диагностики.
 * Выбор 2 вариантов на станцию; каждый вариант даёт +1 (или −1) соответствующей подшкале.
 */

export type SubscaleId = string

export type StationOption = {
  id: string
  text: string
  /** подшкала -> вес (1 или -1) */
  subscales: Record<SubscaleId, number>
}

export type Station = {
  id: string
  title: string
  options: StationOption[]
}

export const DIAGNOSTIC_INSTRUCTION =
  'Выбери 2 варианта, которые больше всего похожи на тебя.'

export const STATIONS: Station[] = [
  {
    id: '1',
    title: 'Подготовка презентации',
    options: [
      { id: '1A', text: 'Сделать красивые и выразительные слайды', subscales: { aesthetic_sensitivity: 1 } },
      { id: '1B', text: 'Глубоко разобраться в теме', subscales: { research_depth: 1 } },
      { id: '1C', text: 'Выстроить понятную структуру выступления', subscales: { org_planning: 1 } },
      { id: '1D', text: 'Написать точные и выразительные формулировки', subscales: { creation_expression: 1 } },
      { id: '1E', text: 'Выступить перед аудиторией', subscales: { comm_breadth: 1 } },
    ],
  },
  {
    id: '2',
    title: 'Новый класс',
    options: [
      { id: '2A', text: 'Познакомлюсь со многими', subscales: { comm_breadth: 1 } },
      { id: '2B', text: 'Найду 1–2 человека для близкого общения', subscales: { comm_depth: 1 } },
      { id: '2C', text: 'Понаблюдаю, как всё устроено', subscales: { analysis_breadth: 1 } },
      { id: '2D', text: 'Разберусь в требованиях и предметах', subscales: { research_depth: 1 } },
      { id: '2E', text: 'Организую удобную систему расписания', subscales: { org_planning: 1 } },
    ],
  },
  {
    id: '3',
    title: 'Свободный день',
    options: [
      { id: '3A', text: 'Создать что-то (текст, видео, музыку)', subscales: { creation_expression: 1 } },
      { id: '3B', text: 'Заняться спортом', subscales: { resilience_physical: 1 } },
      { id: '3C', text: 'Изучить интересную тему', subscales: { research_depth: 1 } },
      { id: '3D', text: 'Пообщаться с друзьями', subscales: { comm_breadth: 1 } },
      { id: '3E', text: 'Сделать что-то руками', subscales: { practical_objects: 1 } },
      { id: '3F', text: 'Спланировать дела и время', subscales: { org_planning: 1 } },
      { id: '3G', text: 'Насладиться визуалом/музыкой', subscales: { aesthetic_sensitivity: 1 } },
    ],
  },
  {
    id: '4',
    title: 'Сломалась вещь',
    options: [
      { id: '4A', text: 'Починю сам(а)', subscales: { practical_objects: 1 } },
      { id: '4B', text: 'Найду инструкцию и разберусь', subscales: { practical_objects: 1, analysis_breadth: 1 } },
      { id: '4C', text: 'Попрошу помощи у знающего человека', subscales: { comm_depth: 1 } },
      { id: '4D', text: 'Найду сервис/мастера', subscales: { org_money_data: 1 } },
      { id: '4E', text: 'Спокойно временно обойдусь', subscales: { resilience_emotional: 1 } },
    ],
  },
  {
    id: '5',
    title: 'Групповой проект',
    options: [
      { id: '5A', text: 'Распределять задачи и сроки', subscales: { org_planning: 1 } },
      { id: '5B', text: 'Договариваться с участниками', subscales: { comm_breadth: 1, comm_depth: 1 } },
      { id: '5C', text: 'Собирать и изучать информацию', subscales: { research_depth: 1 } },
      { id: '5D', text: 'Придумать основную идею', subscales: { creation_expression: 1 } },
      { id: '5E', text: 'Сделать красивое оформление', subscales: { aesthetic_sensitivity: 1 } },
      { id: '5F', text: 'Настроить техническую часть', subscales: { practical_objects: 1 } },
    ],
  },
  {
    id: '6',
    title: 'Пропущенная тема',
    options: [
      { id: '6A', text: 'Сам(а) разберусь', subscales: { research_depth: 1 } },
      { id: '6B', text: 'Быстро пойму суть по конспектам', subscales: { analysis_breadth: 1 } },
      { id: '6C', text: 'Попрошу объяснить', subscales: { comm_depth: 1 } },
      { id: '6D', text: 'Составлю план догоняния', subscales: { org_planning: 1 } },
      { id: '6E', text: 'Постепенно спокойно разберусь', subscales: { resilience_emotional: 1 } },
      { id: '6F', text: 'Мне становится сложно и долго не могу догнать', subscales: { resilience_emotional: -1 } },
    ],
  },
  {
    id: '7',
    title: 'Неделя дедлайнов',
    options: [
      { id: '7A', text: 'Планирую и распределяю время', subscales: { org_planning: 1 } },
      { id: '7B', text: 'Сначала разбираюсь в сложных задачах', subscales: { research_depth: 1 } },
      { id: '7C', text: 'Договариваюсь о переносе сроков', subscales: { comm_breadth: 1 } },
      { id: '7D', text: 'Быстро адаптируюсь к ситуации', subscales: { resilience_emotional: 1 } },
      { id: '7E', text: 'Делаю то, что интереснее', subscales: { creation_expression: 1 } },
      { id: '7F', text: 'Работаю в быстром темпе', subscales: { resilience_physical: 1 } },
    ],
  },
  {
    id: '8',
    title: 'Новое место',
    options: [
      { id: '8A', text: 'Замечаю удобство пространства', subscales: { practical_space: 1 } },
      { id: '8B', text: 'Замечаю стиль и атмосферу', subscales: { aesthetic_sensitivity: 1 } },
      { id: '8C', text: 'Наблюдаю людей и их взаимодействие', subscales: { comm_depth: 1 } },
      { id: '8D', text: 'Замечаю правила и систему', subscales: { analysis_breadth: 1 } },
      { id: '8E', text: 'Чувствую эмоциональную атмосферу', subscales: { resilience_emotional: 1 } },
    ],
  },
  {
    id: '9',
    title: 'Конфликт',
    options: [
      { id: '9A', text: 'Понять позицию каждого', subscales: { comm_depth: 1 } },
      { id: '9B', text: 'Сохраняю спокойствие', subscales: { resilience_emotional: 1 } },
      { id: '9C', text: 'Ищу аргументы и факты', subscales: { research_depth: 1 } },
      { id: '9D', text: 'Ищу решение для всех', subscales: { org_planning: 1, comm_breadth: 1 } },
      { id: '9E', text: 'Сглаживаю напряжение', subscales: { comm_breadth: 1 } },
    ],
  },
  {
    id: '10',
    title: 'Улучшить пространство',
    options: [
      { id: '10A', text: 'Переставлю мебель', subscales: { practical_space: 1 } },
      { id: '10B', text: 'Добавлю стиль', subscales: { aesthetic_sensitivity: 1 } },
      { id: '10C', text: 'Придумаю новую концепцию', subscales: { creation_expression: 1 } },
      { id: '10D', text: 'Сделаю удобнее', subscales: { practical_space: 1 } },
      { id: '10E', text: 'Составлю список и бюджет', subscales: { org_money_data: 1 } },
    ],
  },
  {
    id: '11',
    title: 'Несколько свободных дней',
    options: [
      { id: '11A', text: 'Активный отдых', subscales: { resilience_physical: 1 } },
      { id: '11B', text: 'Походы/путешествия', subscales: { resilience_physical: 1, analysis_breadth: 1 } },
      { id: '11C', text: 'Спокойный отдых дома', subscales: { resilience_physical: -1 } },
      { id: '11D', text: 'Время с друзьями', subscales: { comm_breadth: 1 } },
      { id: '11E', text: 'Музеи/история/выставки', subscales: { aesthetic_sensitivity: 1, analysis_breadth: 1 } },
    ],
  },
]
