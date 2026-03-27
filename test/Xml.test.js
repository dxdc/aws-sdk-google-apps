const fs = require('fs');
const vm = require('vm');

function loadXml() {
  const code = fs.readFileSync(`${__dirname}/../src/Xml.js`, 'utf8');
  const sandbox = { ...global };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('Xml utilities', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = loadXml();
  });

  describe('getElementsByTagName', () => {
    test('finds elements by tag name', () => {
      const mockElement = {
        getDescendants: () => [
          {
            asElement: () => ({
              getName: () => 'item',
              getValue: () => 'value1',
            }),
          },
          {
            asElement: () => ({
              getName: () => 'other',
              getValue: () => 'value2',
            }),
          },
          {
            asElement: () => ({
              getName: () => 'item',
              getValue: () => 'value3',
            }),
          },
        ],
      };

      const result = sandbox.getElementsByTagName(mockElement, 'item');
      expect(result).toEqual(['value1', 'value3']);
    });

    test('returns empty array when no matches', () => {
      const mockElement = {
        getDescendants: () => [
          {
            asElement: () => ({
              getName: () => 'other',
              getValue: () => 'val',
            }),
          },
        ],
      };

      const result = sandbox.getElementsByTagName(mockElement, 'missing');
      expect(result).toEqual([]);
    });

    test('handles null elements from asElement()', () => {
      const mockElement = {
        getDescendants: () => [
          { asElement: () => null },
          {
            asElement: () => ({
              getName: () => 'tag',
              getValue: () => 'found',
            }),
          },
        ],
      };

      const result = sandbox.getElementsByTagName(mockElement, 'tag');
      expect(result).toEqual(['found']);
    });
  });

  describe('xmlElementToJson', () => {
    function makeElement(name, children = [], text = '') {
      return {
        getName: () => name,
        getChildren: () => children,
        getText: () => text,
      };
    }

    test('converts simple text element', () => {
      const el = makeElement('root', [], 'hello');
      const result = sandbox.xmlElementToJson(el);
      expect(result).toBe('hello');
    });

    test('converts element with children to object', () => {
      const el = makeElement('root', [makeElement('name', [], 'John'), makeElement('age', [], '30')]);

      const result = sandbox.xmlElementToJson(el);
      expect(result).toEqual({ name: 'John', age: '30' });
    });

    test('converts item children to array', () => {
      const el = makeElement('list', [makeElement('item', [], 'a'), makeElement('item', [], 'b'), makeElement('item', [], 'c')]);

      const result = sandbox.xmlElementToJson(el);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    test('converts member children to array', () => {
      const el = makeElement('list', [makeElement('member', [], 'x'), makeElement('member', [], 'y')]);

      const result = sandbox.xmlElementToJson(el);
      expect(result).toEqual(['x', 'y']);
    });

    test('handles duplicate keys by converting to array', () => {
      const el = makeElement('root', [makeElement('tag', [], 'first'), makeElement('tag', [], 'second')]);

      const result = sandbox.xmlElementToJson(el);
      expect(result).toEqual({ tag: ['first', 'second'] });
    });

    test('returns null for empty element', () => {
      const el = makeElement('empty', [], '');
      const result = sandbox.xmlElementToJson(el);
      expect(result).toBeNull();
    });
  });
});
