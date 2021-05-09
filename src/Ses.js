function sendEmail(toEmails, ccEmails, bccEmails, fromEmail, replyToEmails, subject, htmlBody, plainBody) {
  if (typeof toEmails === 'string') {
    toEmails = splitEmails_(toEmails);
  }
  if (typeof ccEmails === 'string') {
    ccEmails = splitEmails_(ccEmails);
  }
  if (typeof bccEmails === 'string') {
    bccEmails = splitEmails_(bccEmails);
  }
  if (typeof replyToEmails === 'string') {
    replyToEmails = splitEmails_(replyToEmails);
  }

  const params = {
    Destination: {
      ToAddresses: toEmails,
      CcAddresses: ccEmails,
      BccAddresses: bccEmails,
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlBody,
        },
        Text: {
          Charset: 'UTF-8',
          Data: plainBody || simpleMakePlainText_(htmlBody),
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
    Source: fromEmail,
    ReplyToAddresses: replyToEmails,
  };

  // Create the promise and SES service object
  var sendPromise = new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();
  return sendPromise
    .then((data) => {
      return data;
    })
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

function splitEmails_(emails) {
  return emails
    .trim()
    .split(/\s*,\s*/)
    .filter(Boolean);
}

function simpleMakePlainText_(html) {
  var document = XmlService.parse(html);
  var body = getElementsByTagName(document, 'body');
  if (body.length < 1) {
    body.push(document.getRootElement().getValue());
  }

  var output = body[0]
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n\n');

  return output;
}
