export default function HeroSection({ onCatalogClick, onLocationClick }) {
  const scrollToBlock = (blockId) => {
    const block = document.getElementById(blockId);

    if (block) {
      block.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleCatalogClick = () => {
    if (onCatalogClick) {
      onCatalogClick();
      return;
    }

    scrollToBlock("catalog");
  };

  const handleLocationClick = () => {
    if (onLocationClick) {
      onLocationClick();
      return;
    }

    scrollToBlock("location");
  };

  return (
    <section className="hero-section">
      <div className="hero-content">
        <p className="hero-eyebrow">Кава та товари поруч з домом</p>

        <h1 className="hero-title">Evergreen coffee</h1>

        <p className="hero-subtitle">
          Кава, напої та смаколики у вашому ЖК
        </p>

        <div className="hero-points">
          <div className="hero-point">Самовивіз з кавʼярні</div>
          <div className="hero-point">Доставка по ЖК</div>
          <div className="hero-point">Оплата після підтвердження</div>
          <div className="hero-point">Без обовʼязкової реєстрації</div>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="hero-primary-btn"
            onClick={handleCatalogClick}
          >
            Перейти до каталогу
          </button>

          <button
            type="button"
            className="hero-secondary-btn"
            onClick={handleLocationClick}
          >
            Як нас знайти
          </button>
        </div>
      </div>
    </section>
  );
}