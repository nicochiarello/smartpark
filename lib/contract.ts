import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0xDB7A7c1113b8F9C8b1430117B0c133eFbaF6D511";

export const CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "reservationId",
        type: "uint256",
      },
    ],
    name: "cancelReservation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "spaceId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "occupied",
        type: "bool",
      },
    ],
    name: "OccupancyChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "reservationId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "ReservationCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "reservationId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "spaceId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "date",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "timeFrom",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "timeTo",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalPaid",
        type: "uint256",
      },
    ],
    name: "ReservationCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "spaceId",
        type: "string",
      },
      {
        internalType: "string",
        name: "date",
        type: "string",
      },
      {
        internalType: "string",
        name: "timeFrom",
        type: "string",
      },
      {
        internalType: "string",
        name: "timeTo",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "durationHours",
        type: "uint256",
      },
    ],
    name: "reserve",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "spaceId",
        type: "string",
      },
      {
        internalType: "bool",
        name: "occupied",
        type: "bool",
      },
    ],
    name: "setOccupied",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "spaceId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
    ],
    name: "SpaceCreated",
    type: "event",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getMyReservationIds",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "reservationId",
        type: "uint256",
      },
    ],
    name: "getReservation",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "spaceId",
            type: "string",
          },
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
          {
            internalType: "string",
            name: "date",
            type: "string",
          },
          {
            internalType: "string",
            name: "timeFrom",
            type: "string",
          },
          {
            internalType: "string",
            name: "timeTo",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "totalPaid",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "active",
            type: "bool",
          },
        ],
        internalType: "struct SmartPark.Reservation",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSpaceIds",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "spaceId",
        type: "string",
      },
      {
        internalType: "string",
        name: "date",
        type: "string",
      },
      {
        internalType: "string",
        name: "timeFrom",
        type: "string",
      },
    ],
    name: "isSlotTaken",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "reservationCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "reservations",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "spaceId",
        type: "string",
      },
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "string",
        name: "date",
        type: "string",
      },
      {
        internalType: "string",
        name: "timeFrom",
        type: "string",
      },
      {
        internalType: "string",
        name: "timeTo",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "totalPaid",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "active",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    name: "slotTaken",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "spaceIds",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    name: "spaces",
    outputs: [
      {
        internalType: "string",
        name: "id",
        type: "string",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "location",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "pricePerHour",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isOccupied",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "exists",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "userReservations",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export function getContract(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

export function getReadOnlyContract() {
  const provider = new ethers.JsonRpcProvider(
    "https://rpc-amoy.polygon.technology"
  );
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}
