# API для бронирования мест на мероприятиях (Тестовое задание).

## Поднятие через Docker Compose

Самый простой способ развернуть приложение:

```bash
docker-compose up -d
```

Остановка:
```bash
docker-compose down
```

Остановка с удалением данных:
```bash
docker-compose down -v
```

## Локальная разработка

### Установка

`npm install`

### Настройка базы данных

Создайте файл `.env` в корне проекта:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=nest_tech
NODE_ENV=development

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Запуск

`npm run start:dev`


## API Endpoints

### POST /api/bookings/reserve

Бронирование места на мероприятие.

**Тело запроса:**
```json
{
  "event_id": 1,
  "user_id": "user123"
}
```

**Тело ответа:**
```json
{
  "id": 1,
  "eventId": 1,
  "userId": "user123",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**Ошибки:**
- `400 Bad Request` - Событие не найдено или нет свободных мест
- `409 Conflict` - Пользователь уже забронировал место на это событие или запрос уже обрабатывается



