export const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

export const mockData = {
  shipments: {
    shipments: [
      {
        id: "shp_001",
        user_id: "user_1",
        direction: "IMPORT_EU",
        destination_country: "DE",
        origin_country_default: "CN",
        incoterm: "CIF",
        currency: "EUR",
        fx_rate_to_gbp: "0.86",
        fx_rate_to_eur: "1.00",
        import_date: "2026-02-07",
        status: "READY"
      }
    ]
  },
  complianceTasks: [
    { id: "c1", title: "REACH certificate check", due: "2026-02-10", severity: "High", status: "Open" },
    { id: "c2", title: "Supplier origin proof", due: "2026-02-12", severity: "Medium", status: "In Progress" }
  ],
  passportItems: [
    { id: "p1", name: "Aluminium billet", code: "76011000", description: "Primary aluminium", weight: 1200, supplier: "NordMet", notes: "Certified" }
  ],
  collaborationLicenses: [
    { id: "l1", name: "UK Steel Import License", expiry: "2026-08-20", status: "Active" }
  ],
  marketInsights: [
    { id: "m1", title: "EU aluminium demand softening", summary: "Q1 outlook shows 4% drop", date: "2026-02-05" }
  ]
};
