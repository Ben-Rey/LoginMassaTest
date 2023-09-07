import { useEffect, useState } from "react";
import { IAccount, providers } from "@massalabs/wallet-provider";
import { Client, ClientFactory } from "@massalabs/massa-web3";
import axios from "axios";

import "./App.css";
import Confetti from "react-confetti";

function App() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<IAccount>();
  const [client, setClient] = useState<Client>();
  const [providerName, setProviderName] = useState<string>(""); // ["BEARBY", "MASSASTATION"
  const [message, setMessage] = useState<string>("test");

  const setup = async (walletName = "MASSASTATION") => {
    const wallets = await providers();

    const massaStationWallet = wallets.find(
      (wallet) => wallet.name() === walletName
    );

    const accounts = await massaStationWallet?.accounts();

    const account = accounts?.[0];

    const client = await ClientFactory.fromWalletProvider(
      massaStationWallet!,
      account!
    );

    if (!client || !account?.address()) {
      setClient(undefined);
      setAccount(undefined);
      return;
    }

    setAccount(account);
    setClient(client);
    setProviderName(walletName);
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
      .signMessage(message, address);

    console.log(signatureFromProvider);

    const res = await axios.post("http://localhost:3008/login", {
      signature: signatureFromProvider.base58Encoded,
      publicKey: signatureFromProvider.publicKey,
      message: message,
      provider: providerName,
    });

    console.log(res.data);

    if (res.data.isValid) {
      setConnected(true);
    } else {
      alert("Your authentication failed");
      setConnected(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        className="bg-gray-500 text-white"
        onClick={async () => {
          login();
        }}
        disabled={connected}
      >
        {connected
          ? "You are Connected"
          : `Connect (Sign) with ${providerName}`}
      </button>
      <div className="flex gap-2">
        <button
          onClick={() => setup("BEARBY")}
          className={`${
            providerName === "BEARBY" ? "bg-green-300" : "bg-transparent"
          }`}
        >
          Use Bearby
        </button>
        <button
          className={`${
            providerName === "MASSASTATION" ? "bg-green-300" : "bg-transparent"
          }`}
          onClick={() => setup("MASSASTATION")}
        >
          Use MassaStation
        </button>
      </div>
      <p>Message to sign</p>
      <input
        className="border-2 border-gray-500 rounded-md"
        type="text"
        onChange={(e) => setMessage(e.target.value)}
        value={message}
      />
      {connected && <Confetti recycle={false} gravity={0.5} />}
    </div>
  );
}

export default App;
