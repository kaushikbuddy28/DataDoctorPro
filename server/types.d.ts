declare module 'papaparse' {
  export interface ParseConfig {
    header?: boolean;
    skipEmptyLines?: boolean;
    complete?: (results: { data: any[] }) => void;
    error?: (error: any) => void;
  }
  
  export function parse(file: File | string, config: ParseConfig): void;
  export function unparse(data: any[], config?: any): string;
}

// Add any other missing type declarations here if needed