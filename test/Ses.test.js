const fs = require('fs');
const vm = require('vm');

function loadSes() {
  const xmlCode = fs.readFileSync(`${__dirname}/../src/Xml.js`, 'utf8');
  const sesCode = fs.readFileSync(`${__dirname}/../src/Ses.js`, 'utf8');

  const mockSendEmail = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ MessageId: 'test-message-id' }),
  });

  const sandbox = {
    ...global,
    AWS: {
      SES: jest.fn().mockReturnValue({ sendEmail: mockSendEmail }),
    },
    XmlService: {
      parse: jest.fn(),
    },
    Logger: { log: jest.fn() },
    _mockSendEmail: mockSendEmail,
  };

  vm.createContext(sandbox);
  vm.runInContext(xmlCode, sandbox);
  vm.runInContext(sesCode, sandbox);
  return sandbox;
}

describe('SES', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = loadSes();
  });

  describe('splitEmails_', () => {
    test('splits comma-separated emails', () => {
      const result = sandbox.splitEmails_('a@b.com, c@d.com, e@f.com');
      expect(result).toEqual(['a@b.com', 'c@d.com', 'e@f.com']);
    });

    test('handles single email', () => {
      const result = sandbox.splitEmails_('test@example.com');
      expect(result).toEqual(['test@example.com']);
    });

    test('filters empty strings', () => {
      const result = sandbox.splitEmails_('a@b.com, , c@d.com');
      expect(result).toEqual(['a@b.com', 'c@d.com']);
    });

    test('trims whitespace', () => {
      const result = sandbox.splitEmails_('  a@b.com  ');
      expect(result).toEqual(['a@b.com']);
    });
  });

  describe('sendEmail - legacy positional args', () => {
    test('sends email successfully with string addresses', async () => {
      const result = await sandbox.sendEmail(
        'to@example.com',
        'cc@example.com',
        'bcc@example.com',
        'from@example.com',
        'reply@example.com',
        'Test Subject',
        '<html><body>Hello</body></html>',
        'Hello plain',
      );

      expect(result).toEqual({ MessageId: 'test-message-id' });
      expect(sandbox.AWS.SES).toHaveBeenCalledWith({ apiVersion: '2010-12-01' });
    });

    test('sends email with array addresses', async () => {
      const result = await sandbox.sendEmail(
        ['to@example.com'],
        ['cc@example.com'],
        [],
        'from@example.com',
        ['reply@example.com'],
        'Test Subject',
        '<html><body>Hello</body></html>',
        'Hello plain',
      );

      expect(result).toEqual({ MessageId: 'test-message-id' });
    });

    test('throws on error', async () => {
      sandbox._mockSendEmail.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('SES error')),
      });

      await expect(
        sandbox.sendEmail('to@example.com', '', '', 'from@example.com', '', 'Subj', '<html><body>Hi</body></html>', 'Hi'),
      ).rejects.toThrow('SES error');
    });
  });

  describe('sendEmail - options object', () => {
    test('sends email with options object', async () => {
      const result = await sandbox.sendEmail({
        to: 'to@example.com',
        from: 'from@example.com',
        subject: 'Test',
        html: '<html><body>Hello</body></html>',
        text: 'Hello',
      });

      expect(result).toEqual({ MessageId: 'test-message-id' });
    });

    test('handles cc, bcc, replyTo in options', async () => {
      await sandbox.sendEmail({
        to: 'to@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        from: 'from@example.com',
        replyTo: 'reply@example.com',
        subject: 'Test',
        html: '<html><body>Hello</body></html>',
        text: 'Hello',
      });

      expect(sandbox._mockSendEmail).toHaveBeenCalled();
    });

    test('defaults cc, bcc, replyTo to empty arrays when not provided', async () => {
      await sandbox.sendEmail({
        to: 'to@example.com',
        from: 'from@example.com',
        subject: 'Test',
        html: '<html><body>Hello</body></html>',
        text: 'Hello',
      });

      expect(sandbox._mockSendEmail).toHaveBeenCalled();
    });

    test('splits string email fields in options object', async () => {
      await sandbox.sendEmail({
        to: 'a@b.com, c@d.com',
        cc: 'e@f.com',
        from: 'from@example.com',
        subject: 'Test',
        html: '<html><body>Hello</body></html>',
        text: 'Hello',
      });

      expect(sandbox._mockSendEmail).toHaveBeenCalled();
    });
  });

  describe('simpleMakePlainText_', () => {
    test('falls back to tag stripping when HTML is not valid XML', () => {
      sandbox.XmlService.parse.mockImplementation(() => {
        throw new Error('Content is not allowed in prolog');
      });

      const result = sandbox.simpleMakePlainText_('<p>Hello <b>world</b></p>');
      expect(result).toBe('Hello world');
    });

    test('strips tags gracefully for unclosed HTML', () => {
      sandbox.XmlService.parse.mockImplementation(() => {
        throw new Error('XML parsing error');
      });

      const result = sandbox.simpleMakePlainText_('<p>Unclosed paragraph');
      expect(result).toBe('Unclosed paragraph');
    });
  });
});
