import React, { useMemo, useState } from 'react';
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
import { CrossmintPayButton } from '@crossmint/client-sdk-react-ui';

const urlParams = new URL(window.location.toString()).searchParams;
const contractAddress = urlParams.get('contract') || contractConst || '';
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
  const claimIneligibilityReasons = useClaimIneligibilityReasons(
    contractQuery.contract,
    {
      quantity,
      walletAddress: address || '',
    }
  );
  const unclaimedSupply = useUnclaimedNFTSupply(contractQuery.contract);
  const claimedSupply = useClaimedNFTSupply(contractQuery.contract);
  const { data: firstNft, isLoading: firstNftLoading } = useNFT(
    contractQuery.contract,
    0
  );

  const numberClaimed = useMemo(() => {
    return BigNumber.from(claimedSupply.data || 0).toString();
  }, [claimedSupply]);

  const { contract: totalSupplyContract } = useContract(
    '0x5f8eD33d9eC6B28DAafa9A1f9faDff3D9f94e5fB'
  );
  const { data: numberTotal, isLoading: totalSupplyLoading } = useContractRead(
    totalSupplyContract,
    'totalSupply',
    []
  );

  const priceToMint = useMemo(() => {
    const bnPrice = BigNumber.from(
      activeClaimCondition.data?.currencyMetadata.value || 0
    );
    return `${utils.formatUnits(
      bnPrice.mul(quantity).toString(),
      activeClaimCondition.data?.currencyMetadata.decimals || 18
    )} ${activeClaimCondition.data?.currencyMetadata.symbol}`;
  }, [
    activeClaimCondition.data?.currencyMetadata.decimals,
    activeClaimCondition.data?.currencyMetadata.symbol,
    activeClaimCondition.data?.currencyMetadata.value,
    quantity,
  ]);

  const maxClaimable = useMemo(() => {
    let bnMaxClaimable;
    try {
      bnMaxClaimable = BigNumber.from(
        activeClaimCondition.data?.maxClaimableSupply || 0
      );
    } catch (e) {
      bnMaxClaimable = BigNumber.from(1_000_000);
    }

    let perTransactionClaimable;
    try {
      perTransactionClaimable = BigNumber.from(
        activeClaimCondition.data?.maxClaimablePerWallet || 0
      );
    } catch (e) {
      perTransactionClaimable = BigNumber.from(1_000_000);
    }

    if (perTransactionClaimable.lte(bnMaxClaimable)) {
      bnMaxClaimable = perTransactionClaimable;
    }

    const snapshotClaimable = claimerProofs.data?.maxClaimable;

    if (snapshotClaimable) {
      if (snapshotClaimable === '0') {
        // allowed unlimited for the snapshot
        bnMaxClaimable = BigNumber.from(1_000_000);
      } else {
        try {
          bnMaxClaimable = BigNumber.from(snapshotClaimable);
        } catch (e) {
          // fall back to default case
        }
      }
    }

    const maxAvailable = BigNumber.from(unclaimedSupply.data || 0);

    let max;
    if (maxAvailable.lt(bnMaxClaimable)) {
      max = maxAvailable;
    } else {
      max = bnMaxClaimable;
    }

    if (max.gte(1_000_000)) {
      return 1_000_000;
    }
    return max.toNumber();
  }, [
    claimerProofs.data?.maxClaimable,
    unclaimedSupply.data,
    activeClaimCondition.data?.maxClaimableSupply,
    activeClaimCondition.data?.maxClaimablePerWallet,
  ]);

  const isSoldOut = useMemo(() => {
    try {
      return (
        (activeClaimCondition.isSuccess &&
          BigNumber.from(
            activeClaimCondition.data?.availableSupply || 0
          ).lte(0)) ||
        numberClaimed === numberTotal
      );
    } catch (e) {
      return false;
    }
  }, [
    activeClaimCondition.data?.availableSupply,
    activeClaimCondition.isSuccess,
    numberClaimed,
    numberTotal,
  ]);

  const canClaim = useMemo(() => {
    return (
      activeClaimCondition.isSuccess &&
      claimIneligibilityReasons.isSuccess &&
      claimIneligibilityReasons.data?.length === 0 &&
      !isSoldOut
    );
  }, [
    activeClaimCondition.isSuccess,
    claimIneligibilityReasons.data?.length,
    claimIneligibilityReasons.isSuccess,
    isSoldOut,
  ]);

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

  const buttonLoading = useMemo(
    () => isLoading || claimIneligibilityReasons.isLoading,
    [claimIneligibilityReasons.isLoading, isLoading]
  );

  const buttonText = useMemo(() => {
    if (isSoldOut) {
      return 'Sold Out';
    }

    if (canClaim) {
      const pricePerToken = BigNumber.from(
        activeClaimCondition.data?.currencyMetadata.value || 0
      );
      if (pricePerToken.eq(0)) {
        return 'Mint (Free)';
      }
      return `Mint (${priceToMint})`;
    }
    if (claimIneligibilityReasons.data?.length) {
      return parseIneligibility(
        claimIneligibilityReasons.data,
        quantity
      );
    }
    if (buttonLoading) {
      return 'Checking eligibility...';
    }

    return 'Minting not available';
  }, [
    isSoldOut,
    canClaim,
    claimIneligibilityReasons.data,
    buttonLoading,
    activeClaimCondition.data?.currencyMetadata.value,
    priceToMint,
    quantity,
  ]);

  const dropNotReady = useMemo(
    () =>
      claimConditions.data?.length === 0 ||
      claimConditions.data?.every(
        (cc) => cc.maxClaimableSupply === '0'
      ),
    [claimConditions.data]
  );

  const dropStartingSoon = useMemo(
    () =>
      (claimConditions.data &&
        claimConditions.data.length > 0 &&
        activeClaimCondition.isError) ||
      (activeClaimCondition.data &&
        activeClaimCondition.data.startTime > new Date()),
    [
      activeClaimCondition.data,
      activeClaimCondition.isError,
      claimConditions.data,
    ]
  );

  if (!contractAddress) {
    return (
      <div className="flex h-full items-center justify-center">
        No contract address provided
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen">

      <div className="grid h-screen grid-cols-1 lg:grid-cols-12">
        <div className="hidden h-full w-full items-center justify-center lg:col-span-5 lg:flex lg:px-12">
          <HeadingImage
            src="https://bafybeifrdu43ddcecl5a4ipjrkrpfrperstxcpiuoicucxffp3l76ry7qy.gateway.ipfscdn.io/chg.gif"
            isLoading={isLoading}
          />
        </div>
        <div className="col-span-1 flex h-full w-full items-center justify-center lg:col-span-7">
          <div className="flex w-full max-w-xl flex-col gap-4 rounded-xl p-12 lg:border lg:border-gray-400 lg:dark:border-gray-800">
            <div className="mt-8 flex w-full xs:mb-8 xs:mt-0 lg:hidden">
              <HeadingImage
                src="https://bafybeifrdu43ddcecl5a4ipjrkrpfrperstxcpiuoicucxffp3l76ry7qy.gateway.ipfscdn.io/chg.gif"
                isLoading={isLoading}
              />
            </div>

            <div className="flex flex-col gap-2 xs:gap-4">
              {isLoading ? (
                <div
                  role="status"
                  className="animate-pulse space-y-8 md:flex md:items-center md:space-x-8 md:space-y-0"
                >
                  <div className="w-full">
                    <div className="h-10 w-24 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>
              ) : (
                <p>
                  <span className="text-lg font-bold tracking-wider text-gray-500 xs:text-xl lg:text-2xl">
                    {numberTotal}
                  </span>
                  <span className="text-lg font-bold tracking-wider xs:text-xl lg:text-2xl">
                    / {"1998"} Minted!
                  </span>
                </p>
              )}
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
                    action={(contract) => {
                      contract.call(
                        'mint',
                        [address, desiredTokenAmount],
                        {
                          value: ethers.utils.parseEther(
                            (0.101 * desiredTokenAmount).toString()
                          ),
                        }
                      );
                    }}
                    onSuccess={() => {
                      toast({
                        title: 'Successfully minted',
                        description:
                          '1 Crypto Homie Genesis and 3 Crypto Homies Commons have been transferred to your wallet!',
                        duration: 5000,
                        className: 'bg-green-500',
                      });
                    }}
                  >
                    mint
                  </Web3Button>
                  <label>
                    Number of Genesis:
                    <input
                      type="number"
                      value={desiredTokenAmount}
                      min="1"
                      max="10"
                      onChange={handleInputChange}
                    />
                  </label>
                  <button onClick={handleCheckoutClick} style={{ backgroundColor: 'white', borderRadius: '8px', color: 'black', minWidth: '150px', minHeight: '43px' }}>
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
