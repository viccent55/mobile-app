export default function useSnackbar() {
  const uiActions = inject<{
    triggerSnackbar: (
      msg: string,
      color?: string,
      location?: string,
      timeout?: number
    ) => void;
    showChatWidget: () => void;
  }>("uiActions");

  if (!uiActions) {
    throw new Error("uiActions is not provided");
  }

  return {
    showSnackbar: uiActions.triggerSnackbar,
    showChatWidget: uiActions.showChatWidget,
  };
}
