// Gate warning (Rule 3): never blanket-reject 0x hex. Address-shaped strings are MATCHED against the stated registry.
const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const EVM = /^0x[0-9a-fA-F]{40}$/;

export const isSolanaShape = (s) => B58.test(s);
export const isEvmShape = (s) => EVM.test(s);

/** Registry of stated addresses: stated CA record + live board addresses. Absent/unconfirmed contribute nothing. */
export function statedAddresses(register, live = []) {
  const out = new Set(live);
  if (register.ca.state === 'stated' && register.ca.value) out.add(register.ca.value);
  return out;
}

/**
 * classify(input) -> { kind: 'text' | 'match' | 'unmatched', shape?: 'solana'|'evm', message? }
 * - plain text: never gated
 * - address-shaped + in stated registry: match
 * - address-shaped + not in registry: unmatched (warn, never reject, search simply yields no rows)
 */
export function classify(input, register, live = []) {
  const s = String(input || '').trim();
  const shape = isSolanaShape(s) ? 'solana' : isEvmShape(s) ? 'evm' : null;
  if (!shape) return { kind: 'text' };
  const reg = statedAddresses(register, live);
  if (reg.has(s) || [...reg].some((a) => a.toLowerCase() === s.toLowerCase() && shape === 'evm')) return { kind: 'match', shape };
  const caNote = register.ca.state === 'stated' ? 'Only the address printed on the top bar is ours.' : 'Our contract address has not been stated yet, so no address can be ours.';
  return {
    kind: 'unmatched', shape,
    message: (shape === 'evm' ? 'That looks like a 0x-style address, and this board only lists Solana coins. ' : 'That address is not on the board. ') + caNote,
  };
}

/** Page-wide scan: every address-shaped token in `text` must be in the registry. CA slot is exempt (pass exempt=true). */
export function scanText(text, register, live = [], exempt = false) {
  if (exempt) return [];
  const reg = statedAddresses(register, live);
  const found = String(text).match(/0x[0-9a-fA-F]{40}|[1-9A-HJ-NP-Za-km-z]{32,44}/g) || [];
  return found.filter((a) => !reg.has(a));
}
