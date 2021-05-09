# aws-sdk-google-apps

[![mit license](https://badgen.net/badge/license/MIT/red)](https://github.com/dxdc/aws-sdk-google-apps/blob/master/LICENSE)
[![Donate](https://badgen.net/badge/Donate/PayPal/91BE09)](https://paypal.me/ddcaspi)

Native support for the entire AWS SDK for JavaScript in Google Apps Script.

Working examples for Simple Email Service (SES), S3, and Lambda. This project can easily accommodate _all_ other AWS services, e.g.,

```
npm run sdk --sdk=ses,s3,ec2,lambda,dynamodb && npm run build
```

## Setup

1. Copy & paste all the files from `dist/` into your project.

2. See `Examples.js` and `Config.js` for working examples.

### Create your own library

1. Create a new project in Google Scripts.

2. Copy & paste all the files from `dist/` into your project file and save it.

3. Go `File → Manage versions` and click `Save new version`.

4. You can `Share` and make it public.

5. Copy your library Script ID from `File → Project properties → Script ID`

6. Reference this Script ID as a library in other projects.

## Customize SDK for Specific Services

The AWS SDK can be customized for specific API versions and/or services.

This project defaults to the following services: `ses,s3,lambda`.

To optimize the codebase for your project:

1. `npm install` inside `aws-sdk-js`

2. `npm run sdk --sdk=<services>` using a comma-delimited list of services.

> e.g., `npm run sdk --sdk=ses,ec2,dynamodb-2011-12-05,dynamodb-2012-08-10` or `npm run sdk --sdk=all`

3. `npm run build`

> Service identifiers and API versions are available in the service-specific configuration files at https://github.com/aws/aws-sdk-js/tree/master/apis.

## Background

Several other projects exist for interfacing between the AWS API and Google Apps Script. However, these projects have very limited support for the full suite of AWS services offered. This is the first project which invokes the AWS SDK directly.

### SDK Core modifications

Several key changes to the AWS SDK core were required to make it compatible with the Google Apps Script framework.

Namely, Google Apps Script does not have support for `window`, `XMLHttpRequest`, and `DOMParser` - instead, it requires the use of `UrlFetchApp` and `XmlService`. These patch files can be found in `src-sdk`.

Note, the final patched build remains compatible in the browser, e.g.,

```diff
-AWS.HttpClient.prototype = AWS.XHRClient.prototype;
+AWS.HttpClient.prototype = typeof XMLHttpRequest === 'undefined' && typeof UrlFetchApp !== 'undefined' ? AWS.XHRGoogleClient.prototype : AWS.XHRClient.prototype;
```

## How to contribute

Have an idea? Found a bug? Contributions and pull requests are welcome.

## Credits

Acknowledgements to @lsegal for [initial research](https://github.com/aws/aws-sdk-js/issues/620), @sk16 for [modifying AWS.XHRClient for use with fetch](https://github.com/aws/aws-sdk-js/issues/1902), as well as the authors of existing repositories (e.g., [aws-apps-scripts](https://github.com/smithy545/aws-apps-scripts), [apps-script-aws-request](https://github.com/wmakeev/apps-script-aws-request)), for insight in how to solve this problem.

## Support this project

I try to reply to everyone needing help using these projects. Obviously, this takes time. However, if you get some profit from this or just want to encourage me to continue creating stuff, there are few ways you can do it:

- Starring and sharing the projects you like :rocket:
- [![PayPal][badge_paypal]][paypal-donations-dxdc] **PayPal**— You can make one-time donations to **dxdc** via PayPal.
- **Venmo**— You can make one-time donations via Venmo.
  ![Venmo QR Code](/images/venmo.png?raw=true 'Venmo QR Code')
- **Bitcoin**— You can send me Bitcoin at this address: `33sT6xw3tZWAdP2oL4ygbH5TVpVMfk9VW7`

[badge_paypal]: https://img.shields.io/badge/Donate-PayPal-blue.svg
[paypal-donations-dxdc]: https://paypal.me/ddcaspi
