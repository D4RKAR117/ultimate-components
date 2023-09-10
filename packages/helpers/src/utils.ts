/**
 *  Converts a string to pascal case
 *
 * @param str string to convert to pascal case
 * @returns  the string in pascal case
 */
export const toPascalCase = (str: string) => {
	const words = str.split(/[\s_-]+/);
	const pascalCaseWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
	const pascalCaseStr = pascalCaseWords.join('');
	return pascalCaseStr;
};
