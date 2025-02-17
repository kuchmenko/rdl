"use client";
import { Loader2, Radio } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import Head from "next/head";
import {
  OnchainRiddleContract,
  CONTRACT_ADDRESS,
  ONCHAIN_RIDDLE_CONTRACT_ABI,
  publicClient,
} from "../lib/ethereum";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { decodeEventLog } from "viem";

/**
 * Submits an answer to the onchain riddle contract
 * Listens for the AnswerAttempt event and checks if the answer is correct
 */
const useSubmitAnswerMutation = () => {
  const account = useAccount();
  const writeContract = useWriteContract();

  return useMutation({
    mutationKey: ["submitAnswer"],
    mutationFn: async (answer: string) => {
      console.log("Watching AnswerAttempt event...", account.address);
      const answerAttemptEventAbi = ONCHAIN_RIDDLE_CONTRACT_ABI.filter(
        (item) => item.type === "event" && item.name === "AnswerAttempt",
      );
      const txHash = await writeContract.writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: ONCHAIN_RIDDLE_CONTRACT_ABI,
        functionName: "submitAnswer",
        args: [answer],
      });
      console.log("Transaction submitted:", txHash);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      console.log("Transaction", receipt);
      const answerAttemptEvents = receipt.logs
        .map((log) => {
          try {
            return decodeEventLog({
              abi: answerAttemptEventAbi,
              ...log,
            });
          } catch {
            return null;
          }
        })
        .filter((parsed) => parsed !== null);

      return answerAttemptEvents.some((event) => {
        const { user, correct } = event.args as unknown as {
          user: string;
          correct: boolean;
        };
        if (!user || !correct) return false;
        return user === account.address && correct;
      });
    },
    onSuccess: (data, variables, context) => {
      console.log("Success:", data, variables, context);
    },
    onError: (error, variables, context) => {
      console.error("Error:", error, variables, context);
    },
  });
};

const Home = () => {
  const { connectors, connect } = useConnect();
  const account = useAccount();
  const { toast } = useToast();
  const riddleQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ONCHAIN_RIDDLE_CONTRACT_ABI,
    functionName: "riddle",
    args: [],
  });
  const riddleData = riddleQuery.data as string | undefined;
  const isActiveQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ONCHAIN_RIDDLE_CONTRACT_ABI,
    functionName: "isActive",
    args: [],
  });
  const disconnect = useDisconnect();
  const submitAnswerMutation = useSubmitAnswerMutation();

  const [answer, setAnswer] = useState<string>("");
  const [eventLogs, setEventLogs] = useState<string[]>([]);
  const isActive = isActiveQuery.data && !isActiveQuery.isPending;
  const formattedCurrentAccount = useMemo(
    () =>
      account.address
        ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
        : "",
    [account.address],
  );

  const handleLogin = useCallback(async () => {
    connect({
      connector: connectors[0],
    });
  }, [connect, connectors]);

  const handleSubmit = useCallback(async () => {
    if (!answer || !isActive || !account.address) return;
    try {
      const isCorrect = await submitAnswerMutation.mutateAsync(answer);
      toast({
        title: "Answer submitted",
        description: isCorrect
          ? "Oh, you got it right!"
          : "Sorry, that's not the right answer.",
      });
      setAnswer("");
    } catch (error) {
      toast({
        title: "Oops!",
        description: "Something went wrong. Check console for more details.",
      });
      console.error("Error submitting answer:", error);
    }
  }, [account.address, answer, isActive, submitAnswerMutation, toast]);

  const handleLogout = useCallback(async () => {
    disconnect.disconnect();
  }, [disconnect]);

  // Set up riddle contract event watchers
  useEffect(() => {
    const unwatchRiddleSet = OnchainRiddleContract.watchEvent.RiddleSet({
      onLogs: (logs) => {
        console.log("Riddle set logs", logs);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logs.forEach(async (log: any) => {
          const results = await Promise.all([
            riddleQuery.refetch(),
            isActiveQuery.refetch(),
          ]);
          console.log("Results", results);
          setEventLogs((prev) => [
            ...prev,
            `RiddleSet: ${JSON.stringify(log.args)}`,
          ]);
        });
      },
    });

    const unwatchAnswerAttempt = OnchainRiddleContract.watchEvent.AnswerAttempt(
      {},
      {
        onError: (error) => {
          console.error("Error watching AnswerAttempt event:", error);
        },
        onLogs: (logs) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          logs.forEach(async (log: any) => {
            setEventLogs((prev) => [
              ...prev,
              `AnswerAttempt: ${JSON.stringify(log.args)}`,
            ]);
            if (log.args.correct) {
              await isActiveQuery.refetch();
            }
          });
        },
      },
    );

    return () => {
      unwatchAnswerAttempt();
      unwatchRiddleSet();
    };

    // I don't really want to listen to all deps here and recreate event watchers on every change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.address]);

  return (
    <>
      <Head>
        <title>Onchain Riddle</title>
      </Head>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <h1 className="text-2xl font-bold">Onchain Riddle</h1>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex-1" />
        <div>
          {account.address ? (
            <div className="flex items-center gap-2">
              <Jazzicon
                diameter={20}
                seed={jsNumberForAddress(account.address)}
              />
              <p className="text-lg">{formattedCurrentAccount}</p>
              <Button onClick={handleLogout}>Disconnect</Button>
            </div>
          ) : (
            <Button onClick={handleLogin}>Connect</Button>
          )}
        </div>
      </header>
      <main className="container mx-auto p-4">
        <Toaster />
        <div className="mb-4 flex gap-4 items-center">
          {isActiveQuery.data ? (
            <Badge className="gap-2">
              <Radio size={16} className="text-green-500 animate-pulse" />
              Active
            </Badge>
          ) : (
            <Badge className="gap-2">Solved</Badge>
          )}
          <p className="text-xl">{riddleData}</p>
        </div>
        <div className="flex-1 flex-col items-end">
          <div className="flex-1 w-full mb-4">
            <Input
              type="text"
              placeholder="Your answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={!isActive}
              className="flex-1"
            />
          </div>
          <div>
            <Button
              onClick={handleSubmit}
              disabled={
                !isActive || !account.address || submitAnswerMutation.isPending
              }
            >
              {submitAnswerMutation.isPending && (
                <Loader2 className="animate-spin" />
              )}
              Submit Answer
            </Button>
          </div>
        </div>
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Event Logs</h2>
          <ul className="list-disc pl-5">
            {eventLogs.map((log, idx) => (
              <li key={idx} className="text-xs">
                {log}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
};

export default Home;
