/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "./common";

export interface FamileInvitesInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "acceptInvite"
      | "cancelInvite"
      | "createInvite"
      | "giftEditors"
      | "giftOwners"
      | "initialize"
      | "invites"
      | "isEditor"
      | "owner"
      | "pause"
      | "paused"
      | "removeEditor"
      | "renounceOwnership"
      | "setGiftOwner"
      | "transferOwnership"
      | "unpause"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "EditorAdded"
      | "EditorRemoved"
      | "GiftOwnerSet"
      | "Initialized"
      | "InviteAccepted"
      | "InviteCancelled"
      | "InviteCreated"
      | "OwnershipTransferred"
      | "Paused"
      | "Unpaused"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "acceptInvite",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "cancelInvite",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "createInvite",
    values: [AddressLike, string, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "giftEditors",
    values: [string, AddressLike]
  ): string;
  encodeFunctionData(functionFragment: "giftOwners", values: [string]): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "invites", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "isEditor",
    values: [string, AddressLike]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(functionFragment: "pause", values?: undefined): string;
  encodeFunctionData(functionFragment: "paused", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "removeEditor",
    values: [string, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setGiftOwner",
    values: [string, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [AddressLike]
  ): string;
  encodeFunctionData(functionFragment: "unpause", values?: undefined): string;

  decodeFunctionResult(
    functionFragment: "acceptInvite",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "cancelInvite",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createInvite",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "giftEditors",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "giftOwners", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "invites", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "isEditor", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "pause", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "paused", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "removeEditor",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setGiftOwner",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "unpause", data: BytesLike): Result;
}

export namespace EditorAddedEvent {
  export type InputTuple = [giftId: string, editor: AddressLike];
  export type OutputTuple = [giftId: string, editor: string];
  export interface OutputObject {
    giftId: string;
    editor: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace EditorRemovedEvent {
  export type InputTuple = [giftId: string, editor: AddressLike];
  export type OutputTuple = [giftId: string, editor: string];
  export interface OutputObject {
    giftId: string;
    editor: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace GiftOwnerSetEvent {
  export type InputTuple = [giftId: string, owner: AddressLike];
  export type OutputTuple = [giftId: string, owner: string];
  export interface OutputObject {
    giftId: string;
    owner: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace InitializedEvent {
  export type InputTuple = [version: BigNumberish];
  export type OutputTuple = [version: bigint];
  export interface OutputObject {
    version: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace InviteAcceptedEvent {
  export type InputTuple = [inviteId: BytesLike, by: AddressLike];
  export type OutputTuple = [inviteId: string, by: string];
  export interface OutputObject {
    inviteId: string;
    by: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace InviteCancelledEvent {
  export type InputTuple = [inviteId: BytesLike, by: AddressLike];
  export type OutputTuple = [inviteId: string, by: string];
  export interface OutputObject {
    inviteId: string;
    by: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace InviteCreatedEvent {
  export type InputTuple = [
    inviteId: BytesLike,
    from: AddressLike,
    to: AddressLike,
    giftId: string,
    role: string,
    expiresAt: BigNumberish
  ];
  export type OutputTuple = [
    inviteId: string,
    from: string,
    to: string,
    giftId: string,
    role: string,
    expiresAt: bigint
  ];
  export interface OutputObject {
    inviteId: string;
    from: string;
    to: string;
    giftId: string;
    role: string;
    expiresAt: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace OwnershipTransferredEvent {
  export type InputTuple = [previousOwner: AddressLike, newOwner: AddressLike];
  export type OutputTuple = [previousOwner: string, newOwner: string];
  export interface OutputObject {
    previousOwner: string;
    newOwner: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace PausedEvent {
  export type InputTuple = [account: AddressLike];
  export type OutputTuple = [account: string];
  export interface OutputObject {
    account: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace UnpausedEvent {
  export type InputTuple = [account: AddressLike];
  export type OutputTuple = [account: string];
  export interface OutputObject {
    account: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface FamileInvites extends BaseContract {
  connect(runner?: ContractRunner | null): FamileInvites;
  waitForDeployment(): Promise<this>;

  interface: FamileInvitesInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  acceptInvite: TypedContractMethod<
    [inviteId: BytesLike],
    [void],
    "nonpayable"
  >;

  cancelInvite: TypedContractMethod<
    [inviteId: BytesLike],
    [void],
    "nonpayable"
  >;

  createInvite: TypedContractMethod<
    [to: AddressLike, giftId: string, role: string, expiresIn: BigNumberish],
    [void],
    "nonpayable"
  >;

  giftEditors: TypedContractMethod<
    [arg0: string, arg1: AddressLike],
    [boolean],
    "view"
  >;

  giftOwners: TypedContractMethod<[arg0: string], [string], "view">;

  initialize: TypedContractMethod<[], [void], "nonpayable">;

  invites: TypedContractMethod<
    [arg0: BytesLike],
    [
      [string, string, string, string, bigint, bigint, boolean, boolean] & {
        from: string;
        to: string;
        giftId: string;
        role: string;
        createdAt: bigint;
        expiresAt: bigint;
        accepted: boolean;
        cancelled: boolean;
      }
    ],
    "view"
  >;

  isEditor: TypedContractMethod<
    [giftId: string, editor: AddressLike],
    [boolean],
    "view"
  >;

  owner: TypedContractMethod<[], [string], "view">;

  pause: TypedContractMethod<[], [void], "nonpayable">;

  paused: TypedContractMethod<[], [boolean], "view">;

  removeEditor: TypedContractMethod<
    [giftId: string, editor: AddressLike],
    [void],
    "nonpayable"
  >;

  renounceOwnership: TypedContractMethod<[], [void], "nonpayable">;

  setGiftOwner: TypedContractMethod<
    [giftId: string, owner: AddressLike],
    [void],
    "nonpayable"
  >;

  transferOwnership: TypedContractMethod<
    [newOwner: AddressLike],
    [void],
    "nonpayable"
  >;

  unpause: TypedContractMethod<[], [void], "nonpayable">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "acceptInvite"
  ): TypedContractMethod<[inviteId: BytesLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "cancelInvite"
  ): TypedContractMethod<[inviteId: BytesLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "createInvite"
  ): TypedContractMethod<
    [to: AddressLike, giftId: string, role: string, expiresIn: BigNumberish],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "giftEditors"
  ): TypedContractMethod<[arg0: string, arg1: AddressLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "giftOwners"
  ): TypedContractMethod<[arg0: string], [string], "view">;
  getFunction(
    nameOrSignature: "initialize"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "invites"
  ): TypedContractMethod<
    [arg0: BytesLike],
    [
      [string, string, string, string, bigint, bigint, boolean, boolean] & {
        from: string;
        to: string;
        giftId: string;
        role: string;
        createdAt: bigint;
        expiresAt: bigint;
        accepted: boolean;
        cancelled: boolean;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "isEditor"
  ): TypedContractMethod<
    [giftId: string, editor: AddressLike],
    [boolean],
    "view"
  >;
  getFunction(
    nameOrSignature: "owner"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "pause"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "paused"
  ): TypedContractMethod<[], [boolean], "view">;
  getFunction(
    nameOrSignature: "removeEditor"
  ): TypedContractMethod<
    [giftId: string, editor: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "renounceOwnership"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "setGiftOwner"
  ): TypedContractMethod<
    [giftId: string, owner: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "transferOwnership"
  ): TypedContractMethod<[newOwner: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "unpause"
  ): TypedContractMethod<[], [void], "nonpayable">;

  getEvent(
    key: "EditorAdded"
  ): TypedContractEvent<
    EditorAddedEvent.InputTuple,
    EditorAddedEvent.OutputTuple,
    EditorAddedEvent.OutputObject
  >;
  getEvent(
    key: "EditorRemoved"
  ): TypedContractEvent<
    EditorRemovedEvent.InputTuple,
    EditorRemovedEvent.OutputTuple,
    EditorRemovedEvent.OutputObject
  >;
  getEvent(
    key: "GiftOwnerSet"
  ): TypedContractEvent<
    GiftOwnerSetEvent.InputTuple,
    GiftOwnerSetEvent.OutputTuple,
    GiftOwnerSetEvent.OutputObject
  >;
  getEvent(
    key: "Initialized"
  ): TypedContractEvent<
    InitializedEvent.InputTuple,
    InitializedEvent.OutputTuple,
    InitializedEvent.OutputObject
  >;
  getEvent(
    key: "InviteAccepted"
  ): TypedContractEvent<
    InviteAcceptedEvent.InputTuple,
    InviteAcceptedEvent.OutputTuple,
    InviteAcceptedEvent.OutputObject
  >;
  getEvent(
    key: "InviteCancelled"
  ): TypedContractEvent<
    InviteCancelledEvent.InputTuple,
    InviteCancelledEvent.OutputTuple,
    InviteCancelledEvent.OutputObject
  >;
  getEvent(
    key: "InviteCreated"
  ): TypedContractEvent<
    InviteCreatedEvent.InputTuple,
    InviteCreatedEvent.OutputTuple,
    InviteCreatedEvent.OutputObject
  >;
  getEvent(
    key: "OwnershipTransferred"
  ): TypedContractEvent<
    OwnershipTransferredEvent.InputTuple,
    OwnershipTransferredEvent.OutputTuple,
    OwnershipTransferredEvent.OutputObject
  >;
  getEvent(
    key: "Paused"
  ): TypedContractEvent<
    PausedEvent.InputTuple,
    PausedEvent.OutputTuple,
    PausedEvent.OutputObject
  >;
  getEvent(
    key: "Unpaused"
  ): TypedContractEvent<
    UnpausedEvent.InputTuple,
    UnpausedEvent.OutputTuple,
    UnpausedEvent.OutputObject
  >;

  filters: {
    "EditorAdded(string,address)": TypedContractEvent<
      EditorAddedEvent.InputTuple,
      EditorAddedEvent.OutputTuple,
      EditorAddedEvent.OutputObject
    >;
    EditorAdded: TypedContractEvent<
      EditorAddedEvent.InputTuple,
      EditorAddedEvent.OutputTuple,
      EditorAddedEvent.OutputObject
    >;

    "EditorRemoved(string,address)": TypedContractEvent<
      EditorRemovedEvent.InputTuple,
      EditorRemovedEvent.OutputTuple,
      EditorRemovedEvent.OutputObject
    >;
    EditorRemoved: TypedContractEvent<
      EditorRemovedEvent.InputTuple,
      EditorRemovedEvent.OutputTuple,
      EditorRemovedEvent.OutputObject
    >;

    "GiftOwnerSet(string,address)": TypedContractEvent<
      GiftOwnerSetEvent.InputTuple,
      GiftOwnerSetEvent.OutputTuple,
      GiftOwnerSetEvent.OutputObject
    >;
    GiftOwnerSet: TypedContractEvent<
      GiftOwnerSetEvent.InputTuple,
      GiftOwnerSetEvent.OutputTuple,
      GiftOwnerSetEvent.OutputObject
    >;

    "Initialized(uint8)": TypedContractEvent<
      InitializedEvent.InputTuple,
      InitializedEvent.OutputTuple,
      InitializedEvent.OutputObject
    >;
    Initialized: TypedContractEvent<
      InitializedEvent.InputTuple,
      InitializedEvent.OutputTuple,
      InitializedEvent.OutputObject
    >;

    "InviteAccepted(bytes32,address)": TypedContractEvent<
      InviteAcceptedEvent.InputTuple,
      InviteAcceptedEvent.OutputTuple,
      InviteAcceptedEvent.OutputObject
    >;
    InviteAccepted: TypedContractEvent<
      InviteAcceptedEvent.InputTuple,
      InviteAcceptedEvent.OutputTuple,
      InviteAcceptedEvent.OutputObject
    >;

    "InviteCancelled(bytes32,address)": TypedContractEvent<
      InviteCancelledEvent.InputTuple,
      InviteCancelledEvent.OutputTuple,
      InviteCancelledEvent.OutputObject
    >;
    InviteCancelled: TypedContractEvent<
      InviteCancelledEvent.InputTuple,
      InviteCancelledEvent.OutputTuple,
      InviteCancelledEvent.OutputObject
    >;

    "InviteCreated(bytes32,address,address,string,string,uint256)": TypedContractEvent<
      InviteCreatedEvent.InputTuple,
      InviteCreatedEvent.OutputTuple,
      InviteCreatedEvent.OutputObject
    >;
    InviteCreated: TypedContractEvent<
      InviteCreatedEvent.InputTuple,
      InviteCreatedEvent.OutputTuple,
      InviteCreatedEvent.OutputObject
    >;

    "OwnershipTransferred(address,address)": TypedContractEvent<
      OwnershipTransferredEvent.InputTuple,
      OwnershipTransferredEvent.OutputTuple,
      OwnershipTransferredEvent.OutputObject
    >;
    OwnershipTransferred: TypedContractEvent<
      OwnershipTransferredEvent.InputTuple,
      OwnershipTransferredEvent.OutputTuple,
      OwnershipTransferredEvent.OutputObject
    >;

    "Paused(address)": TypedContractEvent<
      PausedEvent.InputTuple,
      PausedEvent.OutputTuple,
      PausedEvent.OutputObject
    >;
    Paused: TypedContractEvent<
      PausedEvent.InputTuple,
      PausedEvent.OutputTuple,
      PausedEvent.OutputObject
    >;

    "Unpaused(address)": TypedContractEvent<
      UnpausedEvent.InputTuple,
      UnpausedEvent.OutputTuple,
      UnpausedEvent.OutputObject
    >;
    Unpaused: TypedContractEvent<
      UnpausedEvent.InputTuple,
      UnpausedEvent.OutputTuple,
      UnpausedEvent.OutputObject
    >;
  };
}
