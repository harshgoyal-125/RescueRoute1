import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function DietaryBadge({ type = 'Vegetarian', style = {} }) {
  const { t } = useLanguage();
  const normalized = (type || 'Vegetarian').toLowerCase();

  let labelKey = 'vegetarian';
  let dotColor = '#16a34a'; // green
  let bg = '#ecfdf5';
  let border = '#a7f3d0';
  let textColor = '#065f46';
  let icon = '🌱';

  if (normalized.includes('non') || normalized === 'non-vegetarian') {
    labelKey = 'nonVegetarian';
    dotColor = '#dc2626'; // red
    bg = '#fef2f2';
    border = '#fecaca';
    textColor = '#991b1b';
    icon = '🍗';
  } else if (normalized.includes('egg') || normalized === 'eggetarian') {
    labelKey = 'eggetarian';
    dotColor = '#d97706'; // amber/yellow
    bg = '#fefce8';
    border = '#fef08a';
    textColor = '#854d0e';
    icon = '🥚';
  } else if (normalized.includes('vegan')) {
    labelKey = 'vegan';
    dotColor = '#059669'; // emerald
    bg = '#f0fdf4';
    border = '#bbf7d0';
    textColor = '#166534';
    icon = '🌿';
  }

  return (
    <span
      className="dietary-badge"
      data-testid="dietary-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.6rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.72rem',
        fontWeight: 700,
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color: textColor,
        whiteSpace: 'nowrap',
        ...style
      }}
      title={t(`${labelKey}Desc`)}
    >
      <span>{icon}</span>
      <span>{t(labelKey)}</span>
    </span>
  );
}
