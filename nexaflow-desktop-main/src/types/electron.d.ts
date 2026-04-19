export {};

declare global {
  interface Window {
    electron: {
      queryDB: (sql: string, params?: any[]) => Promise<any[]>;
      getCompByDept: (dept: string) => Promise<any[]>;
      getHeadcount: () => Promise<{ lieu: string; count: number }[]>;
      getTurnoverRisk: (dept?: string) => Promise<any[]>;
    };
  }
}
