import { Route } from "./client";
import { QuotePreferences } from "./client/models/QuoteRequest";
import { Path } from "./path";

/**
 * The parameters for a quote request
 */
export interface QuoteParams {
  /**
   * The path desired
   */
  path: Path;
  /**
   * Amount of the quote
   */
  amount: string;
  /**
   * User address
   */
  address: string;
}

/**
 * Quote parameters and the retrieved route
 */
export interface SocketQuote extends QuoteParams {
  /**
   * The route retrieved for the quote
   */
  route: Route;
}

/** Sdk options */
export interface SocketOptions {
  /**
   * The socket api key
   */
  apiKey: string;
  /**
   * How often in ms to poll for status updates when checking transactions
   */
  statusCheckInterval?: number;
  /**
   * The preferences used when retrieving quotes from the api
   */
  defaultQuotePreferences?: QuotePreferences;
}

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
