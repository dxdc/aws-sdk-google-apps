AWS.HttpClient.prototype =
  typeof XMLHttpRequest === 'undefined' && typeof UrlFetchApp !== 'undefined' ? AWS.XHRGoogleClient.prototype : AWS.XHRClient.prototype;
