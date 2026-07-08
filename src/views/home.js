/** Home view: searchable, filterable gallery of beans. */

import { el, clear } from '../components.js';
import { starBar, formatRating } from '../format.js';
import { roasters } from '../data.js';

function beanCard(bean) {
  const facts = bean.facts ?? {};
  const badges = [
    facts.roastType && facts.roastType !== 'Unknown' ? facts.roastType : null,
    facts.roastLevel && facts.roastLevel !== 'Unknown' ? facts.roastLevel : null,
    facts.blend && facts.blend !== 'Unknown' ? facts.blend : null,
    facts.decaf ? 'Decaf' : null,
    facts.organic ? 'Organic' : null,
  ].filter(Boolean);

  return el('a', { class: 'card', href: `#/bean/${encodeURIComponent(bean.slug)}` },
    el('div', { class: 'card-top' },
      el('span', { class: 'rating-badge', text: formatRating(bean.averageRating) }),
      starBar(bean.averageRating, bean.reviewCount),
    ),
    el('h2', { class: 'card-title', text: bean.name }),
    el('p', { class: 'card-roaster', text: bean.roaster }),
    facts.origins && facts.origins.length
      ? el('p', { class: 'card-origin', text: facts.origins.join(', ') })
      : null,
    badges.length
      ? el('div', { class: 'badges' }, badges.map((b) => el('span', { class: 'badge', text: b })))
      : null,
    el('div', { class: 'card-foot' },
      el('span', { class: 'muted', text: `${bean.reviewCount} review${bean.reviewCount === 1 ? '' : 's'}` }),
    ),
  );
}

function matches(bean, f) {
  if (f.q) {
    const hay = [
      bean.name, bean.roaster,
      ...(bean.facts?.origins ?? []),
      ...(bean.flavours ?? []),
    ].join(' ').toLowerCase();
    if (!hay.includes(f.q)) return false;
  }
  if (f.roaster && bean.roaster !== f.roaster) return false;
  if (f.roastType && bean.facts?.roastType !== f.roastType) return false;
  if (f.blend && bean.facts?.blend !== f.blend) return false;
  if (f.decaf && !bean.facts?.decaf) return false;
  if (f.organic && !bean.facts?.organic) return false;
  if (f.minRating && bean.averageRating < f.minRating) return false;
  return true;
}

export function renderHome(root, data) {
  clear(root);

  const filters = { q: '', roaster: '', roastType: '', blend: '', decaf: false, organic: false, minRating: 0 };

  const grid = el('div', { class: 'grid', id: 'bean-grid' });
  const count = el('p', { class: 'result-count muted', 'aria-live': 'polite' });

  const draw = () => {
    const visible = data.beans.filter((b) => matches(b, filters));
    clear(grid);
    if (visible.length === 0) {
      grid.append(el('div', { class: 'empty' },
        el('p', { text: 'No beans match your filters yet.' }),
      ));
    } else {
      grid.append(...visible.map(beanCard));
    }
    count.textContent = `${visible.length} of ${data.beans.length} bean${data.beans.length === 1 ? '' : 's'}`;
  };

  const search = el('input', {
    type: 'search', id: 'search', class: 'search', placeholder: 'Search beans, roasters, origins, flavours…',
    'aria-label': 'Search beans',
    onInput: (e) => { filters.q = e.target.value.trim().toLowerCase(); draw(); },
  });

  const select = (label, id, options, onChange) => el('label', { class: 'field' },
    el('span', { class: 'field-label', text: label }),
    el('select', { id, onChange: (e) => { onChange(e.target.value); draw(); } },
      el('option', { value: '', text: `All` }),
      options.map((o) => el('option', { value: o, text: o })),
    ),
  );

  const checkbox = (label, onChange) => el('label', { class: 'check' },
    el('input', { type: 'checkbox', onChange: (e) => { onChange(e.target.checked); draw(); } }),
    el('span', { text: label }),
  );

  const controls = el('div', { class: 'controls' },
    select('Roaster', 'f-roaster', roasters(data), (v) => { filters.roaster = v; }),
    select('Roast type', 'f-roast', ['Filter', 'Espresso', 'Omni (Filter & Espresso)'], (v) => { filters.roastType = v; }),
    select('Origin type', 'f-blend', ['Single Origin', 'Blend'], (v) => { filters.blend = v; }),
    el('label', { class: 'field' },
      el('span', { class: 'field-label', text: 'Min rating' }),
      el('select', { id: 'f-rating', onChange: (e) => { filters.minRating = Number(e.target.value); draw(); } },
        el('option', { value: '0', text: 'Any' }),
        [4, 3, 2].map((r) => el('option', { value: String(r), text: `${r}+ ★` })),
      ),
    ),
    el('div', { class: 'checks' },
      checkbox('Decaf', (v) => { filters.decaf = v; }),
      checkbox('Organic', (v) => { filters.organic = v; }),
    ),
  );

  const hero = el('section', { class: 'hero' },
    el('h1', { text: 'Bean Book' }),
    el('p', { class: 'tagline', text: 'A hand-kept log of coffee beans worth remembering — ratings, roasters and tasting notes.' }),
  );

  root.append(
    hero,
    el('div', { class: 'toolbar' }, search, controls),
    count,
    grid,
  );

  draw();
}
