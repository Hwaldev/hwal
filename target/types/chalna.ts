/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/chalna.json`.
 */
export type Chalna = {
  "address": "fSLsjTm9PGfbrAgosY2kYb1MnFEpn8LALo5cY5a4AkJ",
  "metadata": {
    "name": "chalna",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Chalna trigger engine program"
  },
  "instructions": [
    {
      "name": "cancelPosition",
      "discriminator": [
        238,
        238,
        23,
        104,
        199,
        77,
        104,
        68
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "position.nonce",
                "account": "position"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "initializeConfig",
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "feeReceiver"
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "feeBps",
          "type": "u16"
        },
        {
          "name": "keeperRewardBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "initializePriceFeed",
      "discriminator": [
        68,
        180,
        81,
        20,
        102,
        213,
        145,
        233
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority"
        },
        {
          "name": "feed",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  100
                ]
              },
              {
                "kind": "arg",
                "path": "symbol"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "symbol",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        },
        {
          "name": "decimals",
          "type": "u8"
        },
        {
          "name": "initialPrice",
          "type": "u64"
        }
      ]
    },
    {
      "name": "openPosition",
      "discriminator": [
        135,
        128,
        47,
        77,
        15,
        152,
        240,
        49
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "feed"
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u64"
        },
        {
          "name": "side",
          "type": "u8"
        },
        {
          "name": "collateral",
          "type": "u64"
        },
        {
          "name": "stopPrice",
          "type": "u64"
        },
        {
          "name": "takeProfitPrice",
          "type": "u64"
        },
        {
          "name": "trailingOffset",
          "type": "u64"
        }
      ]
    },
    {
      "name": "tickPosition",
      "discriminator": [
        244,
        148,
        111,
        216,
        109,
        113,
        126,
        86
      ],
      "accounts": [
        {
          "name": "keeper",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "feed"
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "position.owner",
                "account": "position"
              },
              {
                "kind": "account",
                "path": "position.nonce",
                "account": "position"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true
        },
        {
          "name": "feeReceiver",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "updateConfig",
      "discriminator": [
        29,
        158,
        252,
        191,
        10,
        83,
        219,
        99
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "newFeeReceiver",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "newFeeBps",
          "type": {
            "option": "u16"
          }
        },
        {
          "name": "newKeeperRewardBps",
          "type": {
            "option": "u16"
          }
        }
      ]
    },
    {
      "name": "updatePriceFeed",
      "discriminator": [
        28,
        9,
        93,
        150,
        86,
        153,
        188,
        115
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "feed",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "newPrice",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateTriggers",
      "discriminator": [
        35,
        227,
        40,
        24,
        79,
        230,
        48,
        14
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "position.nonce",
                "account": "position"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "stopPrice",
          "type": "u64"
        },
        {
          "name": "takeProfitPrice",
          "type": "u64"
        },
        {
          "name": "trailingOffset",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "position",
      "discriminator": [
        170,
        188,
        143,
        228,
        122,
        64,
        247,
        208
      ]
    },
    {
      "name": "priceFeed",
      "discriminator": [
        189,
        103,
        252,
        23,
        152,
        35,
        243,
        156
      ]
    }
  ],
  "events": [
    {
      "name": "configInitialized",
      "discriminator": [
        181,
        49,
        200,
        156,
        19,
        167,
        178,
        91
      ]
    },
    {
      "name": "positionCancelled",
      "discriminator": [
        209,
        176,
        193,
        59,
        248,
        28,
        12,
        180
      ]
    },
    {
      "name": "positionOpened",
      "discriminator": [
        237,
        175,
        243,
        230,
        147,
        117,
        101,
        121
      ]
    },
    {
      "name": "positionTicked",
      "discriminator": [
        67,
        136,
        78,
        38,
        71,
        147,
        197,
        158
      ]
    },
    {
      "name": "positionTriggered",
      "discriminator": [
        169,
        4,
        8,
        67,
        218,
        201,
        196,
        158
      ]
    },
    {
      "name": "priceFeedInitialized",
      "discriminator": [
        215,
        208,
        148,
        233,
        198,
        216,
        185,
        183
      ]
    },
    {
      "name": "priceFeedUpdated",
      "discriminator": [
        59,
        119,
        29,
        6,
        20,
        216,
        111,
        71
      ]
    },
    {
      "name": "triggersUpdated",
      "discriminator": [
        237,
        19,
        12,
        155,
        69,
        151,
        41,
        186
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "feeBpsTooHigh",
      "msg": "Fee bps exceeds maximum allowed"
    },
    {
      "code": 6001,
      "name": "keeperRewardTooHigh",
      "msg": "Keeper reward bps exceeds maximum allowed"
    },
    {
      "code": 6002,
      "name": "notAdmin",
      "msg": "Caller is not the configured admin"
    },
    {
      "code": 6003,
      "name": "notPositionOwner",
      "msg": "Caller is not the position owner"
    },
    {
      "code": 6004,
      "name": "notFeedAuthority",
      "msg": "Caller is not the price feed authority"
    },
    {
      "code": 6005,
      "name": "invalidSide",
      "msg": "Invalid position side: must be 0 (long) or 1 (short)"
    },
    {
      "code": 6006,
      "name": "collateralTooSmall",
      "msg": "Collateral is below the minimum allowed"
    },
    {
      "code": 6007,
      "name": "positionNotOpen",
      "msg": "Position is not open"
    },
    {
      "code": 6008,
      "name": "priceFeedStale",
      "msg": "Price feed has not been updated recently enough"
    },
    {
      "code": 6009,
      "name": "priceFeedZero",
      "msg": "Price feed price is zero"
    },
    {
      "code": 6010,
      "name": "invalidStopPrice",
      "msg": "Stop price is on the wrong side of entry for this side"
    },
    {
      "code": 6011,
      "name": "invalidTakeProfitPrice",
      "msg": "Take-profit price is on the wrong side of entry for this side"
    },
    {
      "code": 6012,
      "name": "invalidTrailingOffset",
      "msg": "Trailing offset is larger than entry price"
    },
    {
      "code": 6013,
      "name": "mathOverflow",
      "msg": "Math overflow"
    },
    {
      "code": 6014,
      "name": "trailingUnderflow",
      "msg": "Trailing extreme underflow"
    },
    {
      "code": 6015,
      "name": "insufficientVaultLamports",
      "msg": "Insufficient lamports in position vault"
    },
    {
      "code": 6016,
      "name": "invalidVault",
      "msg": "Position vault PDA does not match expected"
    },
    {
      "code": 6017,
      "name": "noTriggerHit",
      "msg": "No trigger condition met"
    },
    {
      "code": 6018,
      "name": "feedMismatch",
      "msg": "Feed mismatch: position was opened against a different feed"
    }
  ],
  "types": [
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "feeReceiver",
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "keeperRewardBps",
            "type": "u16"
          },
          {
            "name": "totalPositionsOpened",
            "type": "u64"
          },
          {
            "name": "totalPositionsTriggered",
            "type": "u64"
          },
          {
            "name": "totalPositionsCancelled",
            "type": "u64"
          },
          {
            "name": "totalFeesCollected",
            "type": "u64"
          },
          {
            "name": "totalKeeperRewardsPaid",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    },
    {
      "name": "configInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "keeperRewardBps",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "position",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "feed",
            "type": "pubkey"
          },
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "side",
            "type": "u8"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "triggerReason",
            "type": "u8"
          },
          {
            "name": "pad",
            "type": "u8"
          },
          {
            "name": "collateral",
            "type": "u64"
          },
          {
            "name": "entryPrice",
            "type": "u64"
          },
          {
            "name": "stopPrice",
            "type": "u64"
          },
          {
            "name": "takeProfitPrice",
            "type": "u64"
          },
          {
            "name": "trailingOffset",
            "type": "u64"
          },
          {
            "name": "trailingExtreme",
            "type": "u64"
          },
          {
            "name": "openedAt",
            "type": "i64"
          },
          {
            "name": "lastTickAt",
            "type": "i64"
          },
          {
            "name": "settledAt",
            "type": "i64"
          },
          {
            "name": "tickCount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "positionCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "position",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "collateralReturned",
            "type": "u64"
          },
          {
            "name": "cancelledAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "positionOpened",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "position",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "feed",
            "type": "pubkey"
          },
          {
            "name": "side",
            "type": "u8"
          },
          {
            "name": "collateral",
            "type": "u64"
          },
          {
            "name": "entryPrice",
            "type": "u64"
          },
          {
            "name": "stopPrice",
            "type": "u64"
          },
          {
            "name": "takeProfitPrice",
            "type": "u64"
          },
          {
            "name": "trailingOffset",
            "type": "u64"
          },
          {
            "name": "openedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "positionTicked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "position",
            "type": "pubkey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "trailingExtreme",
            "type": "u64"
          },
          {
            "name": "tickAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "positionTriggered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "position",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "triggerReason",
            "type": "u8"
          },
          {
            "name": "triggerPrice",
            "type": "u64"
          },
          {
            "name": "collateralReturned",
            "type": "u64"
          },
          {
            "name": "feePaid",
            "type": "u64"
          },
          {
            "name": "keeperReward",
            "type": "u64"
          },
          {
            "name": "keeper",
            "type": "pubkey"
          },
          {
            "name": "triggeredAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "priceFeed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "symbol",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "decimals",
            "type": "u8"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          },
          {
            "name": "updateCount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "priceFeedInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feed",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "symbol",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "decimals",
            "type": "u8"
          },
          {
            "name": "initialPrice",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "priceFeedUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feed",
            "type": "pubkey"
          },
          {
            "name": "oldPrice",
            "type": "u64"
          },
          {
            "name": "newPrice",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "updateCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "triggersUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "position",
            "type": "pubkey"
          },
          {
            "name": "stopPrice",
            "type": "u64"
          },
          {
            "name": "takeProfitPrice",
            "type": "u64"
          },
          {
            "name": "trailingOffset",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "configSeed",
      "type": "bytes",
      "value": "[99, 111, 110, 102, 105, 103]"
    },
    {
      "name": "feedSeed",
      "type": "bytes",
      "value": "[102, 101, 101, 100]"
    },
    {
      "name": "positionSeed",
      "type": "bytes",
      "value": "[112, 111, 115, 105, 116, 105, 111, 110]"
    },
    {
      "name": "vaultSeed",
      "type": "bytes",
      "value": "[118, 97, 117, 108, 116]"
    }
  ]
};
