declare module "react-use-keypress" {
  function useKeypress(
    keys: string | string[],
    callback: (event: KeyboardEvent) => void
  ): void;
  export default useKeypress;
}
