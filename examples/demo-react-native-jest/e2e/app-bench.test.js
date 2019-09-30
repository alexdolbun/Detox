describe('Example app -', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  benchmark('tap on Hello', async () => {
    await element(by.id('hello_button')).tap();
  });

  benchmark('tap on World', async () => {
    await element(by.id('world_button')).tap();
  });
});
