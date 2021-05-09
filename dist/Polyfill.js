async function setTimeout(fn, delay) {
  Utilities.sleep(delay);
  fn();
}
