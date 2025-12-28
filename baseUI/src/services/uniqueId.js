// returns guaranteed unique ID until 100000
// after 100000 it will be virtually-unique

let counter = 0

/** @returns Unique float */
export const uniqueNum = () => (++counter % 1e5) + Math.random()

/** @prop {string} [name=""]       Optional string to prefix ID with. */
/** @prop {string} [separator="."] Optional separator. Do not use empty separator, as it may result in a non-unique ID. */
/** @returns Unique string */
export const uniqueId = (name = "", separator = ".") => {
  const str = `${name ? name + separator : ""}${uniqueNum().toString(16)}`
  return separator === "." ? str : str.replace(".", separator)
}

/** @returns Safe unique id, separated with underscore */
export const uniqueSafeId = () => uniqueId("", "_")
