const FLOW_RESTART_KEY = "royaume:flow-restart";

export function markFlowRestart(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(FLOW_RESTART_KEY, "1");
}

export function hasFlowRestart(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(FLOW_RESTART_KEY) === "1";
}

export function consumeFlowRestart(): boolean {
  if (!hasFlowRestart()) {
    return false;
  }

  window.sessionStorage.removeItem(FLOW_RESTART_KEY);
  return true;
}
