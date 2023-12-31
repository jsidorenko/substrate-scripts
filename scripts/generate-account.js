const { mnemonicToMiniSecret, mnemonicGenerate } = require('@polkadot/util-crypto');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const { u8aToHex } = require('@polkadot/util');
const { Keyring } = require('@polkadot/keyring');

async function main() {
  await cryptoWaitReady();

  const mnemonic = mnemonicGenerate();
  console.log(`Mnemonic: ${mnemonic}`);
  console.log(``);
  const privateKey = mnemonicToMiniSecret(mnemonic);
  console.log(`Private key: ${u8aToHex(privateKey)}`);

  const keyring = new Keyring({ type: 'sr25519' });
  const pair = keyring.createFromUri(mnemonic);
  console.log(`Public key: ${u8aToHex(pair.publicKey)}`);

  console.log(`Polkadot address: ${keyring.encodeAddress(pair.publicKey, 0)}`);
  console.log(`Kusama address: ${keyring.encodeAddress(pair.publicKey, 2)}`);
  console.log(`Westend address: ${keyring.encodeAddress(pair.publicKey, 42)}`);
  console.log(`See all addresses: https://polkadot.subscan.io/tools/format_transform?input=${u8aToHex(pair.publicKey)}&type=All`);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
