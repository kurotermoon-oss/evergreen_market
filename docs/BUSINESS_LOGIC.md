# Evergreen Market — Business Logic

## Core model

Evergreen coffee shop already buys products directly from suppliers.

Evergreen Market allows customers to order selected supplier products for personal/home use through the website.

Simple model:

```txt
Supplier → Evergreen → Customer pickup
```

## Product availability types

Products can behave differently depending on availability.

### In-stock products

These are products already available at Evergreen.

Rules:

- They should be easy to order.
- They should not create unnecessary minimum-order friction.
- They can be grouped as the `in_stock` segment in checkout.

Customer-facing wording:

```txt
Цей товар є в наявності. Його можна буде забрати швидше.
```

### Supplier-order products

These products are added to a supplier purchase.

Rules:

- Each supplier can have its own minimum order amount.
- The UI may keep mixed products in the cart.
- Order submission must send only one orderable segment.
- Each `supplier_order` supplier segment must meet that supplier's `minOrderAmount`.

Customer-facing wording:

```txt
Цей товар ми додаємо до закупівлі у постачальника.
```

## Supplier minimum orders

Some suppliers do not process small individual purchases. They work with minimum order amounts.

Public explanation should be simple and transparent.

Good wording:

```txt
Постачальники зазвичай працюють із мінімальними сумами замовлення. Ми показуємо ці умови одразу, щоб ви розуміли, як працює замовлення.
```

Avoid:

```txt
B2B-постачальники мають комерційні мінімальні пороги для оптимізації логістики.
```

## Cart and checkout segmentation

Existing rule from AGENTS.md:

- all `in_stock` items form one orderable group with no supplier minimum;
- each `supplier_order` supplier forms its own orderable group;
- each supplier group must meet that supplier's `minOrderAmount`;
- mixed groups may exist in one cart UI;
- final order submission must send only one segment.

When changing checkout, preserve this logic unless the task explicitly changes it.

## Pickup

Current main fulfillment method:

```txt
Pickup at Evergreen coffee shop.
```

Public wording:

```txt
Коли замовлення буде готове, ви зможете забрати його в кавʼярні Evergreen.
```

Short phrase:

```txt
Зайшли за кавою — і забрали своє замовлення.
```

## Delivery

Delivery is a future idea.

Do not present delivery as active unless the business has explicitly enabled it.

Allowed wording:

```txt
У майбутньому ми хочемо додати безкоштовну доставку поруч із кавʼярнею.
```

Avoid:

```txt
Ми доставимо ваше замовлення додому.
```

## Trust and transparency

Customers should understand:

- where products come from;
- why minimum order exists;
- how pickup works;
- what happens after order placement;
- whether delivery is already available or planned for later.

If a UX element can reduce confusion, prefer explaining it rather than hiding it.
