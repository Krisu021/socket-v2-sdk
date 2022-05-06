import type { ApprovalData } from "./ApprovalData";
import { ChainId } from "./ChainId";
import { UserTxType } from "./UserTxType";

export type NextTxResponse = {
  /**
   * Type of user transaction.
   */
  userTxType: UserTxType;
  /**
   * Address to which transaction has to be sent.
   */
  txTarget: string;
  /**
   * Id of chain where transaction has to be sent.
   */
  chainId: ChainId;
  /**
   * Calldata for transaction.
   */
  txData: string;
  /**
   * Type of transaction.
   */
  txType: ChainId;
  /**
   * Id of Active Route.
   */
  activeRouteId: number;
  /**
   * Native token amount to be sent with transaction.
   */
  value: string;
  /**
   * Index of transaction in Active Route. Index of the object in the userTxs array.
   */
  userTxIndex: number;
  /**
   * Total number of transactions in Active Route.
   */
  totalUserTx: number;
  approvalData: ApprovalData;
};
