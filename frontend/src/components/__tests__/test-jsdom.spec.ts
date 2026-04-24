describe('jsdom location', () => {
  it('can use pushState', () => {
    window.history.pushState({}, '', '/dashboard');
    console.log("pathname:", window.location.pathname);
  });
});
