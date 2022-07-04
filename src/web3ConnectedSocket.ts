import type { Web3Provider } from "@ethersproject/providers";
import { ChainId } from "@socket.tech/ll-core/constants/types";
import { ethers } from "ethers";
import { SocketOptions, SocketQuote } from "./types";
import { Socket, SocketTx } from ".";

export interface AddEthereumChainParameters {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
}

export type SocketTxDoneCallback = (tx: SocketTx) => void;
export type TxDoneCallback = (tx: SocketTx, hash: string) => void;
export type ChainSwitchDoneCallback = (chainId: ChainId) => void;

export interface EventCallbacks {
  onTx?: (tx: SocketTx) => SocketTxDoneCallback | void;
  onApprove?: (tx: SocketTx) => TxDoneCallback | void;
  onSend?: (tx: SocketTx) => TxDoneCallback | void;
  onChainSwitch?: (fromChainId: ChainId, toChainId: ChainId) => ChainSwitchDoneCallback | void;
}

/**
 * @inheritdoc
 *
 * The connected socket sdk interfaces directly with wallets
 */
export class Web3ConnectedSocket extends Socket {
  readonly _provider: Web3Provider;

  constructor(options: SocketOptions, provider: Web3Provider) {
    super(options);
    this._provider = provider;
  }

  /**
   * Switch to the desired network
   * @param chainId chain
   */
  private async _switchNetwork(chainId: ChainId) {
    const chain = await this.getChain(chainId);
    try {
      await this._provider.send("wallet_switchEthereumChain", [
        { chainId: ethers.utils.hexlify(chainId) },
      ]);
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          const addPayload: AddEthereumChainParameters = {
            chainId: ethers.utils.hexlify(chainId),
            chainName: chain.name,
            nativeCurrency: {
              name: chain.currency.name,
              symbol: chain.currency.symbol,
              decimals: chain.currency.decimals,
            },
            rpcUrls: chain.rpcs,
            blockExplorerUrls: chain.explorers,
            iconUrls: [chain.icon],
          };
          await this._provider.send("wallet_addEthereumChain", [addPayload]);
        } catch (addError: any) {
          throw new Error(`Failed to switch to ${chainId}: ${addError}`);
        }
      }
    }
  }

  /**
   * Ensure that the provider is on the given chain
   * @param chainId chain
   * @param onChainSwitch Callback for chain switching
   */
  private async _ensureChain(chainId: ChainId, onChainSwitch: EventCallbacks["onChainSwitch"]) {
    const network = await this._provider.getNetwork();
    if (network.chainId !== chainId) {
      const doneCallback = onChainSwitch && onChainSwitch(network.chainId, chainId);
      await this._switchNetwork(chainId);
      if (doneCallback) doneCallback(chainId);
    }
  }

  /**
   * Start executing the quote on the provider
   * @param quote The quote to execute
   * @param callbacks optional callbacks for different states of the execution
   */
  async web3Start(quote: SocketQuote, callbacks: EventCallbacks) {
    const execute = await this.start(quote);
    let next = await execute.next();

    while (!next.done && next.value) {
      const tx = next.value;
      const txDoneCallback = callbacks.onTx && callbacks.onTx(tx);

      const approvalTxData = await tx.getApproveTransaction();
      if (approvalTxData) {
        await this._ensureChain(tx.chainId, callbacks.onChainSwitch);
        const approveCallback = callbacks.onApprove && callbacks.onApprove(tx);
        const approvalTx = await this._provider.getSigner().sendTransaction(approvalTxData);
        if (approveCallback) approveCallback(tx, approvalTx.hash);
        await approvalTx.wait();
      }

      const sendTxData = await tx.getSendTransaction();
      await this._ensureChain(tx.chainId, callbacks.onChainSwitch);
      const sendCallback = callbacks.onSend && callbacks.onSend(tx);
      const sendTx = await this._provider.getSigner().sendTransaction(sendTxData);
      if (sendCallback) sendCallback(tx, sendTx.hash);
      await sendTx.wait();

      next = await execute.next(sendTx.hash);
      if (txDoneCallback) txDoneCallback(tx);
    }
  }
}
