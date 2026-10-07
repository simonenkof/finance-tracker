# Finance tracker

Локальное Next.js-приложение для учёта финансов. Данные хранятся как JSON в приватном GitHub-репозитории [`simonenkof/finance-tracker-data`](https://github.com/simonenkof/finance-tracker-data) (`data/live.json`, бэкапы в `backups/`).

Без авторизации пользователей и без деплоя — только `npm run dev` на вашей машине.

## Стек

Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Recharts

## Настройка

1. Скопируйте пример env и заполните токен:

```bash
cp .env.example .env.local
```

В `.env.local`:

```
GITHUB_TOKEN=<personal_access_token>
GITHUB_DATA_REPO=simonenkof/finance-tracker-data
```

Токену нужны права на Contents API к репозиторию данных. **Не коммитьте** `.env.local`.

2. Установите зависимости и запустите:

```bash
npm install
npm run dev
```

Приложение слушает порт **43127**: [http://127.0.0.1:43127](http://127.0.0.1:43127).

## Возможности

- Категории, доходы/расходы, повторяющиеся платежи (day/week/month) с автосозданием расходов
- Бюджеты с прогресс-барами
- Счета и net worth (активы/пассивы) со снимками и линейными графиками
- Аналитика расходов (bar chart) с фильтрами неделя / месяц / диапазон дат
- Сохранение в GitHub, бэкап и восстановление

## Документация

- [Бизнес-требования](./docs/business-requirements.md)
- [План разработки](./docs/development-plan.md)
