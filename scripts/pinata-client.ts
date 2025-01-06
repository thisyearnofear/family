import axios, { AxiosRequestConfig } from "axios";
import FormData from "form-data";

interface PinataMetadata {
  name?: string;
  keyvalues?: Record<string, any>;
}

interface PinataOptions {
  pinataMetadata?: PinataMetadata;
}

interface PinataResponse {
  IpfsHash: string;
  PinSize?: number;
  Timestamp?: string;
}

interface PinListResponse {
  rows: Array<{
    ipfs_pin_hash: string;
    metadata?: PinataMetadata;
  }>;
  count: number;
}

interface PinataAuth {
  jwt?: string;
  apiKey?: string;
  apiSecret?: string;
  gateway: string;
}

export class PinataClient {
  private auth: PinataAuth;
  private baseURL: string;

  constructor(authOrJwt: PinataAuth | string, gateway?: string) {
    if (typeof authOrJwt === "string") {
      this.auth = {
        jwt: authOrJwt,
        gateway: gateway!,
      };
    } else {
      this.auth = authOrJwt;
    }
    this.baseURL = "https://api.pinata.cloud";
  }

  private getAuthHeaders(): Record<string, string> {
    if (this.auth.jwt) {
      return { Authorization: `Bearer ${this.auth.jwt}` };
    }
    return {
      pinata_api_key: this.auth.apiKey!,
      pinata_secret_api_key: this.auth.apiSecret!,
    };
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data: any = null,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        ...this.getAuthHeaders(),
        ...headers,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error making request to ${endpoint}:`, error.message);
        if (axios.isAxiosError(error) && error.response) {
          console.error("Response data:", error.response.data);
        }
      } else {
        console.error(`Error making request to ${endpoint}:`, String(error));
      }
      throw error;
    }
  }

  async pinFileToIPFS(
    file: any,
    options: PinataOptions = {}
  ): Promise<PinataResponse> {
    const isBrowser = typeof window !== "undefined";
    const formData = new FormData();

    if (isBrowser) {
      // Browser environment - file is a File object
      formData.append("file", file, file.name);
    } else {
      // Node.js environment
      if (typeof file.pipe === "function") {
        // It's a readable stream
        formData.append("file", file);
      } else if (file.buffer) {
        // It's a NodeFile or similar
        formData.append("file", file.buffer, file.name);
      } else {
        // It's something else (probably a buffer or path)
        formData.append("file", file);
      }
    }

    if (options.pinataMetadata) {
      formData.append("pinataMetadata", JSON.stringify(options.pinataMetadata));
    }

    // In Node.js, get headers from form-data
    const headers = !isBrowser ? (formData as any).getHeaders?.() || {} : {};

    // Make the request
    return this.request<PinataResponse>(
      "POST",
      "/pinning/pinFileToIPFS",
      formData,
      headers
    );
  }

  async pinJSONToIPFS(json: any): Promise<PinataResponse> {
    const data = {
      pinataContent: json,
      pinataMetadata: json.pinataMetadata,
    };
    return this.request<PinataResponse>(
      "POST",
      "/pinning/pinJSONToIPFS",
      data,
      {
        "Content-Type": "application/json",
      }
    );
  }

  async pinList(filters: Record<string, any> = {}): Promise<PinListResponse> {
    const queryParams = new URLSearchParams();

    if (filters.metadata?.keyvalues) {
      queryParams.append(
        "metadata",
        JSON.stringify({ keyvalues: filters.metadata.keyvalues })
      );
    }

    const queryString = queryParams.toString();
    return this.request<PinListResponse>(
      "GET",
      `/data/pinList${queryString ? `?${queryString}` : ""}`
    );
  }

  async unpin(hashToUnpin: string): Promise<void> {
    return this.request<void>("DELETE", `/pinning/unpin/${hashToUnpin}`);
  }

  getGatewayURL(ipfsHash: string): string {
    return `${this.auth.gateway}/ipfs/${ipfsHash}`;
  }
}
