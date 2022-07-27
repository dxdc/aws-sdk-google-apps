# aws-sdk-google-apps

[![mit license](https://badgen.net/badge/license/MIT/red)](https://github.com/dxdc/aws-sdk-google-apps/blob/master/LICENSE)
[![Donate](https://badgen.net/badge/Donate/PayPal/91BE09)](https://paypal.me/ddcaspi)

Native support for the entire AWS SDK for JavaScript in Google Apps Script.

Working examples for Simple Email Service (SES), S3, and Lambda. This project can easily accommodate _all_ other AWS services, e.g.,

```
npm run sdk --sdk=ses,s3,ec2,lambda,dynamodb && npm run build
```

## Library deployment

1. Add the existing Google Apps Script project [as a Library](https://developers.google.com/apps-script/guides/libraries#add_a_library_to_your_script_project)

- Script ID `1J6iN9mJE-NK6LGTlZcngsflJEx59tE3ZOW4-2cdHbgw0So2MmEcRZxKG`
- Choose an identifier, e.g., `AWSLIB`
- Versions of the Google Apps Script project map to tags on this Git repository

2. Initialize your AWS config settings and implement one of this library's [S3](dist/S3.js), [Lambda](dist/Lambda.js), or [SES](dist/Ses.js) functions. [Examples.js](dist/Examples.js) shows some working examples.

```js
const AWS_CONFIG = {
  accessKey: 'AK0ZXZD0KGNG4KG6REBP', // use your own AWS key
  secretKey: 'EXrPgHC41HEW2YownLUnJLgh6bMsrmW1uva1ic24', // use your own AWS key
  region: 'us-east-1',
};

// example function to retrieve S3 object
async function getS3ObjectTest() {
  AWSLIB.initConfig(AWS_CONFIG);
  var result = await AWSLIB.getS3Object('myBucket', 'folder1/file.jpg');
  if (result === false) {
    return false;
  }

  var blob = Utilities.newBlob(result.Body, result.ContentType);
  // Logger.log(blob.getDataAsString());
  return blob;
}
```

3. Methods for common S3, Lambda, and SES services have been implemented. However, direct access to library AWS SDK methods is also available via the `AWS` property on your chosen library identifier, e.g.:

```js
// Create a new service object
var s3 = new AWSLIB.AWS.S3({
  apiVersion: '2006-03-01',
  params: { Bucket: albumBucketName },
});
```

## Advanced deployment

1. Customize the AWS SDK if additional services are needed

2. Copy & paste all the files from `dist/` into your project.

- `Examples.js` and `Config.js` are placeholders, which should be adapted with your code.

### Customized AWS SDK

The AWS SDK can be customized for specific API versions and/or services.

This project defaults to the following services: `ses,s3,lambda`.

To customize the codebase for your project:

```shell
$ cd aws-sdk-js
$ npm install
$ cd ..
$ npm install
$ npm run sdk --sdk=all
# can also be customized, e.g.
# npm run sdk --sdk=ses,ec2,dynamodb-2011-12-05,dynamodb-2012-08-10
$ npm run build
```

Services can also be customized using a comma-delimited list of services.
AWS has a [full list](https://github.com/aws/aws-sdk-js/tree/master/apis) of identifiers and api versions available.

### Create your own library

1. Create a new project in Google Scripts.

2. Copy & paste all the files from `dist/` into your project file and save it.

3. Go `File → Manage versions` and click `Save new version`.

4. You can `Share` and make it public.

5. Copy your library Script ID from `File → Project properties → Script ID`

6. Reference this Script ID as a library in other projects.

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
