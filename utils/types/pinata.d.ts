declare module "pinata-web3" {
  export interface PinataConfig {
    pinataJwt: string;
    pinataGateway: string;
  }

  export interface PinataMetadata {
    name: string;
    keyvalues?: {
      [key: string]: string;
    };
  }

  export interface PinataResponse {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
  }

  export interface PinListResponse {
    count: number;
    rows: Array<{
      ipfs_pin_hash: string;
      size: number;
      date_pinned: string;
      metadata: PinataMetadata;
    }>;
  }

  export class PinataSDK {
    constructor(config: PinataConfig);

    pinList(options?: {
      metadata?: {
        keyvalues?: {
          [key: string]: {
            value: string;
            op: string;
          };
        };
      };
    }): Promise<PinListResponse>;

    pinFileToIPFS(
      file: FormData,
      options?: {
        pinataMetadata?: PinataMetadata;
      }
    ): Promise<PinataResponse>;

    pinJSONToIPFS(
      json: any,
      options?: {
        pinataMetadata?: PinataMetadata;
      }
    ): Promise<PinataResponse>;
  }
}
