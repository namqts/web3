import {ethers} from 'ethers';
import {useEffect, useState} from 'react';
import {View, Text, Button} from 'react-native';
import Web3 from 'web3';
import Web3Modal from 'web3modal';
import {Box, Input, Select} from 'native-base';

const web3Modal = new Web3Modal({
  cacheProvider: true, // optional
  providerOptions, // required
});

export default function App() {
  const [provider, setProvider] = useState();
  const [library, setLibrary] = useState();
  const [account, setAccount] = useState();
  const [signature, setSignature] = useState('');
  const [error, setError] = useState('');
  const [chainId, setChainId] = useState();
  const [network, setNetwork] = useState();
  const [message, setMessage] = useState('');
  const [signedMessage, setSignedMessage] = useState('');
  const [verified, setVerified] = useState();

  const connectWallet = async () => {
    try {
      const provider = await web3Modal.connect();
      const library = new ethers.providers.Web3Provider(provider);
      const accounts = await library.listAccounts();
      const network = await library.getNetwork();
      setProvider(provider);
      setLibrary(library);
      if (accounts) setAccount(accounts[0]);
      setChainId(network.chainId);
    } catch (error) {
      setError(error);
    }
  };

  const handleNetwork = e => {
    const id = e.target.value;
    setNetwork(Number(id));
  };

  const handleInput = e => {
    const msg = e.target.value;
    setMessage(msg);
  };

  const switchNetwork = async () => {
    try {
      await library.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{chainId: toHex(network)}],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await library.provider.request({
            method: 'wallet_addEthereumChain',
            params: [networkParams[toHex(network)]],
          });
        } catch (error) {
          setError(error);
        }
      }
    }
  };

  const signMessage = async () => {
    if (!library) return;
    try {
      const signature = await library.provider.request({
        method: 'personal_sign',
        params: [message, account],
      });
      setSignedMessage(message);
      setSignature(signature);
    } catch (error) {
      setError(error);
    }
  };

  const verifyMessage = async () => {
    if (!library) return;
    try {
      const verify = await library.provider.request({
        method: 'personal_ecRecover',
        params: [signedMessage, signature],
      });
      setVerified(verify === account.toLowerCase());
    } catch (error) {
      setError(error);
    }
  };

  const refreshState = () => {
    setAccount();
    setChainId();
    setNetwork('');
    setMessage('');
    setSignature('');
    setVerified(undefined);
  };

  const disconnect = async () => {
    await web3Modal.clearCachedProvider();
    refreshState();
  };

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectWallet();
    }
  }, []);

  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = accounts => {
        console.log('accountsChanged', accounts);
        if (accounts) setAccount(accounts[0]);
      };

      const handleChainChanged = _hexChainId => {
        setChainId(_hexChainId);
      };

      const handleDisconnect = () => {
        console.log('disconnect', error);
        disconnect();
      };

      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
      provider.on('disconnect', handleDisconnect);

      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', handleChainChanged);
          provider.removeListener('disconnect', handleDisconnect);
        }
      };
    }
  }, [provider]);

  return (
    <>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          height: 100,
          width: 100 + '%',
        }}>
        <View
          style={{
            width: 100 + '%',
            height: 100,
            marginBottom: 10,
            flexDirection: 'column',
          }}>
          <Text
            style={{
              margin: 0,
              lineHeight: 1.15,
              fontSize: [1.5, 2, 3, 4],
              fontWeight: '600',
            }}>
            Let's connect with
          </Text>
          <Text
            style={{
              margin: 0,
              lineHeight: 1.15,
              fontSize: [1.5, 2, 3, 4],
              fontWeight: '600',
            }}>
            Web3Modal
          </Text>
        </View>
        <View>
          {!account ? (
            <Button
              title="Connect Wallet"
              onPress={() => connectWallet}></Button>
          ) : (
            <Button title="Disconnect" onPress={() => disconnect}></Button>
          )}
        </View>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            padding: (10, 0),
          }}>
          <View>
            <Text>{`Connection Status: `}</Text>
            {account ? (
              <Text style={{color: 'green'}}>Yes</Text>
            ) : (
              <Text style={{color: '#cd5700'}}>No</Text>
            )}
          </View>
          <Text>{`Network ID: ${chainId ? chainId : 'No Network'}`}</Text>
        </View>
        {account && (
          <View
            style={{justifyContent: 'flex-start', alignItems: 'flex-start'}}>
            <Box
              maxW="sm"
              borderWidth="1"
              borderRadius="lg"
              overflow="hidden"
              padding="10">
              <View>
                <Button
                  title="Switch Network"
                  onPress={() => switchNetwork}
                  disabled={!network}></Button>
              </View>
              <Select
                placeholder="Select network"
                onPress={() => handleNetwork}>
                <option value="3">Ropsten</option>
                <option value="4">Rinkeby</option>
                <option value="42">Kovan</option>
                <option value="1666600000">Harmony</option>
                <option value="42220">Celo</option>
                <option value="55">SPC</option>
              </Select>
            </Box>
            <Box
              maxW="sm"
              borderWidth="1"
              borderRadius="lg"
              overflow="hidden"
              padding="10">
              <View>
                <Button
                  title="Sign Message"
                  onPress={() => signMessage}
                  disabled={!message}></Button>
                <Input
                  placeholder="Set Message"
                  maxLength={20}
                  onChange={handleInput}
                  w="140px"></Input>
              </View>
            </Box>
            <Box
              maxW="sm"
              borderWidth="1"
              borderRadius="lg"
              overflow="hidden"
              padding="10">
                <View>
                  <Button title='Verify Message' onPress={() => verifyMessage} disabled={!signature}/>
                  {verified !== undefined ? (
                    verified === true ? (
                      <View>
                        <Text>Signature Verified!</Text>
                      </View>
                    ) : (
                      <View>
                        <Text>Signature Denied!</Text>
                      </View>
                    )
                  ) : null}
                </View>
              </Box>
          </View>
        )}
        <Text>{error ? error.message : null}</Text>
      </View>
    </>
  );
}
