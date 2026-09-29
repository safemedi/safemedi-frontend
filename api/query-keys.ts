export const queryKeys = {
  auth: {
    logout: ["auth", "logout"] as const,
  },
  dashboard: {
    todayMedicationSchedules: ["dashboard", "medication-records", "today"] as const,
  },
  medications: {
    all: ["medications"] as const,
    records: (type: string, date: string, familyId?: number) =>
      ["medications", "records", type, date, familyId ?? "self"] as const,
    statistics: (startDate: string, endDate: string) =>
      ["medications", "statistics", startDate, endDate] as const,
  },
  user: {
    me: ["user", "me"] as const,
    deleteAccount: ["user", "delete-account"] as const,
  },
  family: {
    list: ["family", "list"] as const,
    invitation: (token: string) => ["family", "invitation", token] as const,
  },
  profile: {
    families: ["family", "list"] as const,
    notificationSettings: ["profile", "notification-settings"] as const,
    searchDrugAllergies: (keyword: string) =>
      ["profile", "drug-allergies", "search", keyword] as const,
    searchDiseases: (keyword: string) => ["profile", "diseases", "search", keyword] as const,
  },
  prescriptions: {
    list: ["prescriptions", "list"] as const,
    detail: (prescriptionId: number) => ["prescriptions", "detail", prescriptionId] as const,
  },
  scan: {
    createPrescription: ["scan", "prescription", "create"] as const,
    analyzeIngredients: ["scan", "ingredients", "analyze"] as const,
    searchDrugs: (keyword: string) => ["scan", "drugs", "search", keyword] as const,
  },
  map: {
    nearbyFacilities: (
      latitude: number,
      longitude: number,
      category: "all" | "pharmacy" | "emergency",
      keyword: string,
    ) => ["map", "nearby-facilities", latitude, longitude, category, keyword] as const,
  },
  notification: {
    list: (page: number, size: number) => ["notification", "list", page, size] as const,
    unreadCount: ["notification", "unread-count"] as const,
  },
} as const;
