// Prevent Web3 wallet injection
if (window.ethereum) {
  delete window.ethereum;
}
Object.defineProperty(window, "ethereum", {
  value: null,
  configurable: false,
  writable: false,
});

// Also prevent other common Web3 injections
const web3Properties = ["web3", "ethereum", "solana"];
web3Properties.forEach((prop) => {
  if (window[prop]) {
    delete window[prop];
  }
  Object.defineProperty(window, prop, {
    value: null,
    configurable: false,
    writable: false,
  });
});
