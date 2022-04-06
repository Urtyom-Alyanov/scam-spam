export const setTimeoutAsync = <ReturnT>(
  callback: () => ReturnT,
  ms?: number
) =>
  new Promise<ReturnT>((resolve) => {
    setTimeout(() => resolve(callback()), ms);
  });
