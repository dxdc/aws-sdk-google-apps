async function setTimeout() {
  const args = Array.prototype.slice.call(arguments);
  const handler = args.shift();
  const ms = args.shift();
  Utilities.sleep(ms);

  return handler.apply(this, args);
}
