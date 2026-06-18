# HOW_IT_WORKS_REDESIGN_BRIEF.md

# Page: “Як це працює?”

## Current problem

The current `/how-it-works` page is visually heavier than it should be.

Problems visible in the current implementation:

* some text/sections visually overlap or are covered by the sticky header;
* the page feels like a generic SaaS/logistics landing page;
* there are too many heavy headings;
* the visual idea is weak;
* the page talks too much about suppliers and routes;
* the emotional value is not strong enough;
* the page feels difficult to read;
* the design has blocks, but not a clear story;
* the user does not immediately feel: “this is a useful local café service for me.”

The next iteration must not add more decorative complexity. It must simplify, sharpen and make the page more memorable.

## Main task

Improve only the `/how-it-works` page.

Do not redesign the whole website.
Do not change global colors.
Do not change Tailwind config.
Do not change navbar, footer, catalog, cart, product cards, admin, backend, checkout or business logic.

The goal is to make this one tab feel like a strong designed landing page inside the existing Evergreen identity.

## Core idea

The page must communicate:

“Evergreen вже закуповує частину товарів напряму для роботи кавʼярні. Тепер ви можете замовити частину цих товарів для дому й забрати їх у кавʼярні поруч.”

This is the heart of the page.

The page should not be centered on:

“Постачальник → мінімум → маршрут → логіка.”

It should be centered on:

“Кавʼярня поруч → корисні товари для дому → зрозумілі умови → забрали в Evergreen.”

## Desired user reaction

The user should think:

“А, зрозуміло. Це не якийсь склад і не мутний маркетплейс. Це моя кавʼярня поруч, через яку можна замовити частину товарів для дому.”

## UX priorities

The page must answer, in this order:

1. What is Evergreen Market?
2. Why is it useful for me?
3. What can I order?
4. What is the difference between in-stock and supplier-order products?
5. Why can there be a minimum order?
6. Where do I pick up the order?
7. Can I trust this?
8. What should I do next?

Do not explain minimum order before the user understands the value.

## Critical layout fixes

Before redesigning visuals, fix page quality:

* no overlapping text;
* no section hidden behind sticky header;
* no content covered by fixed chat/cart buttons;
* no huge headings that collide with other content;
* no clipped hero content;
* no horizontal overflow on desktop or mobile;
* no crowded cards with text pressed into borders.

For sticky header:

* add proper section top spacing;
* add `scroll-margin-top` for anchor targets;
* make sure content remains readable when the header is fixed.

## Tone

Public text must be Ukrainian.

Tone:

* simple;
* confident;
* local;
* warm;
* slightly sharper than before;
* not bureaucratic;
* not childish;
* not corporate.

Good phrases:

* “Не склад. Не супермаркет. Кавʼярня поруч.”
* “Товари, які кавʼярня вже закуповує для роботи, можуть стати корисними і вдома.”
* “Зайшли за кавою — забрали пакет із товарами.”
* “Без зайвого шуму: обрали, підтвердили, забрали.”
* “Наявні товари — без мінімуму. Товари під замовлення — за умовами конкретного постачальника.”

Avoid:

* “B2B”;
* “оптимізація”;
* “логістична модель”;
* “маршрут” as main message;
* too much “постачальник” everywhere;
* explaining the business model like documentation.

## Visual direction

Use existing Evergreen identity, but make the page more editorial and intentional.

Visual mood:

* local café;
* neighborhood;
* package pickup;
* coffee;
* useful goods for home;
* calm trust;
* simple handmade illustration.

Avoid:

* corporate SaaS;
* logistics dashboard;
* abstract route diagrams;
* many equal card grids;
* giant dark green rectangles;
* overdecorated SVGs;
* heavy black typography.

The page should be easier, lighter and more focused than the current version.

## Recommended final structure

### 1. Hero

Goal:

The hero must clearly explain the service and create interest.

Title:

“Як працює Evergreen Market?”

Main text:

“Evergreen вже закуповує частину товарів напряму для роботи кавʼярні. Тепер ці товари можна замовити для дому й забрати в Evergreen поруч із домом.”

Supporting text:

“Молоко, кава, чай, сиропи, напої та солодощі — без зайвого шуму: обрали, підтвердили, забрали.”

Chips:

* “наявні товари — без мінімуму”
* “під замовлення — за умовами постачальника”
* “самовивіз у Evergreen”

Hero visual:

The visual should show a warm café pickup story, not a cold logistics scheme.

Include:

* small Evergreen café;
* product bag;
* coffee cup;
* small home/neighborhood hint;
* supplier may appear in the background, but not as the main character.

Do not overload the hero with too many labels.

### 2. Concept block

This is the emotional center of the page.

Title:

“Не склад. Не супермаркет. Кавʼярня поруч.”

Text:

