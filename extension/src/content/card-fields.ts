const CARD_HINT =
  /(card.?num|cardnumber|cc-?num|ccnum|credit.?card|debit.?card|\bcvv\b|\bcvc\b|\bcsc\b|security.?code|card.?code|expir|exp.?date|\bpan\b)/i;

/** Does this element look like part of a credit/debit card form? */
export function isCardField(el: EventTarget | null): el is HTMLInputElement {
  if (!(el instanceof HTMLInputElement)) return false;
  if (['hidden', 'checkbox', 'radio', 'submit', 'button'].includes(el.type)) return false;
  const ac = (el.getAttribute('autocomplete') ?? '').toLowerCase();
  if (ac.startsWith('cc-') && ac !== 'cc-name') return true;
  const label = el.id ? el.ownerDocument.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent ?? '' : '';
  const hay = [el.name, el.id, el.placeholder, el.getAttribute('aria-label'), el.getAttribute('data-elements-stable-field-name'), label].join(' ');
  return CARD_HINT.test(hay);
}
