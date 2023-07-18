import React, { useMemo, useState, useEffect } from 'react';
import { BigNumber, ethers, utils } from 'ethers';
import {
  ConnectWallet,
  useActiveClaimConditionForWallet,
  useAddress,
  useClaimConditions,
  useClaimedNFTSupply,
  useClaimerProofs,
  useClaimIneligibilityReasons,
  useContract,
  useContractMetadata,
  useContractRead,
  useNFT,
  useUnclaimedNFTSupply,
  Web3Button,
} from '@thirdweb-dev/react';
import { HeadingImage } from './components/HeadingImage';
import { PoweredBy } from './components/PoweredBy';
import { useToast } from './components/ui/use-toast';
import { parseIneligibility } from './utils/parseIneligibility';
import {
  contractConst,
  primaryColorConst,
  themeConst,
} from './consts/parameters';

const urlParams = new URL(window.location.toString()).searchParams;
const contractAddress =
  urlParams.get('0x5f8eD33d9eC6B28DAafa9A1f9faDff3D9f94e5fB') ||
  contractConst ||
  '';
const primaryColor =
  urlParams.get('primaryColor') || primaryColorConst || undefined;

const colors = {
  purple: '#7C3AED',
  blue: '#3B82F6',
  orange: '#F59E0B',
  pink: '#EC4899',
  green: '#10B981',
  red: '#EF4444',
  teal: '#14B8A6',
  cyan: '#22D3EE',
  yellow: '#FBBF24',
} as const;

