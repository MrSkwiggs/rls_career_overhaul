export const clamp = (val, min, max) => Math.min(Math.max(val, min), max)

export const round = (val, step = 1) => {
  if (typeof val === "undefined")
    throw new Error("The function at least needs a value")
  return Math.round(val / step + Number.EPSILON) * step
}

export const roundDec = (val, dec = 0) => {
  if (typeof val === "undefined")
    throw new Error("The function at least needs a value")
  if (dec > 15)
    throw new Error("Floating point won't be precise after 15th decimal")
  if (val === 0)
    return 0
  if (!Number.isInteger(dec))
    throw new Error("Decimal point must be an integer")
  const pow = Math.pow(10, dec)
  return Math.round(val * pow + Number.EPSILON) / pow
}

export const roundDecSample = (val, sample = 0) => {
  const dec = getDecimalPlaces(sample)
  if (dec === 0)
    return round(val)
  return roundDec(val, dec)
}

export const getDecimalPlaces = num => {
  if (Number.isInteger(num) || !Number.isFinite(num)) return 0
  let dec = 0
  while (!Number.isInteger(num) && Number.isFinite(num)) {
    num *= 10
    dec++
    if (dec > 15) break
  }
  return dec
}
