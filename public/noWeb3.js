// Only prevent automatic injection, don't completely block Web3
if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false;
}
