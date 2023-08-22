import { useEffect, useState } from "react";
import { IAccount, providers } from "@massalabs/wallet-provider";
import { Client, ClientFactory } from "@massalabs/massa-web3";
import axios from "axios";

const fakeSignature = {
  publicKey: "P1xRRW7bpKLGuhqLoA5a12z8s1nLGffbJ8joPAkZzpkM4SESGhh",
  signature:
    "1AEgQfNUKLktrNx2J4i5ri4wvHj2Pqn1cPT4HSfDdT5vMrjCkhDLacQoDwyTnZTBG7h3HEoYNSoYAhn8D7CayM7FswdubB",
};

import "./App.css";

function App() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<IAccount>();
  const [client, setClient] = useState<Client>();

  const setup = async (walletName = "MASSASTATION") => {
    const wallets = await providers();

    const massaStationWallet = wallets.find(
      // (wallet) => wallet.name() === "BEARBY"
      (wallet) => wallet.name() === walletName
    );

    const accounts = await massaStationWallet?.accounts();

    const account = accounts?.[0];

    const client = await ClientFactory.fromWalletProvider(
      massaStationWallet!,
      account!
    );

    if (!client || !account?.address()) return;

    setAccount(account);
    setClient(client);
  };

  useEffect(() => {
    setup();
  }, []);

  const login = async () => {
    if (!client) return;
    if (!account) return;

    const address = await client.wallet().getBaseAccount()?.address();
    if (!address) return;

    const signatureFromProvider = await client
      .wallet()
      .signMessage("Test", address);

    // we will use fake signature for now
    const res = await axios.post("http://localhost:3008/login", {
      signature: fakeSignature.signature,
      publicKey: fakeSignature.publicKey,
      message: "Test",
    });

    if (res.data.isValid) {
      alert("You are connected");
      setConnected(true);
    } else {
      alert("Your authentication failed");
      setConnected(false);
    }
  };

  return (
    <>
      <button
        onClick={async () => {
          login();
        }}
        disabled={connected}
      >
        {connected ? "You are Connected" : "Connect"}
      </button>

      <button onClick={() => setup("BEARBY")}>Use Bearby</button>
      <button onClick={() => setup("MASSASTATION")}>Use MassaStation</button>
    </>
  );
}

export default App;
