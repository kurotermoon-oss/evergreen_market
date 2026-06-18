# Evergreen Market — SEO Requirements

## General

Public pages should have clear route, title, meta description, and sitemap visibility when relevant.

Keep SEO text Ukrainian for customer-facing pages.

## “Як це працює?” page

Route:

```txt
/how-it-works
```

H1:

```txt
Як працює Evergreen Market?
```

Meta title:

```txt
Як працює Evergreen Market — замовлення товарів через кавʼярню
```

Meta description:

```txt
Пояснюємо, як Evergreen Market працює з постачальниками, чому товари можуть бути вигіднішими, як оформити замовлення та забрати його в кавʼярні.
```

## Files to check

When adding public routes, check:

- `src/utils/routes.js`
- `src/utils/pageMeta.js`
- `server/seoRoutes.cjs`
- navigation components
- footer components if present

## SPA routing

The site is a single-page app. Public pages should have internal links so search engines and users can discover them.

Important routes should not exist only as hidden view states.

## Sitemap

If static routes are manually listed in `server/seoRoutes.cjs`, add `/how-it-works` there.

## Internal links

Add link to “Як це працює?” from:

- main navigation if suitable;
- footer if footer exists;
- cart/minimum-order explanation if relevant;
- home page section if there is an explanatory block.
