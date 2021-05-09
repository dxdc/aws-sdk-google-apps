if (typeof XmlService !== 'undefined') {
  try {
    result = XmlService.parse(xml);

    var root = result.getRootElement();
    var data = xmlElementToJson(root);
    data.rawXml = XmlService.getRawFormat().format(result);

    // var metadata = getElementsByTagName(result, 'ResponseMetadata');
    // if (metadata) {
    //   data.ResponseMetadata = metadata;
    // }
    return data;
  } catch (err) {
    Logger.log(err);
    throw util.error(new Error('Parse error in document'), {
      code: 'XMLParserError',
      retryable: true,
    });
  }
}
