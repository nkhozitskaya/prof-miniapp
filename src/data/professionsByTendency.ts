import type { TendencyId } from '../types'

export type ProfessionItem = {
  id: string
  title: string
  shortDesc: string
  tendency: TendencyId
}

/** Профессии для примерки по склонностям (6 типов). */
export const PROFESSIONS_BY_TENDENCY: Record<TendencyId, ProfessionItem[]> = {
  communication: [
    { id: 'teacher', title: 'Педагог', shortDesc: 'Обучение, консультирование', tendency: 'communication' },
    { id: 'psychologist', title: 'Психолог', shortDesc: 'Люди, коммуникация, помощь', tendency: 'communication' },
    { id: 'hr', title: 'HR-специалист', shortDesc: 'Подбор людей, команды', tendency: 'communication' },
    { id: 'journalist', title: 'Журналист', shortDesc: 'Интервью, тексты, медиа', tendency: 'communication' },
    { id: 'sales', title: 'Продажи и переговоры', shortDesc: 'Работа с клиентами', tendency: 'communication' },
  ],
  analysis: [
    { id: 'analyst', title: 'Аналитик данных', shortDesc: 'Исследования, отчёты', tendency: 'analysis' },
    { id: 'researcher', title: 'Исследователь', shortDesc: 'Наука, эксперименты', tendency: 'analysis' },
    { id: 'programmer', title: 'Программист', shortDesc: 'Логика, системы', tendency: 'analysis' },
    { id: 'economist', title: 'Экономист', shortDesc: 'Модели, прогнозы', tendency: 'analysis' },
    { id: 'auditor', title: 'Аудитор', shortDesc: 'Проверка, отчётность', tendency: 'analysis' },
  ],
  practical: [
    { id: 'engineer', title: 'Инженер', shortDesc: 'Конструкции, техника', tendency: 'practical' },
    { id: 'mechanic', title: 'Механик / техник', shortDesc: 'Ремонт, сборка', tendency: 'practical' },
    { id: 'builder', title: 'Строитель', shortDesc: 'Реальные объекты', tendency: 'practical' },
    { id: 'driver', title: 'Водитель / логист', shortDesc: 'Транспорт, доставка', tendency: 'practical' },
    { id: 'craftsman', title: 'Мастер (ручная работа)', shortDesc: 'Изделия своими руками', tendency: 'practical' },
  ],
  creation: [
    { id: 'designer', title: 'Дизайнер', shortDesc: 'Визуал, интерфейсы', tendency: 'creation' },
    { id: 'marketer', title: 'Маркетолог', shortDesc: 'Идеи, продвижение', tendency: 'creation' },
    { id: 'writer', title: 'Писатель / копирайтер', shortDesc: 'Тексты, сюжеты', tendency: 'creation' },
    { id: 'musician', title: 'Музыкант / звук', shortDesc: 'Творчество, креатив', tendency: 'creation' },
    { id: 'video', title: 'Видеограф / монтаж', shortDesc: 'Контент, визуал', tendency: 'creation' },
  ],
  resilience: [
    { id: 'sport', title: 'Спорт / тренер', shortDesc: 'Физнагрузки, команда', tendency: 'resilience' },
    { id: 'medic', title: 'Медик / медсестра', shortDesc: 'Здоровье, помощь', tendency: 'resilience' },
    { id: 'rescuer', title: 'Спасатель / МЧС', shortDesc: 'Стресс, ответственность', tendency: 'resilience' },
    { id: 'military', title: 'Военный / силовые', shortDesc: 'Дисциплина, выносливость', tendency: 'resilience' },
    { id: 'outdoor', title: 'Туризм / природа', shortDesc: 'Походы, активность', tendency: 'resilience' },
  ],
  organization: [
    { id: 'manager', title: 'Менеджер проекта', shortDesc: 'Планы, сроки, команда', tendency: 'organization' },
    { id: 'accountant', title: 'Бухгалтер / финансы', shortDesc: 'Учёт, цифры', tendency: 'organization' },
    { id: 'lawyer', title: 'Юрист', shortDesc: 'Документы, нормы', tendency: 'organization' },
    { id: 'admin', title: 'Офис-менеджер', shortDesc: 'Процессы, порядок', tendency: 'organization' },
    { id: 'logistics', title: 'Логист', shortDesc: 'Цепочки поставок', tendency: 'organization' },
  ],
}

export const TENDENCY_LABELS: Record<TendencyId, string> = {
  communication: 'Коммуникация',
  analysis: 'Анализ',
  practical: 'Практика',
  creation: 'Креативность',
  resilience: 'Устойчивость',
  organization: 'Организация',
}
