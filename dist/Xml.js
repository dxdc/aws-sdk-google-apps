/**
 * Find all descendants of a Google Apps Script XML element matching a tag name.
 *
 * Used internally by the AWS SDK XML parser patch to extract values from
 * XML responses (e.g., EC2 DescribeInstances).
 *
 * @param {GoogleAppsScript.XML_Service.Element|GoogleAppsScript.XML_Service.Document} element - The root element or document to search.
 * @param {string} tagName - The XML tag name to search for.
 * @returns {string[]} Array of text values from matching elements.
 *
 * @example
 * const doc = XmlService.parse('<root><item>a</item><item>b</item></root>');
 * const items = getElementsByTagName(doc, 'item'); // ['a', 'b']
 */
function getElementsByTagName(element, tagName) {
  const data = [];
  const descendants = element.getDescendants();
  for (let i = 0; i < descendants.length; i++) {
    const el = descendants[i].asElement();
    if (el !== null && el.getName() === tagName) {
      data.push(el.getValue());
    }
  }

  return data;
}

/**
 * Recursively convert a Google Apps Script XML element to a JavaScript object.
 *
 * - Elements named 'item' or 'member' are collected into arrays.
 * - Duplicate sibling keys are automatically merged into arrays.
 * - Text-only elements return their trimmed string value.
 * - Empty elements return null.
 *
 * @param {GoogleAppsScript.XML_Service.Element} element - The XML element to convert.
 * @returns {Object|Array|string|null} The converted JavaScript representation.
 *
 * @example
 * const doc = XmlService.parse('<root><name>John</name><age>30</age></root>');
 * const json = xmlElementToJson(doc.getRootElement());
 * // { name: 'John', age: '30' }
 */
function xmlElementToJson(element) {
  let result = null;
  element.getChildren().forEach((child) => {
    const key = child.getName();
    if (result === null) {
      result = key === 'item' || key === 'member' ? [] : {};
    }
    const value = xmlElementToJson(child);
    if (result instanceof Array) {
      result.push(value);
    } else if (Object.prototype.hasOwnProperty.call(result, key)) {
      if (result[key] instanceof Array) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    } else {
      result[key] = value;
    }
  });
  const text = element.getText();
  if (text) {
    const trimmed = text.trim();
    if (trimmed !== '') {
      result = trimmed;
    }
  }
  return result;
}
