export interface TimerResolutionState {
  current100ns: number;
  nexusRequested100ns: number | null;
  default100ns: number;
  minimum100ns: number;
  maximum100ns: number;
}

export interface CoreParkingState {
  minCoresPercentAc: number;
  minCoresPercentDc: number;
  activePlanGuid: string;
  activePlanName: string;
}