export default function Home() {
  const [desiredTokenAmount, setDesiredTokenAmount] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (event: { target: { value: string; }; }) => {
    let value = parseInt(event.target.value);
    if (value >= 1 && value <= 10) {
      setDesiredTokenAmount(value);
    }
  };

  const handleCheckoutClick = () => {
    window.open(
      'https://withpaper.com/checkout/a7f941f2-0cc7-480e-8438-c5657f2275ef',
      '_blank'
    );
  };

  const contractQuery = useContract(contractAddress);
  const contractMetadata = useContractMetadata(contractQuery.contract);
  const { toast } = useToast();
  const theme = (urlParams.get('theme') || themeConst || 'light') as
    | 'light'
    | 'dark';
  const root = window.document.documentElement;
  root.classList.add(theme);
  const address = useAddress();
  const [quantity, setQuantity] = useState(1);
  const claimConditions = useClaimConditions(contractQuery.contract);
  const activeClaimCondition = useActiveClaimConditionForWallet(
    contractQuery.contract,
    address
  );
  const claimerProofs = useClaimerProofs(
    contractQuery.contract,
    address || ''
  );
  const unclaimedSupply = useUnclaimedNFTSupply(contractQuery.contract);
  const claimedSupply = useClaimedNFTSupply(contractQuery.contract);
  const { data: firstNft, isLoading: firstNftLoading } = useNFT(
    contractQuery.contract,
    0
  );

  const { contract: totalSupplyContract } = useContract(
    '0x5f8eD33d9eC6B28DAafa9A1f9faDff3D9f94e5fB'
  );
  const { data: numberTotal, isLoading: totalSupplyLoading } = useContractRead(
    totalSupplyContract,
    'totalSupply',
    []
  );

  const isLoading = useMemo(() => {
    return (
      activeClaimCondition.isLoading ||
      unclaimedSupply.isLoading ||
      claimedSupply.isLoading ||
      !contractQuery.contract
    );
  }, [
    activeClaimCondition.isLoading,
    contractQuery.contract,
    claimedSupply.isLoading,
    unclaimedSupply.isLoading,
  ]);

  useEffect(() => {
    if (claimConditions.isError) {
      setErrorMessage('Failed to fetch claim conditions.');
    }
  }, [claimConditions.isError]);

  useEffect(() => {
    if (activeClaimCondition.isError) {
      setErrorMessage('Failed to fetch active claim condition.');
    }
  }, [activeClaimCondition.isError]);

  useEffect(() => {
    if (claimerProofs.isError) {
      setErrorMessage('Failed to fetch claimer proofs.');
    }
  }, [claimerProofs.isError]);

  useEffect(() => {
    if (unclaimedSupply.isError) {
      setErrorMessage('Failed to fetch unclaimed NFT supply.');
    }
  }, [unclaimedSupply.isError]);

  useEffect(() => {
    if (claimedSupply.isError) {
      setErrorMessage('Failed to fetch claimed NFT supply.');
    }
  }, [claimedSupply.isError]);

  if (!contractAddress) {
    return (
      <div className="flex h-full items-center justify-center">
        No contract address provided
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen">
      <ConnectWallet className="!absolute !right-4 !top-4" theme={theme} />

      <div className="grid h-screen grid-cols-1 lg:grid-cols-12">
        <div className="hidden h-full w-full items-center justify-center lg:col-span-5 lg:flex lg:px-12">
          <img
            src="https://bafybeifrdu43ddcecl5a4ipjrkrpfrperstxcpiuoicucxffp3l76ry7qy.gateway.ipfscdn.io/chg.gif"
          />
        </div>
        <div className="col-span-1 flex h-full w-full items-center justify-center lg:col-span-7">
          <div className="flex w-full max-w-xl flex-col gap-4 rounded-xl p-12 lg:border lg:border-gray-400 lg:dark:border-gray-800">
            <div className="mt-8 flex w-full xs:mb-8 xs:mt-0 lg:hidden">
              <img
                src="https://bafybeifrdu43ddcecl5a4ipjrkrpfrperstxcpiuoicucxffp3l76ry7qy.gateway.ipfscdn.io/chg.gif"
              />
            </div>

            {/* {errorMessage && <p>{errorMessage}</p>} */}

            <div className="flex flex-col gap-2 xs:gap-4">
                <div
                  role="status"
                  className="animate-pulse space-y-8 md:flex md:items-center md:space-x-8 md:space-y-0"
                >
                  <div className="w-full">
                    <div className="h-10 w-24 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>
                <p>
                  <span className="text-lg font-bold tracking-wider text-gray-500 xs:text-xl lg:text-2xl">
                    {numberTotal}
                  </span>
                  <span className="text-lg font-bold tracking-wider xs:text-xl lg:text-2xl">
                    / 1998 Minted!
                  </span>
                </p>
              <h1 className="line-clamp-1 text-2xl font-bold xs:text-3xl lg:text-4xl">
                {contractMetadata.isLoading ? (
                  <div
                    role="status"
                    className="animate-pulse space-y-8 md:flex md:items-center md:space-x-8 md:space-y-0"
                  >
                    <div className="w-full">
                      <div className="h-8 w-48 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    <span className="sr-only">Loading...</span>
                  </div>
                ) : (
                  contractMetadata.data?.name
                )}
              </h1>
              {contractMetadata.data?.description ||
                contractMetadata.isLoading ? (
                <div className="line-clamp-2 text-gray-500">
                  {contractMetadata.isLoading ? (
                    <div
                      role="status"
                      className="animate-pulse space-y-8 md:flex md:items-center md:space-x-8 md:space-y-0"
                    >
                      <div className="w-full">
                        <div className="mb-2.5 h-2 max-w-[480px] rounded-full bg-gray-200 dark:bg-gray-700"></div>
                        <div className="mb-2.5 h-2 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      </div>
                      <span className="sr-only">Loading...</span>
                    </div>
                  ) : (
                    contractMetadata.data?.description
                  )}
                </div>
              ) : null}
            </div>
            <div className="flex w-full gap-4">
              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:gap-4 ">
                  <Web3Button
                    contractAddress="0x5f8eD33d9eC6B28DAafa9A1f9faDff3D9f94e5fB"
                    action={async (contract) => {
                      try {
                        const tx = await contract.call(
                          'mint',
                          [address, desiredTokenAmount],
                          {
                            value: ethers.utils.parseEther(
                              (0.1515 * desiredTokenAmount).toString()
                            ),
                          }
                        );
                        await tx.wait(); // Wait for the transaction to be mined

                        toast({
                          title: 'Successfully minted',
                          description: 'The NFT has been transferred to your wallet! To view your new NFT please visit https://hub.auraexchange.org/collection/ethereum/0x5f8ed33d9ec6b28daafa9a1f9fadff3d9f94e5fb',
                          duration: 5000,
                          className: 'bg-green-500',
                        });
                      } catch (err: any) {
                        console.error(err);
                        console.log({ err });

                        const errorMessage = err.message;

                        if (errorMessage.includes('value:     0.1515 ETH')) {
                          toast({
                            title: 'Transaction Error',
                            description: "To mint 1 Genesis NFT is 0.1515 plus gas. You don't have enough funds to mint. Please add more funds and try again.",
                            duration: 9000,
                            variant: 'destructive',
                          });
                        } else if (errorMessage.includes('value:     0.303 ETH')) {
                          toast({
                            title: 'Transaction Error',
                            description: "To mint 2 Genesis NFTs is 0.303 plus gas. You don't have enough funds to mint. Please add more funds and try again.",
                            duration: 9000,
                            variant: 'destructive',
                          });
                        } else if (errorMessage.includes('value:     0.4545 ETH')) {
                          toast({
                            title: 'Transaction Error',
                            description: "To mint 3 Genesis NFTs is 0.4545 plus gas. You don't have enough funds to mint. Please add more funds and try again.",
                            duration: 9000,
                            variant: 'destructive',
                          });
                        } else if (errorMessage.includes('value:     0.606 ETH')) {
                          toast({
                            title: 'Transaction Error',
                            description: "To mint 4 Genesis NFTs is 0.606 plus gas. You don't have enough funds to mint. Please add more funds and try again.",
                            duration: 9000,
                            variant: 'destructive',
                          });
                        } else if (errorMessage.includes('value:     0.7575 ETH')) {
                          toast({
                            title: 'Transaction Error',
                            description: "To mint 5 Genesis NFTs is 0.7575 plus gas. You don't have enough funds to mint. Please add more funds and try again.",
                            duration: 9000,
                            variant: 'destructive',
                          });
                        } else if (errorMessage.includes('value:     0.909 ETH')) {
                          toast({
                            title: 'Transaction Error',
                            description: "To mint 6 Genesis NFTs is 0.909 plus gas. You don't have enough funds to mint. Please add more funds and try again.",
                            duration: 9000,
                            variant: 'destructive',
                          });
                        } else if (errorMessage.includes('value:     1.0605 ETH')) {
                          toast({
                            title: 'Transaction Error',
                            description: "To mint 7 Genesis NFTs is 1.0605 plus gas. You don't have enough funds to mint. Please add more funds and try again.",
                            duration: 9000,
                            variant: 'destructive',
                          });
                        } else if (errorMessage.includes('value:     1.212 ETH')) {
                          toast({
                            title: 'Transaction Error',
                            description: "To mint 8 Genesis NFTs is 1.212 plus gas. You don't have enough funds to mint. Please add more funds and try again.",
                            duration: 9000,
                            variant: 'destructive',
                          });
                        } else if (errorMessage.includes('value:     1.3635 ETH')) {
                          toast({
                            title: 'Transaction Error',
                            description: "To mint 9 Genesis NFTs is 1.3635 plus gas. You don't have enough funds to mint. Please add more funds and try again.",
                            duration: 9000,
                            variant: 'destructive',
                          });
                        } else if (errorMessage.includes('value:     1.515 ETH')) {
                          toast({
                            title: 'Transaction Error',
                            description: "To mint 10 Genesis NFTs is 1.515 plus gas. You don't have enough funds to mint. Please add more funds and try again.",
                            duration: 9000,
                            variant: 'destructive',
                          });
                        } else {
                          toast({
                            title: 'Transaction Error',
                            description: err.reason || '',
                            duration: 9000,
                            variant: 'destructive',
                          });
                        }

                        // Log the error message to the console
                        console.error(errorMessage);
                      }
                    }}
                  >
                    Mint
                  </Web3Button>



                  <br />
                  <label htmlFor="tokenAmount">Number of Genesis:</label>
                  <select
                    id="tokenAmount"
                    value={desiredTokenAmount}
                    onChange={handleInputChange}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <br />
                  <button
                    onClick={handleCheckoutClick}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      color: 'black',
                      minWidth: '150px',
                      minHeight: '43px',
                    }}
                  >
                    Mint with Paper
                  </button>
                </div>
              </div>
            </div>
            {/* <CrossmintPayButton
              clientId="_YOUR_CLIENT_ID_"
              environment="_ENVIRONMENT_"
              mintConfig={{
                type: "erc-721",
                quantity: "_NUMBER_OF_NFTS_",
                totalPrice: "_PRICE_IN_NATIVE_TOKEN_"
                // your custom minting arguments...
              }}
            /> */}
          </div>
        </div>
      </div>
      {/* <PoweredBy /> */}
    </div>
  );
}
