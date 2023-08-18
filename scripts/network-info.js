const { ApiPromise, WsProvider } = require('@polkadot/api');

require('dotenv').config();

async function main() {
  const {
    // LOCAL_NODE_ENDPOINT,
    WESTEND_ASSET_HUB_NODE_ENDPOINT,
    KUSAMA_ASSET_HUB_NODE_ENDPOINT,
    POLKADOT_ASSET_HUB_NODE_ENDPOINT,
  } = process.env;
  let rpcs = [
    // LOCAL_NODE_ENDPOINT,
    WESTEND_ASSET_HUB_NODE_ENDPOINT,
    KUSAMA_ASSET_HUB_NODE_ENDPOINT,
    POLKADOT_ASSET_HUB_NODE_ENDPOINT,
  ];

  for (const rpc of rpcs) {
    console.log(rpc);
    const wsProvider = new WsProvider(rpc);
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.isReady;
    console.log(`Token: ${api.registry.chainTokens[0]}`);
    console.log(`Decimals: ${api.registry.chainDecimals[0]}`);
    console.log(`Prefix: ${api.registry.chainSS58}`);
    await api.disconnect();
    console.log('');
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
