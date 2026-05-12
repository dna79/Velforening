const statusLabels: Record<string, string> = {
  blocked: "Sperret",
  cancelled: "Avbestilt",
  confirmed: "Bekreftet",
  expired: "Utløpt",
  waiting_list: "Venteliste",
};

export function getBookingStatusLabel(status: string) {
  return statusLabels[status] ?? status;
}
