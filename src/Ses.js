/**
 * Send an email using Amazon SES.
 *
 * Accepts both the legacy positional argument style and a modern options object.
 *
 * @param {Object|string} optionsOrTo - Options object, or 'to' email(s) for legacy usage.
 * @param {string|string[]} optionsOrTo.to - Recipient email address(es).
 * @param {string|string[]} [optionsOrTo.cc] - CC email address(es).
 * @param {string|string[]} [optionsOrTo.bcc] - BCC email address(es).
 * @param {string} optionsOrTo.from - Sender email address (must be SES-verified).
 * @param {string|string[]} [optionsOrTo.replyTo] - Reply-to email address(es).
 * @param {string} optionsOrTo.subject - Email subject line.
 * @param {string} optionsOrTo.html - HTML body content.
 * @param {string} [optionsOrTo.text] - Plain text body (auto-generated from HTML if omitted).
 * @returns {Promise<Object|false>} The SES sendEmail response (includes MessageId), or false on error.
 *
 * @example
 * // Modern options-object style (recommended):
 * const result = await sendEmail({
 *   to: 'recipient@example.com',
 *   from: 'sender@example.com',
 *   subject: 'Hello from GAS',
 *   html: '<h1>Hello!</h1><p>Sent via AWS SES.</p>',
 * });
 *
 * // Legacy positional style (still supported):
 * const result = await sendEmail(
 *   'to@example.com', 'cc@example.com', '', 'from@example.com',
 *   'reply@example.com', 'Subject', '<html>body</html>'
 * );
 */
function sendEmail(optionsOrTo, ccEmails, bccEmails, fromEmail, replyToEmails, subject, htmlBody, plainBody) {
  let toEmails, html, text, from, replyTo, cc, bcc, subj;

  // Detect options-object vs legacy positional arguments
  if (typeof optionsOrTo === 'object' && !Array.isArray(optionsOrTo) && optionsOrTo !== null && optionsOrTo.from) {
    toEmails = optionsOrTo.to;
    cc = optionsOrTo.cc || [];
    bcc = optionsOrTo.bcc || [];
    from = optionsOrTo.from;
    replyTo = optionsOrTo.replyTo || [];
    subj = optionsOrTo.subject;
    html = optionsOrTo.html;
    text = optionsOrTo.text;
  } else {
    toEmails = optionsOrTo;
    cc = ccEmails;
    bcc = bccEmails;
    from = fromEmail;
    replyTo = replyToEmails;
    subj = subject;
    html = htmlBody;
    text = plainBody;
  }

  if (typeof toEmails === 'string') {
    toEmails = splitEmails_(toEmails);
  }
  if (typeof cc === 'string') {
    cc = splitEmails_(cc);
  }
  if (typeof bcc === 'string') {
    bcc = splitEmails_(bcc);
  }
  if (typeof replyTo === 'string') {
    replyTo = splitEmails_(replyTo);
  }

  const params = {
    Destination: {
      ToAddresses: toEmails,
      CcAddresses: cc,
      BccAddresses: bcc,
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: html,
        },
        Text: {
          Charset: 'UTF-8',
          Data: text || simpleMakePlainText_(html),
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subj,
      },
    },
    Source: from,
    ReplyToAddresses: replyTo,
  };

  return new AWS.SES({ apiVersion: '2010-12-01' })
    .sendEmail(params)
    .promise()
    .then((data) => data)
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

/**
 * Split a comma-separated email string into an array.
 * @param {string} emails - Comma-separated email addresses.
 * @returns {string[]} Array of trimmed, non-empty email addresses.
 * @private
 */
function splitEmails_(emails) {
  return emails
    .trim()
    .split(/\s*,\s*/)
    .filter(Boolean);
}

/**
 * Convert HTML to plain text by extracting body content.
 * @param {string} html - HTML string to convert.
 * @returns {string} Plain text extracted from the HTML.
 * @private
 */
function simpleMakePlainText_(html) {
  const document = XmlService.parse(html);
  let body = getElementsByTagName(document, 'body');
  if (body.length < 1) {
    body.push(document.getRootElement().getValue());
  }

  const output = body[0]
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n\n');

  return output;
}
