import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);
  console.log("Chalna deploy migration ran against", provider.connection.rpcEndpoint);
};
