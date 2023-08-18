const { Keyring } = require("@polkadot/keyring");
const { ApiPromise, WsProvider } = require("@polkadot/api");

const MultiAssets = {
  NATIVE: "Native",
  ASSET: "Asset",
};

const toMultiAsset = (asset, api) => {
  const value =
    asset === MultiAssets.NATIVE || asset === null
      ? MultiAssets.NATIVE
      : {
          [MultiAssets.ASSET]: asset,
        };
  return api.createType("PalletAssetConversionNativeOrAssetId", value);
};

async function main() {
  const api = await connect();
  const keyring = new Keyring({ type: "sr25519" });
  const alice = keyring.addFromUri("//Alice");
  const charlie = keyring.addFromUri("//Charlie");

  const txs = [];
  const tokenId = 1;
  txs.push(await createToken(api, tokenId, alice.address, 1));
  txs.push(await setTokenMetadata(api, tokenId, "Asset1", "AST1", 0));
  txs.push(await mintToken(api, tokenId, alice.address, 200000));
  txs.push(await createPool(api, tokenId));
  txs.push(
    await provideLiquidity(api, tokenId, native(1000), 100000, alice.address),
  );
  await api.tx.utility.batchAll(txs).signAndSend(alice);

  console.log("Token created");
  console.log("Metadata set");
  console.log(`Token minted to ${alice.address}`);
  console.log("Pool created");
  console.log("Liquidity provided");

  console.log("Waiting 2 sec");
  await timeout(2000);

  await api.tx.balances
    .transfer(charlie.address, native(100))
    .signAndSend(alice, { assetId: tokenId });
  console.log("Tx sent");

  console.log("Done!");

  function native(units) {
    return unitToPlanck(units, api.registry.chainDecimals[0]);
  }
}

async function connect() {
  const wsProvider = new WsProvider("ws://127.0.0.1:9944");
  const api = await ApiPromise.create({ provider: wsProvider });
  await api.isReady;

  return api;
}

async function createToken(api, id, admin, minBalance) {
  return api.tx.assets.create(id, admin, minBalance);
}

async function setTokenMetadata(api, tokenId, name, ticker, decimals) {
  return api.tx.assets.setMetadata(tokenId, name, ticker, decimals);
}

async function mintToken(api, tokenId, receiver, amount) {
  return api.tx.assets.mint(tokenId, receiver, amount);
}

async function createPool(api, tokenId) {
  return api.tx.assetConversion.createPool(
    toMultiAsset(null, api),
    toMultiAsset(tokenId, api),
  );
}

async function provideLiquidity(api, tokenId, amount1, amount2, mintTo) {
  return api.tx.assetConversion.addLiquidity(
    toMultiAsset(null, api),
    toMultiAsset(tokenId, api),
    amount1,
    amount2,
    0,
    0,
    mintTo,
  );
}

function unitToPlanck(units, decimals) {
  const separated = units.toString().split(".");
  const [whole] = separated;
  let [, decimal] = separated;

  if (typeof decimal === "undefined") {
    decimal = "";
  }

  return `${whole}${decimal.padEnd(decimals, "0")}`.replace(/^0+/, "");
}

async function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main()
  .catch(console.error)
  .finally(() => process.exit());
