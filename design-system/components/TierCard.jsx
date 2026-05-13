// TierCard — pricing tier card used on /pricing.
// Source: src/routes/pricing.tsx
function TierCard({ tier, current }) {
  const isPaid = tier.annual !== null;
  return (
    <div className={`cb-tier-card ${current ? "cb-tier-card--current" : ""}`}>
      {current && <span className="cb-tier-current-pill">Current plan</span>}
      <h2 className="cb-tier-name">{tier.displayName}</h2>
      <p className="cb-tier-desc">{tier.description}</p>
      <div className="cb-tier-price">
        {isPaid ? (
          <>
            <p className="cb-tier-price-main">${tier.annual}/year</p>
            <p><span className="cb-tier-deal">Get 2 months free with annual billing</span></p>
            <p className="cb-tier-price-month">${tier.monthly}/month</p>
          </>
        ) : (
          <p className="cb-tier-price-main">FREE</p>
        )}
      </div>
      <div className="cb-tier-stats">
        <p><b>{tier.recipes}</b> recipes</p>
        <p><b>{tier.cookbooks}</b> cookbooks</p>
        <p>{tier.canPrivate ? "Private recipes ✓" : "Public only"}</p>
        <p>{tier.canImport ? "Import ✓" : "No import"}</p>
        <p>{tier.showsAds ? "Ad Supported" : "No Ads"}</p>
      </div>
    </div>
  );
}

window.TierCard = TierCard;
