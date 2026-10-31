export function formatINR(amount, decimals = 2) {
  const val = Number(amount) || 0;
  return `₹${val.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
}

export function formatINRCompact(amount) {
  const val = Number(amount) || 0;
  return `₹${val.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