“Ми просто відкриваємо частину кавʼярних закупівель для сусідів: зрозумілі товари, чесні умови й самовивіз там, де ви й так берете каву.”

Design:

* wide editorial block;
* strong but not huge typography;
* lots of breathing room;
* one visual accent, not many decorations;
* should feel premium and memorable.

### 3. Product categories

Title:

“Що можна замовити?”

Text:

“Це реальні товари, з якими кавʼярня працює щодня.”

Categories:

* Молоко та вершки
* Рослинне молоко
* Кава
* Чай
* Сиропи та топінги
* Напої
* Солодощі та снеки

Design:

* compact category cards;
* not a long horizontal strip that becomes hard to scan;
* avoid overlap;
* readable on mobile;
* use icons only if they help.

### 4. Two product paths

This section is more important than abstract route diagrams.

Title:

“Два типи товарів — два різні шляхи”

Block 1:

“Є в наявності”
Text:
“Такі товари можна забрати швидше. Для них не потрібна мінімальна сума постачальника.”

Block 2:

“Під замовлення”
Text:
“Такі товари ми додаємо до закупівлі конкретного постачальника. Для них може діяти мінімальна сума саме цього постачальника.”

Design:

* two clear cards;
* show the difference instantly;
* this should be one of the clearest UX blocks on the page.

### 5. Minimum order

Title:

“Чому іноді є мінімальна сума?”

Text:

“Деякі постачальники не приймають зовсім маленькі окремі замовлення. Тому для товарів під замовлення може бути мінімальна сума. Вона стосується конкретного постачальника, а не всього сайту.”

Optional note:

“Наявні товари можна замовляти окремо — без такого мінімуму.”

Design:

* simple visual explanation;
* no complicated progress bars unless they are already part of real cart logic;
* no fake supplier progress if the data is not real;
* avoid misleading visuals.

### 6. Order process

Title:

“Від каталогу до пакета в кавʼярні”

Steps:

1. “Обираєте”
   “Додаєте до кошика потрібні товари.”

2. “Підтверджуємо”
   “Ми звʼязуємося з вами й уточнюємо деталі.”

3. “Готуємо”
   “Наявні товари відкладаємо, товари під замовлення додаємо до закупівлі.”

4. “Забираєте”
   “Зайшли за кавою — забрали пакет із товарами.”

Design:

* do not make the cards huge;
* use a clean route/timeline;
* no overlapping numbers/icons;
* mobile vertical layout.

### 7. Pickup section

Title:

“Забрати можна в Evergreen”

Text:

“Коли замовлення буде готове, ми повідомимо вас. Забрати його можна в кавʼярні — так само просто, як зайти за кавою.”

Highlight:

“Зайшли за кавою — забрали своє замовлення.”

Delivery note:

“Доставка поки не активна. Зараз головний формат — самовивіз у Evergreen.”

Design:

* warm and local;
* this block should feel human, not administrative.

### 8. Trust section

Title:

“Щоб усе було зрозуміло”

Use a compact checklist, not another heavy grid.

Items:

* “Пояснюємо умови до замовлення.”
* “Не змішуємо різних постачальників в один мінімум.”
* “Повідомляємо, коли замовлення можна забрати.”
* “Доставку не обіцяємо, поки вона не працює.”
* “Самовивіз — у знайомій кавʼярні Evergreen.”

### 9. FAQ

Keep FAQ short and practical.

Questions:

* “Чи можна замовити один товар?”
* “Чому є мінімальна сума?”
* “Чи можна змішувати товари різних постачальників?”
* “Коли я зможу забрати замовлення?”
* “Де забирати?”
* “Чи є доставка?”

### 10. Final CTA

Title:

“Спробуйте замовити товари поруч із домом”

Text:

“Почніть із простого: відкрийте каталог, оберіть потрібні товари, а ми підкажемо, як зручно забрати замовлення в Evergreen.”

Button:

“Перейти до товарів”

## Design quality checklist

Before finishing, check:

* Does the first screen explain the service in 5 seconds?
* Is there one strong idea, not many weak ones?
* Does the page feel like Evergreen café, not a SaaS/logistics page?
* Is the text readable without overlap?
* Is the sticky header not covering content?
* Are headings strong but not oppressive?
* Are product categories concrete and easy to scan?
* Is the difference between in-stock and supplier-order products clear?
* Is minimum order explained honestly?
* Is delivery clearly marked as not active?
* Is the final CTA visible and natural?
* Does mobile layout work without horizontal overflow?

## Verification

Before coding:

1. Inspect the current `/how-it-works` implementation.
2. Identify files used by the page.
3. State exactly which files will be changed.
4. Explain how the new version will fix the current problems.

After coding:

1. Run `npm run build`.
2. Summarize changed files.
3. Explain design decisions.
4. Mention anything that could not be completed.
