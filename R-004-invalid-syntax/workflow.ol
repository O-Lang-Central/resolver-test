// resolver.ol (treated as a JS module in test)
module.exports = {
  resolverName: "RiskAssessment",
  inputs: [
    { name: "transaction_id", type: "string", required: true },
    { name: "user_id", type: "string", required: true }
  ],
  outputs: [
    { name: "risk_score", type: "number" },
    { name: "confidence", type: "number" }
  ],
  failures: [
    { code: "DATA_UNAVAILABLE", retries: 1 },
    { code: "MODEL_ERROR", retries: 0 }
  ]
};