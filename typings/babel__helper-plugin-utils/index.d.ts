
declare module '@babel/helper-plugin-utils' {
  interface Api {
    assertVersion(version: number|string): void;
  }

  export function declare(callback: (api: Api) => Object): Object;
}
