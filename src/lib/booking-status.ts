const statusLabels: Record<string, string> = {
  blocked: "Sperret",
  cancelled: "Kansellert",
  confirmed: "Bekreftet",
  completed: "Gjennomført",
  waiting_list: "Venteliste",
  requested: "Forespurt",
  approved: "Godkjent",
  rejected: "Avslått",
  expired: "Utløpt",
};

export function getBookingStatusLabel(status: string) {
  return statusLabels[status] ?? status;
}
