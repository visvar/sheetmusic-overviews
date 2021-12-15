/**
 * Makes the first character in a string upper case
 * @param {string} string string
 * @returns {string} result
 */
export function firstLetterUpper(string) {
    return string.slice(0, 1).toUpperCase() + string.slice(1);
}

/**
 * Images are named by DOI (replacing / by _)
 * @param {string} doi DOI
 * @returns {string} path
 */
export function getImgSrc(doi) {
    return `./img/${doi.replace("/", "_")}.png`;
}
