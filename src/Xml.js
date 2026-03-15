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
