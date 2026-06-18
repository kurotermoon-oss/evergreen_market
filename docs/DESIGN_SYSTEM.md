# Evergreen Market — Design System Notes

## Brand feeling

Evergreen should feel like a local neighborhood coffee shop and a useful nearby service.

The interface should feel:

- warm;
- calm;
- local;
- natural;
- honest;
- friendly;
- simple.

It should not feel like:

- a corporate supermarket;
- a cold B2B platform;
- a legal document;
- an overloaded marketplace.

## Visual direction

Use soft natural colors:

- muted green;
- beige;
- warm off-white;
- calm dark text;
- gentle accents.

Avoid:

- neon green;
- aggressive saturated colors;
- too many gradients;
- dark heavy corporate styling;
- visual clutter.

## Layout rules

- Mobile-first.
- Clear readable sections.
- Short text blocks.
- Cards for steps and explanations.
- Comfortable spacing.
- Rounded cards where consistent with existing UI.
- Avoid huge walls of text.

## Existing project conventions

- Use Tailwind utilities.
- Reuse existing `eg-*` helpers from `src/index.css` where relevant.
- Use `lucide-react` icons for new icon buttons/cards if icons fit the design.
- Avoid broad redesigns unless explicitly requested.
- Keep fixed bottom UI safe from overlap with cart, chat, product CTA and mobile nav layers.

## Character / helper concept

A small Evergreen helper character may be used on explanatory pages.

Possible forms:

- leaf;
- coffee bean;
- cup;
- small plant-like mascot.

The character should help explain difficult things through short speech bubbles.

It should not be overly childish.

## Speech bubbles

Use short useful phrases.

Examples:

```txt
Це простіше, ніж здається.
```

```txt
Ми беремо складну частину на себе.
```

```txt
Зайшли за кавою — і забрали замовлення.
```

## UI copy style

Prefer:

```txt
Як це працює?
```

Instead of:

```txt
Механізм роботи сервісу
```

Prefer:

```txt
Забрати в кавʼярні
```

Instead of:

```txt
Самовивіз із точки видачі
```
