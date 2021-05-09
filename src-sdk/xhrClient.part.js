AWS.XHRGoogleClient = AWS.util.inherit({
  handleRequest: function handleRequest(httpRequest, httpOptions, callback, errCallback) {
    var self = this;
    var endpoint = httpRequest.endpoint;
    var emitter = new EventEmitter();
    var href = endpoint.protocol + '//' + endpoint.hostname;
    if (endpoint.port !== 80 && endpoint.port !== 443) {
      href += ':' + endpoint.port;
    }
    href += httpRequest.path;

    callback(emitter);

    var headers = {};
    AWS.util.each(httpRequest.headers, function (key, value) {
      if (key !== 'Content-Length' && key !== 'User-Agent' && key !== 'Host') {
        headers[key] = value;
      }
    });

    // not implemented
    var credentials = httpOptions.xhrWithCredentials ? 'include' : 'omit';

    try {
      var options = {
        method: httpRequest.method,
        contentType: httpRequest.headers['Content-Type'],
        headers: headers,
        muteHttpExceptions: true,
        payload: httpRequest.body,
      };

      var response = UrlFetchApp.fetch(href, options);
      var responseCode = response.getResponseCode();
      var responseText = response.getContentText();

      if (responseCode / 100 !== 2) {
        throw Error(responseText);
      }

      emitter.statusCode = responseCode;
      emitter.headers = self.parseHeaders(response.getHeaders());
      emitter.emit('headers', emitter.statusCode, emitter.headers);
      self.finishRequest(response.getBlob(), emitter);
    } catch (err) {
      Logger.log(err);
      errCallback(
        AWS.util.error(new Error('Network Failure'), {
          code: 'NetworkingError',
        }),
      );
    }

    return emitter;
  },
  parseHeaders: function parseHeaders(rawHeaders) {
    return Object.fromEntries(Object.entries(rawHeaders).map(([k, v]) => [k.toLowerCase(), v]));
  },
  finishRequest: function finishRequest(blob, emitter) {
    var buffer;
    var contentType = blob.getContentType();

    if (contentType !== 'text/plain') {
      var ab = blob.getBytes();
      buffer = new AWS.util.Buffer(ab.length);
      var view = new Uint8Array(ab);
      for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
      }
    }

    try {
      if (!buffer) {
        buffer = new AWS.util.Buffer(blob.getDataAsString());
      }
    } catch (e) {}

    if (buffer) {
      emitter.emit('data', buffer);
    }
    emitter.emit('end');
  },
});
