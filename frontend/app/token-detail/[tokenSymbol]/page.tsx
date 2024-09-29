"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { contract_abi } from "@/abi/TokenFactoryAbi";
// import { flowTestnet } from "viem/chains";
import { createClient } from "@/utils/supabase/client";
import { useModal } from "connectkit";
import TokenTrade from "@/components/blocks/token-trade";
import Chart from "@/components/blocks/chart";


export default function TokenDetail() {
  const neoTestnetId = 12227332;
  const [pageToken, setPageToken] = useState<any>();
  const [candlestickData, setCandlestickData] = useState<any[]>([]); // To store the chart data
  const [amount, setAmount] = useState<string>('');

  const { data: tokens } = useReadContract<any, any, Array<any>>({
    abi: contract_abi,
    address: process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS! as `0x${string}`,
    chainId: neoTestnetId,
    functionName: "getAllMemeTokens",
  });
  const params = useParams();
  const tokenSymbol = params.tokenSymbol;
  const router = useRouter();
  const supabase = createClient();
  const { address } = useAccount();
  const { setOpen } = useModal();
  const { data: totalSupply } = useReadContract<any, any, Array<bigint>>({
    abi: contract_abi,
    address: process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS! as `0x${string}`,
    chainId: neoTestnetId,
    functionName: "getTotalSupply",
    args: [pageToken?.tokenAddress],
  });

  const { data: remainingSupply } = useReadContract<any, any, Array<any>>({
    abi: contract_abi,
    address: process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS! as `0x${string}`,
    chainId: neoTestnetId,
    functionName: "getRemainingSupply",
    args: [pageToken?.tokenAddress],
  });

  // Calculate cost
  const { data: calculatedCost } = useReadContract<any, any, Array<any>>({
    abi: contract_abi,
    address: process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS! as `0x${string}`,
    chainId: neoTestnetId,
    functionName: "calculateCost",
    args: [
      totalSupply ?? BigInt(0),
      amount ? BigInt(Math.floor(Number(amount) * 10**18)) : BigInt(0)
    ],
  });


  console.log(pageToken);

  useEffect(() => {
    if (tokens) {
      const token =
        Array.isArray(tokens) &&
        tokens.find((token: any) => token.symbol === tokenSymbol);
      setPageToken(token);
    }

    console.log("pageToken", pageToken);

    const generateCandlestickData = () => {
      const interval = 30 * 60 * 1000; // 30 min in milliseconds
      const now = Date.now();
      const data = [];
    
      for (let i = 0; i < 4; i++) {
        const startTime = now - (i + 1) * interval;
        const endTime = now - i * interval;
    
        let prices = [];
        
        // Simulate fetching price data at small intervals within the current interval
        for (let j = startTime; j < endTime; j += 1000) { // 1 second intervals
          const priceAtInterval = Number(calculatedCost); // Replace with your logic to get price
          prices.push(priceAtInterval);
        }
    
        const open = prices[0]; // Opening price is the first price in the interval
        const close = prices[prices.length - 1]; // Closing price is the last price in the interval
        const high = Math.max(...prices); // Maximum price during the interval
        const low = Math.min(...prices); // Minimum price during the interval
    
        data.push({
          time: Math.floor(startTime / 1000), // Convert to seconds
          open,
          high,
          low,
          close,
        });
      }
    
      // Sort the data by time to ensure proper order
      data.sort((a, b) => a.time - b.time);
    
      setCandlestickData(data);
    };
    
    // Call the function when appropriate
    generateCandlestickData();
    
    

  }, [tokenSymbol, tokens, pageToken, calculatedCost]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 font-mono text-xs">
      <style jsx global>{`
        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
        @keyframes slide {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>

      <Button
        onClick={() => router.back()}
        variant="outline"
        size="sm"
        className="mb-4 h-6 px-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-black dark:border-green-400 dark:text-green-400 dark:hover:bg-green-400 dark:hover:text-black flex items-center"
      >
        <ArrowLeft className="mr-1 h-3 w-3" />
        go back
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-gray-800 border border-green-300 dark:border-green-500">
          <CardHeader>
            <CardTitle className="text-lg text-green-600 dark:text-green-400">
              Token Detail for {pageToken?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Avatar className="w-32 h-32 mx-auto">
              <AvatarImage
                src={pageToken?.tokenImageUrl}
                alt={pageToken?.name}
              />
              <AvatarFallback>{pageToken?.symbol}</AvatarFallback>
            </Avatar>
            <div className="text-[11px] space-y-2">
              <p className="flex justify-between">
                <span className="text-green-600 dark:text-green-400 font-bold">
                  Creator Address:
                </span>
                <span className="text-gray-700 dark:text-gray-300 break-all">
                  {pageToken?.creatorAddress}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-green-600 dark:text-green-400 font-bold">
                  Token Address:
                </span>
                <span className="text-gray-700 dark:text-gray-300 break-all">
                  {pageToken?.tokenAddress}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-green-600 dark:text-green-400 font-bold">
                  Funding Raised:
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {Number(pageToken?.fundingRaised)}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-green-600 dark:text-green-400 font-bold">
                  Token Symbol:
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {pageToken?.symbol}
                </span>
              </p>
              <p className="flex flex-col">
                <span className="text-green-600 dark:text-green-400 font-bold">
                  Description:
                </span>
                <span className="text-gray-700 dark:text-gray-300 mt-1">
                  {pageToken?.description}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-500">
          <CardHeader>
            <CardTitle className="text-lg text-blue-600 dark:text-blue-400">
              Bonding Curve Progress:{" "}
              {Math.max(0, Number(totalSupply) / 10 ** 18 - 200000).toFixed(2)}{" "}
              / 800000 {pageToken?.symbol}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress
              value={
                ((Math.max(0, Number(totalSupply) / 10 ** 18) - 200000) /
                  800000) *
                100
              }
              className="h-2"
            />
            <p className="text-[10px] text-blue-600 dark:text-blue-300">
              When the market cap reaches all the liquidity from the bonding
              curve will be deposited into Uniswap, and the LP tokens will be
              burned. Progression increases as the price goes up.
            </p>
            <div className="mt-4">
              <p className="text-blue-600 dark:text-blue-400 mb-1">
                Remaining Tokens Available for Sale:{" "}
                {Math.max(0, Number(remainingSupply) / 10 ** 18).toFixed(0)}
              </p>
              <Progress
                value={
                  (Math.max(0, Number(remainingSupply) / 10 ** 18) / 800000) *
                  100
                }
                className="h-2 bg-blue-400 dark:bg-blue-500"
              />
            </div>
            <div className="mt-4">
              <TokenTrade token={pageToken} totalSupply={Number(totalSupply)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div id="chart" className="mt-6">
        <h2 className="text-lg text-gray-700 dark:text-gray-300 mb-4">Price History</h2>
        <Chart data={candlestickData} />
      </div>
    </div>
  );
}
