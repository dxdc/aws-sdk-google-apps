function getElementsByTagName(element, tagName) {
  var data = [];
  var descendants = element.getDescendants();
  for (var i in descendants) {
    var el = descendants[i].asElement();
    if (el !== null && el.getName() == tagName) {
      data.push(el.getValue());
    }
  }

  return data;
}

function xmlElementToJson(element) {
  var result = null;
  element.getChildren().forEach((child) => {
    var key = child.getName();
    if (result === null) {
      result = key === 'item' || key === 'member' ? [] : {};
    }
    var value = xmlElementToJson(child);
    if (result instanceof Array) {
      result.push(value);
    } else if (result.hasOwnProperty(key)) {
      if (result[key] instanceof Array) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    } else {
      result[key] = value;
    }
  });
  var text = element.getText();
  if (text) {
    text = text.trim();
    if (text !== '') {
      result = text;
    }
  }
  return result;
}
