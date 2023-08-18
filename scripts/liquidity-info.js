require('@polkadot/api-augment');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { BN_ZERO } = require('@polkadot/util');

require('dotenv').config();

const apiConfigRuntime = {
  spec: {
    // put here westmint instead of node
    node: {
      runtime: {
        AssetConversionApi: [
          {
            methods: {
              get_reserves: {
                description: 'Get pool reserves',
                params: [
                  {
                    name: 'asset1',
                    type: 'PalletAssetConversionNativeOrAssetId', // for westmint use XcmV3MultiLocation
                  },
                  {
                    name: 'asset2',
                    type: 'PalletAssetConversionNativeOrAssetId', // could use a custom PalletAssetConversionMultiAssetId
                  },
                ],
                type: 'Option<(Balance,Balance)>',
              },
              /*quote_price_exact_tokens_for_tokens: {
                description: 'Quote price: exact tokens for tokens',
                params: [
                  {
                    name: 'asset1',
                    type: 'PalletAssetConversionNativeOrAssetId',
                  },
                  {
                    name: 'asset2',
                    type: 'PalletAssetConversionNativeOrAssetId',
                  },
                  {
                    name: 'amount',
                    type: 'u128',
                  },
                  {
                    name: 'include_fee',
                    type: 'bool',
                  },
                ],
                type: 'Option<(Balance)>',
              },
              quote_price_tokens_for_exact_tokens: {
                description: 'Quote price: tokens for exact tokens',
                params: [
                  {
                    name: 'asset1',
                    type: 'PalletAssetConversionNativeOrAssetId',
                  },
                  {
                    name: 'asset2',
                    type: 'PalletAssetConversionNativeOrAssetId',
                  },
                  {
                    name: 'amount',
                    type: 'u128',
                  },
                  {
                    name: 'include_fee',
                    type: 'bool',
                  },
                ],
                type: 'Option<(Balance)>',
              },*/
            },
            version: 1,
          },
        ],
      },
    },
  },
};

// an example of adding a custom type
/*const apiConfigTypes = {
  PalletAssetConversionMultiAssetId: {
    _enum: {
      Native: null,
      Asset: 'AssetId',
    },
  },
};

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
  // return api.createType("PalletAssetConversionNativeOrAssetId", value);
  return api.createType("PalletAssetConversionMultiAssetId", value);
};*/

const connect = async function () {
  const { NETWORK = '' } = process.env;
  const rpc = process.env[`${NETWORK.toUpperCase()}_NODE_ENDPOINT`];

  if (!rpc) {
    throw new Error('No RPC endpoint found');
  }

  const wsProvider = new WsProvider(rpc);
  const api = await ApiPromise.create({
    provider: wsProvider,
    typesBundle: apiConfigRuntime,
    // types: apiConfigTypes,
  });
  await api.isReady;

  return { api };
};

const getPoolReserves = async (api, asset1, asset2) => {
  let reserves = [BN_ZERO, BN_ZERO];

  if (api.call.assetConversionApi) {
    const res = await api.call.assetConversionApi.getReserves(asset1, asset2);
    if (res && !res.isEmpty) {
      const [reserve1, reserve2] = res.unwrap();
      reserves = [reserve1.toBn(), reserve2.toBn()];
    }
  }

  return reserves;
};

async function main() {
  const { api } = await connect();
  const pools = await api.query.assetConversion.pools.entries();

  for (const [
    {
      args: [poolId],
    },
    data,
  ] of pools) {
    if (!data.isSome) continue;

    const [poolAsset1, poolAsset2] = poolId;
    const reserves = await getPoolReserves(api, poolAsset1, poolAsset2);
    console.log(reserves.map(String));
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
