# Binance Trailing Stop Bot

![Example in action](https://ti-robots.ru/stoploss.gif)

## Description

**Ti TSL Bot** is an automated system that provides Trailing Stop Loss functionality. It supports simultaneous trading across multiple instruments. The system uses an asynchronous, event-driven architecture with a "Broker-Worker" pattern, allowing for horizontal scalability. Redis is used as the database for managing tasks, states, and locks.

## Key Features

- Minimalist interface: ease of use and simplicity of deployment
- Horizontal scalability: adding workers to increase performance
- Real-time: instant response to market changes
- Flexibility: adaptation to various trading strategies

## Architecture

### System Components

All services are launched via Docker Compose:

- **Node-RED Core**: Manages logic, distributes tasks, controls locks
- **Microservices**:
  - Order Service - monitoring and recording orders
  - Balance Service - tracking balances
  - Price Service - updating market prices
  - Telegram Bot Service - management via Telegram
- **Workers**: Execute trading tasks, easily scalable
- **Frontend (Vue.js)**: Web interface for management with data updates every 2 seconds

## Trading Strategy

The system tracks purchases and automatically places stop-loss orders, moving them along with the price. Upon completion of a trade, it sends a report to Telegram and enters standby mode.

### Strategy Adaptation

- Ability to increase position in real-time
- Change settings without stopping operations
- Automatic recalculation of orders when parameters change

## Technologies

- JavaScript (Node.js)
- Vue.js
- Docker
- Redis
- Node-RED
- Binance API

## Installation and Launch

### Requirements

- Server (2 cores, 4GB RAM), Node 22, Docker
- API keys from the exchange
- BOT TOKEN and CHAT ID for Telegram (optional)

### Installation Instructions:
```bash
git clone [repository]
cd front/ && npm i
cd ../node-red/ && npm i
cd .. && docker-compose up -d
```

### Configuration:
After installation, you need to enter the keys in the settings. Access to the settings interface is available at http://<server IP>:1880/dashboard/settings. Telegram bot settings are also configured on this page.

## Frontend
Access to the frontend interface is available at http://<server IP>:3000

Our interface functionality allows:
- Creating and deleting bots.
- Viewing financial results both in total and for each instrument separately.
- Stopping and starting bots, as well as changing their settings.

### Features:
- Minimalist design focused on user convenience.
- Data is updated in real-time, ensuring information relevance.

## Reliability
The system has high reliability due to the following aspects:
- **Snapshots**: Automatic backup of Redis state every second.
- **Recovery after restart**: Quick recovery via `docker-compose restart`.
- **Locks**: Data locks prevent conflicts between workers, ensuring integrity.

## Differences from Analogues
Our bot stands out for its simplicity: only one command is required for deployment, and the interface is user-friendly. Flexibility and scalability are also key advantages: you can customize it for various strategies, such as scalping and swing trading. An unlimited number of workers and trading pairs allow for flexible adaptation to changing market conditions.

## License
The source code is available for free use under the MIT license.

## Developer Information
We invite collaboration! If you want to improve our system or add new features, please feel free to create a pull request.

## Contacts
We invite you to join the Telegram group where we share news and updates: [Ti ROBOTS LAB](https://t.me/ti_robots_lab)

# Binance Trailing Stop Bot

![Пример работы](https://ti-robots.ru/stoploss.gif)

## Описание

**Ti TSL Bot** — это автоматизированная система, обеспечивающая Trailing Stop Loss. Поддерживает одновременную торговлю по нескольким инструментам. Система использует асинхронную, событийно-ориентированную архитектуру с паттерном "Брокер-Воркер", что позволяет горизонтально масштабироваться. В качестве БД используется Redis для управления задачами, состоянием и блокировками.

## Ключевые особенности

- Минималистичный интерфейс: простота использования и легкость развертывания
- Горизонтальная масштабируемость: добавление воркеров для увеличения производительности
- Реальное время: мгновенная реакция на рыночные изменения
- Гибкость: адаптация под различные торговые стратегии

## Архитектура

### Компоненты системы

Все сервисы запускаются через Docker Compose:

- **Node-RED Core**: Управляет логикой, распределяет задачи, контролирует блокировки
- **Микросервисы**:
  - Order Service - мониторинг и запись ордеров
  - Balance Service - отслеживание балансов
  - Price Service - обновление рыночных цен
  - Telegram Bot Service - управление через Telegram
- **Воркеры**: Выполняют торговые задачи, легко масштабируются
- **Фронтенд (Vue.js)**: Веб-интерфейс управления с обновлением данных каждые 2 секунды

## Торговая стратегия

Система отслеживает покупку и автоматически выставляет стоп-лосс ордер, двигая его вслед за ценой. По завершении сделки отправляет отчет в Telegram и переходит в режим ожидания.

### Адаптация стратегии

- Возможность увеличения позиции в реальном времени
- Изменение настроек без остановки работы
- Автоматический пересчет ордеров при изменении параметров

## Технологии

- JavaScript (Node.js)
- Vue.js
- Docker
- Redis
- Node-RED
- Binance API

## Установка и запуск

### Требования

- Сервер (2 ядра, 4Gb памяти), Node 22, Docker
- API-ключи от биржи
- BOT TOKEN и CHAT ID для Telegram (опционально)

### Инструкция по установке:
```bash
git clone [репозиторий]
cd front/ && npm i
cd ../node-red/ && npm i
cd .. && docker-compose up -d
```

### Настройка:
После установки необходимо ввести ключи в настройках. Доступ к интерфейсу настроек осуществляется по адресу http://<IP сервера>:1880/dashboard/settings. Настройки Telegram бота также осуществляются на этой странице.

## Фронтенд
Доступ к интерфейсу фронтенд осуществляется по адресу http://<IP сервера>:3000

Функционал нашего интерфейса позволяет:
- Создавать и удалять роботов.
- Просматривать финансовые результаты как суммарно, так и по каждому инструменту в отдельности.
- Останавливать и запускать роботов, а также изменять их настройки.


### Особенности:
- Минималистичный дизайн, ориентированный на удобство использования.
- Данные обновляются в реальном времени, что обеспечивает актуальность информации.

## Надежность
Система обладает высокой надежностью благодаря следующим аспектам:
- **Снапшоты**: Автоматическое резервное копирование состояния Redis каждую секунду.
- **Восстановление после перезапуска**: Возможность быстрого восстановления через `docker-compose restart`.
- **Блокировки**: Блокировки данных предотвращают конфликты между воркерами, обеспечивая целостность.

## Отличия от аналогов
Наш робот выделяется своей простотой: для развертывания требуется всего одна команда, а интерфейс ориентирован на новичков. Гибкость и масштабируемость также являются ключевыми преимуществами: вы можете настроить его под различные стратегии, такие как скальпинг и свинг-трейдинг. Неограниченное количество воркеров и торговых пар позволяют гибко адаптироваться к меняющимся условиям рынка.

## Лицензия
Исходный код доступен для свободного использования под лицензией MIT. 

## Информация для разработчиков
Приглашаем к сотрудничеству! Если вы хотите улучшить нашу систему или добавить новые функции, 
пожалуйста, не стесняйтесь создавать пулл-реквест. 

## Контакты
Приглашаем вступить в группу телеграм, где мы делимся новостями и обновлениями: [Ti ROBOTS LAB](https://t.me/ti_robots_lab)
