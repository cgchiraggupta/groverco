const normalize = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const parts = value => normalize(value).split(/[,;/]/).map(x => x.trim()).filter(Boolean);
export function matchCreators(business, creators) {
  const fields = [['Platform', 'Platform'], ['Category / niche', 'Niche'], ['Location', 'Location'], ['Content format', 'Content format']];
  return creators.map(creator => {
    const reasons = fields.flatMap(([key, label]) => {
      const wanted = parts(business.details?.[key]), offered = parts(creator.details?.[key]);
      return wanted.some(value => offered.includes(value)) ? [label] : [];
    });
    return { creator, reasons };
  }).sort((a, b) => b.reasons.length - a.reasons.length);
}
